# Architecture Separation: Web Admin vs Mobile App

**Last Updated**: February 13, 2026  
**Status**: 🔴 CRITICAL - Requires Immediate Implementation

---

## 📋 Executive Summary

This document defines the **strict separation** between administrative functions (Web Admin) and operational functions (Mobile App). This restructuring is essential for security, maintainability, and proper role segregation.

---

## 🎯 Core Principle

> **ALL administrative actions occur ONLY in the Web Admin panel.**  
> **The mobile app is STRICTLY operational.**

---

## 🏗️ System Boundaries

### **Web Admin (Next.js) - Control Plane**

**Purpose**: Configuration, management, and oversight  
**Users**: Administrators only  
**Access**: Web browser, authenticated session

**Responsibilities**:

- ✅ Create surveys
- ✅ Edit survey structure (questions, logic, validation)
- ✅ Version surveys
- ✅ Activate/deactivate surveys
- ✅ Create users (all roles)
- ✅ Manage user permissions
- ✅ Assign surveys to supervisors/brigadistas
- ✅ Configure data validation rules
- ✅ Set up integrity constraints
- ✅ View analytics and reports
- ✅ Export data
- ✅ Configure system settings

**Tech Stack**:

- Next.js 14+ (App Router)
- React Server Components
- Supabase Admin SDK
- PostgreSQL with RLS policies (admin-level access)

---

### **Mobile App (React Native/Expo) - Execution Plane**

**Purpose**: Field data collection and operational work  
**Users**: Brigadistas, Supervisors (Encargados)  
**Access**: Mobile devices (iOS/Android)

**Responsibilities**:

- ✅ Authenticate users
- ✅ Fetch assigned surveys (based on role and assignments)
- ✅ Render surveys dynamically from JSON schema
- ✅ Capture responses
- ✅ Capture documents (INE, proof of address, photos)
- ✅ Work offline-first
- ✅ Queue responses for sync
- ✅ Sync when online
- ✅ Display operational dashboards (my tasks, my progress)
- ✅ View read-only survey history

**Restrictions** (NEVER allowed):

- ❌ Create surveys
- ❌ Modify survey structure
- ❌ Create users
- ❌ Assign surveys
- ❌ Change user roles
- ❌ Configure system settings
- ❌ Access admin analytics

**Tech Stack**:

- React Native + Expo
- Expo Router (file-based routing)
- Supabase Client SDK (restricted RLS policies)
- AsyncStorage (offline queue)
- NetInfo (connectivity detection)

---

## 🔒 Security & Access Control

### Backend RBAC Enforcement

**PostgreSQL Row-Level Security (RLS) Policies**:

```sql
-- Admin: Full access via Web Admin (service_role key or admin-level JWT)
-- Supervisor (Encargado): Read assigned surveys, write responses
-- Brigadista: Read assigned surveys, write responses
-- Public: No access

-- Example: surveys table
CREATE POLICY "Admins have full access"
ON surveys
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Users can read assigned surveys"
ON surveys
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT survey_id FROM survey_assignments
    WHERE user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Users cannot create/modify surveys"
ON surveys
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (false);
```

### API Key Separation

| Key Type              | Usage                       | Access Level                               |
| --------------------- | --------------------------- | ------------------------------------------ |
| **service_role**      | Web Admin backend only      | Full database access, bypasses RLS         |
| **anon**              | Mobile app public endpoints | No authentication required (login, signup) |
| **authenticated JWT** | Mobile app user endpoints   | RLS-enforced, role-based access            |

**Critical**: Mobile app MUST use `anon` or `authenticated` JWT keys. NEVER embed `service_role` key in mobile app.

---

## 🌐 API Endpoint Architecture

### **Admin Endpoints** (Web Admin Only)

**Base URL**: `/api/admin/*`  
**Authentication**: Service role or admin JWT  
**RLS**: Often bypassed (admin privileges)

