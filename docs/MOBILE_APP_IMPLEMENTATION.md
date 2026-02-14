# Mobile App Technical Implementation Plan

**Target**: React Native Mobile App (Current Workspace)  
**Purpose**: Adapt mobile app to operational-only architecture  
**Timeline**: Weeks 3-8 of migration

---

## 1. Directory Structure Changes

### Remove/Archive Admin Screens

```bash
# Option 1: Delete (recommended after Web Admin is live)
rm -rf app/(admin)/

# Option 2: Move to archive (during transition)
mkdir -p _archive/
mv app/(admin)/ _archive/admin-screens/
```

### Keep Only Operational Screens

```
app/
├── (auth)/              # ✅ KEEP - Login, signup
├── (brigadista)/        # ✅ KEEP - Brigadista operations
├── (encargado)/         # ✅ KEEP - Supervisor operations
├── profile.tsx          # ✅ KEEP - User profile
├── _layout.tsx          # ✅ KEEP - Root layout
└── (admin)/             # ❌ REMOVE - Admin operations
```

---

## 2. API Service Layer

### Create Typed API Client

**File**: `lib/api/survey-api.ts`

```typescript
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SurveySchema {
  title: string;
  description: string;
  sections: SurveySection[];
  validation_rules: ValidationRule[];
  conditional_logic: ConditionalLogic[];
  submission_rules: SubmissionRule[];
}

export interface SurveyVersion {
  id: string;
  survey_id: string;
  version: number;
  schema: SurveySchema;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  created_at: string;
  activated_at: string | null;
}

export interface AssignedSurvey {
  survey_id: string;
  survey_version_id: string;
  title: string;
  description: string;
  assigned_at: string;
  deadline: string | null;
}

/**
 * Fetch surveys assigned to the current user
 * Only returns ACTIVE surveys
 */
export async function fetchAssignedSurveys(): Promise<AssignedSurvey[]> {
  const { data, error } = await supabase
    .from("survey_assignments")
    .select(
      `
      survey_id,
      assigned_at,
      deadline,
      surveys!inner (
        id,
        title,
        description,
        survey_versions!inner (
          id,
          version,
          status
        )
      )
    `,
    )
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("status", "ACTIVE")
    .eq("surveys.survey_versions.status", "ACTIVE");

  if (error) throw error;

  return data.map((assignment) => ({
    survey_id: assignment.survey_id,
    survey_version_id: assignment.surveys.survey_versions[0].id,
    title: assignment.surveys.title,
    description: assignment.surveys.description,
    assigned_at: assignment.assigned_at,
    deadline: assignment.deadline,
  }));
}

/**
 * Fetch survey schema by version ID
 * Caches schema locally to support offline access
 */
export async function fetchSurveySchema(
  surveyVersionId: string,
): Promise<SurveySchema> {
  const cacheKey = `survey_schema_${surveyVersionId}`;

  // Try cache first
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from backend
  const { data, error } = await supabase
    .from("survey_versions")
    .select("schema")
    .eq("id", surveyVersionId)
    .eq("status", "ACTIVE")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Survey version not found");

  // Cache for offline use
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data.schema));

  return data.schema;
}

/**
 * Check if cached survey schema is still valid
 * Returns true if version has changed
 */
export async function hasSurveySchemaChanged(
  surveyVersionId: string,
  cachedSchema: SurveySchema,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("survey_versions")
      .select("schema, version")
      .eq("id", surveyVersionId)
      .eq("status", "ACTIVE")
      .single();

    if (error || !data) return true; // Assume changed if error

    // Compare version or schema hash
    return JSON.stringify(data.schema) !== JSON.stringify(cachedSchema);
  } catch {
    return false; // Don't invalidate cache on network error
  }
}

/**
 * Clear cached survey schemas
 * Call when user logs out or on demand
 */
export async function clearSurveyCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const surveyKeys = keys.filter((key) => key.startsWith("survey_schema_"));
  await AsyncStorage.multiRemove(surveyKeys);
}
```

---

## 3. Response Queue System

### Update Response Queue

**File**: `lib/offline/response-queue.ts`

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const QUEUE_KEY = "response_queue";

export interface QueuedResponse {
  id: string; // Local UUID
  survey_id: string;
  survey_version_id: string; // CRITICAL: Track version
  user_id: string;
  data: Record<string, any>; // Response data
  documents: DocumentUpload[]; // Attached documents
  created_at: string; // Client timestamp
  status: "DRAFT" | "COMPLETED" | "SYNCING" | "SYNCED" | "ERROR";
  retry_count: number;
  last_error: string | null;
}

export interface DocumentUpload {
  id: string;
  type: "INE" | "PROOF_OF_ADDRESS" | "PHOTO" | "OTHER";
  uri: string; // Local file URI
  uploaded_url: string | null; // Cloudinary URL after upload
  status: "PENDING" | "UPLOADING" | "UPLOADED" | "ERROR";
}

/**
 * Add response to queue
 */
export async function queueResponse(
  response: Omit<
    QueuedResponse,
    "id" | "status" | "retry_count" | "last_error"
  >,
): Promise<string> {
  const queue = await getQueue();

  const queuedResponse: QueuedResponse = {
    ...response,
    id: generateUUID(),
    status: "COMPLETED",
    retry_count: 0,
    last_error: null,
  };

  queue.push(queuedResponse);
  await saveQueue(queue);

  return queuedResponse.id;
}

/**
 * Get all queued responses
 */
export async function getQueue(): Promise<QueuedResponse[]> {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save queue to storage
 */
async function saveQueue(queue: QueuedResponse[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Sync all queued responses
 */
export async function syncQueue(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const queue = await getQueue();
  const pending = queue.filter(
    (r) => r.status === "COMPLETED" || r.status === "ERROR",
  );

  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const response of pending) {
    try {
      // 1. Validate token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // 2. Check token expiration
      const tokenExpired = new Date(session.expires_at! * 1000) < new Date();
      if (tokenExpired) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error("Token expired - please re-login");
        }
      }

      // 3. Check if survey version still active
      const { data: versionData, error: versionError } = await supabase
        .from("survey_versions")
        .select("status")
        .eq("id", response.survey_version_id)
        .single();

      if (versionError || versionData?.status !== "ACTIVE") {
        throw new Error("Survey version no longer active");
      }

      // 4. Upload documents
      for (const doc of response.documents) {
        if (doc.status !== "UPLOADED") {
          const uploadedUrl = await uploadDocument(doc);
          doc.uploaded_url = uploadedUrl;
          doc.status = "UPLOADED";
        }
      }

      // 5. Submit response
      const { error: submitError } = await supabase.from("responses").insert({
        survey_id: response.survey_id,
        survey_version_id: response.survey_version_id,
        user_id: response.user_id,
        data: response.data,
        documents: response.documents.map((d) => d.uploaded_url),
        submitted_at: response.created_at,
      });

      if (submitError) throw submitError;

      // 6. Mark as synced
      response.status = "SYNCED";
      success++;
    } catch (error) {
      response.status = "ERROR";
      response.retry_count++;
      response.last_error = (error as Error).message;
      failed++;
      errors.push({ id: response.id, error: response.last_error });
    }
  }

  // Save updated queue
  await saveQueue(queue);

  return { success, failed, errors };
}

/**
 * Upload document to Cloudinary
 */
async function uploadDocument(doc: DocumentUpload): Promise<string> {
  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", {
    uri: doc.uri,
    type: "image/jpeg",
    name: `${doc.id}.jpg`,
  } as any);
  formData.append("upload_preset", "your_preset"); // Configure in Cloudinary

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();
  return data.secure_url;
}

/**
 * Clear synced responses from queue
 */