```typescript
// Survey Management
POST   /api/admin/surveys                    // Create survey
PUT    /api/admin/surveys/:id                // Update survey structure
POST   /api/admin/surveys/:id/version        // Create new version
PATCH  /api/admin/surveys/:id/activate       // Activate version
PATCH  /api/admin/surveys/:id/deactivate     // Deactivate survey
DELETE /api/admin/surveys/:id                // Archive survey

// User Management
POST   /api/admin/users                      // Create user
PUT    /api/admin/users/:id                  // Update user
PATCH  /api/admin/users/:id/role             // Change role
PATCH  /api/admin/users/:id/deactivate       // Deactivate user
DELETE /api/admin/users/:id                  // Delete user

// Assignment Management
POST   /api/admin/assignments                // Create assignment
PUT    /api/admin/assignments/:id            // Update assignment
DELETE /api/admin/assignments/:id            // Remove assignment

// Analytics & Reports
GET    /api/admin/analytics/surveys          // Survey analytics
GET    /api/admin/analytics/users            // User analytics
GET    /api/admin/reports/responses          // Response reports
POST   /api/admin/exports/csv                // Export data
```

---

### **Operational Endpoints** (Mobile App)

**Base URL**: `/api/mobile/*` or `/api/v1/*`  
**Authentication**: User JWT  
**RLS**: Strictly enforced

```typescript
// Authentication
POST   /api/mobile/auth/login                // Login
POST   /api/mobile/auth/refresh              // Refresh token
POST   /api/mobile/auth/logout               // Logout

// Survey Fetching (Read-Only)
GET    /api/mobile/surveys/assigned          // Get assigned surveys
GET    /api/mobile/surveys/:id/schema        // Get survey JSON schema (versioned)
GET    /api/mobile/surveys/:id/metadata      // Get survey metadata

// Response Submission
POST   /api/mobile/responses                 // Submit response
PATCH  /api/mobile/responses/:id             // Update draft response
GET    /api/mobile/responses/pending         // Get pending sync queue
POST   /api/mobile/responses/sync            // Batch sync responses

// Document Upload
POST   /api/mobile/documents/upload          // Upload documents (INE, etc.)
GET    /api/mobile/documents/:id             // Get document metadata

// User Profile (Read-Only)
GET    /api/mobile/me                        // Get current user profile
GET    /api/mobile/me/stats                  // Get user statistics
```

---

## 📦 Survey Schema & Versioning

### Survey Version Model

```typescript
interface SurveyVersion {
  id: string;
  survey_id: string;
  version: number; // Incremental version number
  schema: SurveySchema; // Complete survey definition (JSON)
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  created_by: string;
  created_at: string;
  activated_at: string | null;
  archived_at: string | null;
  is_immutable: boolean; // True once activated
  changelog: string; // What changed in this version
}

interface SurveySchema {
  title: string;
  description: string;
  sections: SurveySection[];
  validation_rules: ValidationRule[];
  conditional_logic: ConditionalLogic[];
  submission_rules: SubmissionRule[];
}
```

### Immutability Rules

1. **Draft Status**: Survey can be edited freely in Web Admin
2. **Active Status**: Survey becomes **immutable** - no structural changes allowed
3. **Archived Status**: Survey is read-only, no longer assignable

**To modify an active survey**:

- Create a new version (increments version number)
- Edit the new version (still draft)
- Activate the new version when ready
- Old version automatically archives

**Mobile app behavior**:

- Always fetches the **active version** of assigned surveys
- Uses `version` field to detect schema changes
- Clears local cache if version changes
- Responses include `survey_version_id` for data integrity

---

## 📱 Mobile App Dynamic Rendering

### Current Problem

❌ Hardcoded survey structures in React Native screens  
❌ Survey changes require mobile app updates  
❌ No version control on responses

### Solution: Dynamic Schema Rendering

**1. Fetch Survey Schema**

```typescript
// Mobile app fetches JSON schema
const survey = await supabase
  .from("survey_versions")
  .select("schema")
  .eq("survey_id", surveyId)
  .eq("status", "ACTIVE")
  .single();

const schema: SurveySchema = survey.data.schema;
```

**2. Render Dynamically**