export async function clearSyncedResponses(): Promise<void> {
  const queue = await getQueue();
  const unsynced = queue.filter((r) => r.status !== "SYNCED");
  await saveQueue(unsynced);
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

---

## 4. Token Management

### Add Token Refresh Hook

**File**: `hooks/use-token-refresh.ts`

```typescript
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/lib/supabase";

/**
 * Hook to refresh auth token when app comes to foreground
 * Ensures deactivated users lose access within token expiration period
 */
export function useTokenRefresh() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        // App transitioned from background to foreground
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          await refreshTokenIfNeeded();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

/**
 * Refresh token if expired or near expiration
 */
async function refreshTokenIfNeeded(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("No session found");
      return;
    }

    const expiresAt = new Date(session.expires_at! * 1000);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    // Refresh if expired or expiring within 5 minutes
    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
      console.log("Refreshing token...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Token refresh failed:", error.message);
        // Force re-login
        await supabase.auth.signOut();
      } else {
        console.log("Token refreshed successfully");
      }
    }
  } catch (error) {
    console.error("Token refresh error:", error);
  }
}
```

### Update Auth Context

**File**: `contexts/auth-context.tsx`

```typescript
// Add to AuthProvider

import { useTokenRefresh } from '@/hooks/use-token-refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...

  // Add token refresh hook
  useTokenRefresh();

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 5. Dynamic Survey Renderer

### Create Question Renderer Component

**File**: `components/survey/question-renderer.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { DatePicker } from '@/components/ui/date-picker';
import { DocumentUpload } from '@/components/survey/document-upload';

interface Question {
  id: string;
  type: 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'date' | 'document';
  label: string;
  description?: string;
  required: boolean;
  props?: Record<string, any>;
  options?: Array<{ label: string; value: string }>;
}

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
}: QuestionRendererProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {question.label}
        {question.required && <Text style={styles.required}> *</Text>}
      </Text>

      {question.description && (
        <Text style={styles.description}>{question.description}</Text>
      )}

      {renderQuestionInput()}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  function renderQuestionInput() {
    switch (question.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChangeText={onChange}
            placeholder={question.props?.placeholder}
            multiline={question.props?.multiline}
            numberOfLines={question.props?.numberOfLines}
          />
        );

      case 'number':
        return (
          <Input
            value={value?.toString() || ''}
            onChangeText={(text) => onChange(parseFloat(text) || null)}
            keyboardType="numeric"
            placeholder={question.props?.placeholder}
          />
        );

      case 'single_choice':
        return (
          <RadioGroup
            options={question.options || []}
            value={value}
            onChange={onChange}
          />
        );

      case 'multiple_choice':
        return (
          <CheckboxGroup
            options={question.options || []}
            value={value || []}
            onChange={onChange}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={onChange}
            mode={question.props?.mode || 'date'}
          />
        );

      case 'document':
        return (
          <DocumentUpload
            value={value}
            onChange={onChange}
            documentType={question.props?.documentType}
          />
        );

      default:
        return <Text>Unsupported question type: {question.type}</Text>;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});
```

### Create Survey Form Container

**File**: `components/survey/survey-form.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { QuestionRenderer } from './question-renderer';
import { Button } from '@/components/ui/button';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import type { SurveySchema } from '@/lib/api/survey-api';

interface SurveyFormProps {
  schema: SurveySchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
}