```typescript
// Universal question renderer
function QuestionRenderer({ question, value, onChange }: QuestionProps) {
  switch (question.type) {
    case 'text':
      return <TextInput {...question.props} value={value} onChangeText={onChange} />;
    case 'single_choice':
      return <RadioGroup options={question.options} value={value} onChange={onChange} />;
    case 'multiple_choice':
      return <CheckboxGroup options={question.options} value={value} onChange={onChange} />;
    case 'number':
      return <NumberInput {...question.props} value={value} onChange={onChange} />;
    case 'date':
      return <DatePicker {...question.props} value={value} onChange={onChange} />;
    case 'document':
      return <DocumentUpload {...question.props} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
```

**3. Apply Validation Dynamically**

```typescript
function validateResponse(
  schema: SurveySchema,
  response: Response,
): ValidationResult {
  const errors: ValidationError[] = [];

  schema.validation_rules.forEach((rule) => {
    if (!evaluateRule(rule, response)) {
      errors.push({
        field: rule.field,
        message: rule.error_message,
      });
    }
  });

  return { valid: errors.length === 0, errors };
}
```

---

## 🔄 Offline-First Architecture

### Response Queue System

```typescript
interface QueuedResponse {
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
```

### Sync Strategy

```typescript
async function syncResponses() {
  const pending = await getQueuedResponses();

  for (const response of pending) {
    try {
      // 1. Validate token is still valid
      const tokenValid = await validateToken();
      if (!tokenValid) {
        throw new Error("Token expired - user may be deactivated");
      }

      // 2. Check if survey version still active
      const versionActive = await checkSurveyVersionActive(
        response.survey_version_id,
      );
      if (!versionActive) {
        throw new Error("Survey version no longer active");
      }

      // 3. Upload documents first
      if (response.documents.length > 0) {
        await uploadDocuments(response.documents);
      }

      // 4. Submit response
      await submitResponse(response);

      // 5. Mark as synced
      await markAsSynced(response.id);
    } catch (error) {
      await handleSyncError(response.id, error);
    }
  }
}
```

---

## 🔐 Token Expiration & Security

### Problem: Indefinite Offline Access

If a user is deactivated in Web Admin but has a valid JWT cached on their mobile device, they could continue working offline indefinitely.

### Solution: Short-Lived Tokens + Refresh Strategy

**Token Configuration**:

```typescript
// Supabase JWT config
{
  accessTokenExpiresIn: 3600,      // 1 hour
  refreshTokenExpiresIn: 604800,   // 7 days
}
```

**Mobile App Behavior**:

1. **On app launch**: Check token expiration
2. **If expired**: Attempt refresh
3. **If refresh fails**: Force re-login
4. **Before sync**: Always validate token
5. **Background refresh**: Every time app comes to foreground

**Backend Validation**:

```sql
-- Check if user is active
CREATE OR REPLACE FUNCTION is_user_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT is_active FROM users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy: Reject requests from inactive users
CREATE POLICY "Inactive users cannot access"
ON responses
FOR ALL
TO authenticated
USING (is_user_active(auth.uid()));
```

**Result**: Deactivated users lose access within 1 hour maximum (when access token expires).

---

## 🚧 Migration Plan

### Phase 1: Backend API Separation (Week 1-2)

- [ ] Create `/api/admin/*` endpoints with service_role auth
- [ ] Create `/api/mobile/*` endpoints with user JWT auth
- [ ] Implement RLS policies for all tables
- [ ] Document API contracts (OpenAPI/Swagger)
- [ ] Test admin vs mobile access boundaries

### Phase 2: Survey Versioning (Week 3-4)

- [ ] Create `survey_versions` table
- [ ] Implement version creation logic in Web Admin
- [ ] Add immutability constraints
- [ ] Migrate existing surveys to versioned schema
- [ ] Update mobile app to fetch versioned schemas

### Phase 3: Dynamic Rendering (Week 5-6)

- [ ] Build universal question renderer component
- [ ] Implement dynamic validation engine
- [ ] Test with various question types
- [ ] Handle schema updates gracefully
- [ ] Add loading states and error handling

### Phase 4: Mobile App Cleanup (Week 7)

- [ ] Remove admin screens from mobile app
- [ ] Remove user creation flows
- [ ] Remove survey creation flows
- [ ] Update routing (remove admin routes)
- [ ] Simplify auth context (remove admin checks)

### Phase 5: Token Security (Week 8)

- [ ] Implement token refresh on app foreground
- [ ] Add token validation before sync
- [ ] Test deactivation scenarios
- [ ] Monitor token expiration logs
- [ ] Document offline access limitations

### Phase 6: Testing & Documentation (Week 9-10)

- [ ] End-to-end testing (Web Admin → Mobile)
- [ ] Security audit (penetration testing)
- [ ] Performance testing (offline sync)
- [ ] Update user documentation
- [ ] Train administrators

---

## 📊 Current State Assessment

### ✅ Already Implemented

- Basic authentication flow
- Role-based routing
- Offline-first response storage
- Sync queue system
- Theme support
- Tab bar navigation

### ⚠️ Needs Modification

- **Admin screens in mobile app** → Remove or mark as deprecated
- **Hardcoded survey structures** → Replace with dynamic rendering
- **No survey versioning** → Implement version control
- **RLS policies** → Audit and strengthen
- **Token refresh** → Add foreground refresh

### ❌ Missing Critical Features

- Web Admin panel (Next.js) - **DOES NOT EXIST YET**
- Survey version immutability
- Admin API endpoints
- Dynamic survey schema fetching
- Document upload flow
- Token expiration enforcement on sync

---

## 📖 Database Schema Adjustments

### New Tables Required

```sql
-- Survey Versions (replaces direct survey edits)
CREATE TABLE survey_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  schema JSONB NOT NULL,
  status TEXT CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  is_immutable BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  changelog TEXT,
  UNIQUE(survey_id, version)
);

-- Track which version was used for each response
ALTER TABLE responses
ADD COLUMN survey_version_id UUID REFERENCES survey_versions(id);

-- Audit log for admin actions
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies Update

```sql
-- Mobile users CANNOT create surveys
CREATE POLICY "Only admins can create surveys"
ON surveys
FOR INSERT
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Mobile users CAN read only assigned surveys
CREATE POLICY "Users can read assigned surveys"
ON surveys
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT sa.survey_id
    FROM survey_assignments sa
    WHERE sa.user_id = auth.uid()
    AND sa.status = 'ACTIVE'
  )
  OR
  auth.jwt() ->> 'role' = 'ADMIN'
);

-- Mobile users CANNOT modify survey versions
CREATE POLICY "Only admins can modify survey versions"
ON survey_versions
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');
```

---

## 🎯 Success Criteria

| Criteria              | Target                                     | Measurement          |
| --------------------- | ------------------------------------------ | -------------------- |
| **Separation**        | 100% of admin actions in Web Admin         | Code audit           |
| **Security**          | Zero unauthorized access                   | Penetration test     |
| **Immutability**      | No active survey modifications             | Database constraints |
| **Token Expiry**      | Deactivated users locked out within 1 hour | Test scenarios       |
| **Dynamic Rendering** | All surveys render from JSON schema        | Integration test     |
| **Mobile Simplicity** | 50% reduction in mobile app complexity     | LOC comparison       |

---

## 🔗 Related Documents

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Current database structure
- [ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md) - Previous architecture design
- [ASSIGNMENT_SYSTEM_IMPLEMENTATION.md](./ASSIGNMENT_SYSTEM_IMPLEMENTATION.md) - Assignment rules
- [DATA_ACCESS_LAYER.md](./DATA_ACCESS_LAYER.md) - Data access patterns

---

## 📞 Next Steps

1. **Immediate**: Review and approve this architecture document
2. **Week 1**: Start backend API separation
3. **Week 2**: Begin Web Admin panel development (Next.js)
4. **Ongoing**: Weekly architecture review meetings

---

**Document Owner**: Development Team  
**Approval Required**: Technical Lead, Product Owner  
**Review Cycle**: Bi-weekly during migration, monthly post-migration