export function SurveyForm({ schema, onSubmit, initialData }: SurveyFormProps) {
  const { contentPadding } = useTabBarHeight();
  const [responses, setResponses] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate
    const validationErrors = validateResponses();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responses);
    } catch (error) {
      console.error('Submit error:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateResponses = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate all sections and questions
    schema.sections.forEach(section => {
      section.questions.forEach(question => {
        const value = responses[question.id];

        // Check required
        if (question.required && !value) {
          errors[question.id] = 'Este campo es obligatorio';
        }

        // Apply custom validation rules
        schema.validation_rules
          .filter(rule => rule.field === question.id)
          .forEach(rule => {
            if (!evaluateValidationRule(rule, value)) {
              errors[question.id] = rule.error_message;
            }
          });
      });
    });

    return errors;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
    >
      {schema.sections.map(section => (
        <View key={section.id} style={styles.section}>
          {section.title && (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          {section.description && (
            <Text style={styles.sectionDescription}>{section.description}</Text>
          )}

          {section.questions.map(question => {
            // Check conditional logic
            const shouldShow = evaluateConditionalLogic(question.id, responses, schema.conditional_logic);
            if (!shouldShow) return null;

            return (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={responses[question.id]}
                onChange={(value) => handleChange(question.id, value)}
                error={errors[question.id]}
              />
            );
          })}
        </View>
      ))}

      <Button
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Enviar Respuestas
      </Button>
    </ScrollView>
  );
}

function evaluateValidationRule(rule: any, value: any): boolean {
  // Implement validation logic based on rule type
  switch (rule.type) {
    case 'min_length':
      return value?.length >= rule.value;
    case 'max_length':
      return value?.length <= rule.value;
    case 'min_value':
      return value >= rule.value;
    case 'max_value':
      return value <= rule.value;
    case 'regex':
      return new RegExp(rule.pattern).test(value);
    default:
      return true;
  }
}

function evaluateConditionalLogic(
  questionId: string,
  responses: Record<string, any>,
  logic: any[]
): boolean {
  const rules = logic.filter(l => l.target_question_id === questionId);
  if (rules.length === 0) return true; // Show by default

  // Evaluate all rules (AND logic)
  return rules.every(rule => {
    const sourceValue = responses[rule.source_question_id];

    switch (rule.operator) {
      case 'equals':
        return sourceValue === rule.value;
      case 'not_equals':
        return sourceValue !== rule.value;
      case 'contains':
        return Array.isArray(sourceValue) && sourceValue.includes(rule.value);
      case 'greater_than':
        return sourceValue > rule.value;
      case 'less_than':
        return sourceValue < rule.value;
      default:
        return true;
    }
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
});
```

---

## 6. Update Routing

### Remove Admin Routes

**File**: `app/_layout.tsx`

```typescript
// Remove admin routing logic
// Keep only:
// - (auth)
// - (brigadista)
// - (encargado)
// - profile

export default function RootLayout() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route based on role
  if (role === 'BRIGADISTA') {
    return <Redirect href="/(brigadista)" />;
  }

  if (role === 'ENCARGADO') {
    return <Redirect href="/(encargado)" />;
  }

  // ADMIN users should use Web Admin
  // For now, show message or redirect to profile
  if (role === 'ADMIN') {
    return (
      <View>
        <Text>Por favor usa el panel de administración web.</Text>
        <Button onPress={() => Linking.openURL('https://admin.yourdomain.com')}>
          Abrir Web Admin
        </Button>
      </View>
    );
  }

  return <Redirect href="/profile" />;
}
```

---

## 7. Update Environment Variables

**File**: `.env`

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key  # NEVER use service_role here!

# Token expiration (in seconds)
EXPO_PUBLIC_TOKEN_EXPIRATION=3600           # 1 hour
EXPO_PUBLIC_REFRESH_TOKEN_EXPIRATION=604800 # 7 days

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# Web Admin URL
EXPO_PUBLIC_WEB_ADMIN_URL=https://admin.yourdomain.com
```

---

## 8. Testing Requirements

### Unit Tests

```typescript
// lib/api/__tests__/survey-api.test.ts
describe("fetchAssignedSurveys", () => {
  it("should fetch only active surveys", async () => {
    // Test implementation
  });

  it("should handle network errors", async () => {
    // Test implementation
  });
});

// lib/offline/__tests__/response-queue.test.ts
describe("syncQueue", () => {
  it("should validate token before sync", async () => {
    // Test expired token scenario
  });

  it("should check survey version is active", async () => {
    // Test archived version scenario
  });

  it("should handle partial sync failures", async () => {
    // Test batch sync with some failures
  });
});
```

### Integration Tests

```typescript
// e2e/survey-flow.test.ts
describe("Survey Flow", () => {
  it("should fetch survey, render dynamically, and submit", async () => {
    // 1. Login
    // 2. Fetch assigned surveys
    // 3. Select survey
    // 4. Fetch schema
    // 5. Render questions
    // 6. Fill responses
    // 7. Submit
    // 8. Verify queue
    // 9. Sync
    // 10. Verify backend
  });
});
```

---

## 9. Migration Checklist

- [ ] Install dependencies: `npm install @react-native-async-storage/async-storage`
- [ ] Create `lib/api/survey-api.ts`
- [ ] Create `lib/offline/response-queue.ts`
- [ ] Create `hooks/use-token-refresh.ts`
- [ ] Update `contexts/auth-context.tsx`
- [ ] Create `components/survey/question-renderer.tsx`
- [ ] Create `components/survey/survey-form.tsx`
- [ ] Remove/archive `app/(admin)/` directory
- [ ] Update `app/_layout.tsx`
- [ ] Update `.env` file
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test offline scenarios
- [ ] Test token expiration
- [ ] Test survey version changes
- [ ] Update README.md

---

## 10. Performance Considerations

### Caching Strategy

- Cache survey schemas locally (AsyncStorage)
- Invalidate cache when version changes
- Limit cache size (remove old schemas after 30 days)

### Sync Strategy

- Batch sync (max 10 responses per batch)
- Retry failed syncs with exponential backoff
- Show sync progress indicator
- Allow manual sync trigger

### Rendering Optimization

- Use `React.memo` for question components
- Lazy load sections (render on scroll)
- Debounce validation (500ms)
- Optimize conditional logic evaluation

---

**Last Updated**: February 13, 2026  
**Status**: Ready for implementation
