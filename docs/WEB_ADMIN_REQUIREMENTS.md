# Web Admin Panel Requirements

**Status**: 🔴 TO BE BUILT  
**Technology**: Next.js 14+ (App Router)  
**Timeline**: Weeks 3-10 (parallel to mobile migration)

---

## 1. Project Overview

### Purpose

The Web Admin panel is the **exclusive control plane** for:

- Survey creation and management
- User management
- Assignment management
- Data validation rules
- Analytics and reporting
- System configuration

### Target Users

- **Administrators**: Full system access
- **Managers**: Read-only analytics and reports (future phase)

### Technology Stack

```json
{
  "framework": "Next.js 14+",
  "ui": "shadcn/ui + Tailwind CSS",
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "deployment": "Vercel",
  "monitoring": "Vercel Analytics + Sentry"
}
```

---

## 2. Project Setup

### Initialize Project

```bash
npx create-next-app@latest brigada-web-admin --typescript --tailwind --app
cd brigada-web-admin
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init
```

### Install shadcn/ui Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
```

### Environment Configuration

**File**: `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # CRITICAL: Backend only!

# App
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com

# Mobile App URL (for QR code generation)
NEXT_PUBLIC_MOBILE_APP_URL=exp://your-expo-app

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

---

## 3. Project Structure

```
brigada-web-admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── surveys/
│   │   │   ├── page.tsx                    # List surveys
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # Create survey
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx               # View/Edit survey
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx           # Edit survey builder
│   │   │   │   ├── versions/
│   │   │   │   │   └── page.tsx           # Version history
│   │   │   │   └── preview/
│   │   │   │       └── page.tsx           # Preview survey
│   │   ├── users/
│   │   │   ├── page.tsx                    # List users
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # Create user
│   │   │   └── [id]/
│   │   │       └── page.tsx               # View/Edit user
│   │   ├── assignments/
│   │   │   ├── page.tsx                    # List assignments
│   │   │   └── new/
│   │   │       └── page.tsx               # Create assignment
│   │   ├── responses/
│   │   │   ├── page.tsx                    # List responses
│   │   │   └── [id]/
│   │   │       └── page.tsx               # View response
│   │   ├── analytics/
│   │   │   ├── page.tsx                    # Analytics dashboard
│   │   │   ├── surveys/
│   │   │   │   └── page.tsx               # Survey analytics
│   │   │   └── users/
│   │   │       └── page.tsx               # User analytics
│   │   ├── settings/
│   │   │   └── page.tsx                    # System settings
│   │   └── layout.tsx                      # Dashboard layout
│   ├── api/
│   │   ├── admin/
│   │   │   ├── surveys/
│   │   │   │   ├── route.ts               # List/Create surveys
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts           # Get/Update/Delete survey
│   │   │   │   │   ├── version/
│   │   │   │   │   │   └── route.ts       # Create version
│   │   │   │   │   ├── activate/
│   │   │   │   │   │   └── route.ts       # Activate version
│   │   │   │   │   └── deactivate/
│   │   │   │   │       └── route.ts       # Deactivate survey
│   │   │   ├── users/
│   │   │   │   ├── route.ts               # List/Create users
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts           # Get/Update/Delete user
│   │   │   │       └── deactivate/
│   │   │   │           └── route.ts       # Deactivate user
│   │   │   ├── assignments/
│   │   │   │   ├── route.ts               # List/Create assignments
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts           # Get/Update/Delete assignment
│   │   │   └── analytics/
│   │   │       ├── surveys/
│   │   │       │   └── route.ts           # Survey analytics
│   │   │       └── users/
│   │   │           └── route.ts           # User analytics
│   │   └── mobile/
│   │       └── [...]                       # Mobile endpoints (reference)
│   ├── layout.tsx
│   └── page.tsx                             # Landing page
├── components/
│   ├── surveys/
│   │   ├── survey-list.tsx
│   │   ├── survey-form.tsx
│   │   ├── survey-builder.tsx               # Drag-and-drop builder
│   │   ├── question-editor.tsx
│   │   ├── validation-rule-editor.tsx
│   │   ├── conditional-logic-editor.tsx
│   │   └── survey-preview.tsx
│   ├── users/
│   │   ├── user-list.tsx
│   │   ├── user-form.tsx
│   │   └── user-status-badge.tsx
│   ├── assignments/
│   │   ├── assignment-list.tsx
│   │   ├── assignment-form.tsx
│   │   └── assignment-calendar.tsx
│   ├── analytics/
│   │   ├── survey-stats-card.tsx
│   │   ├── user-activity-chart.tsx
│   │   ├── completion-rate-chart.tsx
│   │   └── response-map.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumbs.tsx
│   └── ui/
│       └── [shadcn components]
├── lib/
│   ├── supabase/
│   │   ├── client.ts                        # Browser client
│   │   ├── server.ts                        # Server client
│   │   └── admin.ts                         # Admin client (service_role)
│   ├── api/
│   │   ├── surveys.ts
│   │   ├── users.ts
│   │   ├── assignments.ts
│   │   └── analytics.ts
│   ├── validations/
│   │   ├── survey-schema.ts                 # Zod schemas for surveys
│   │   ├── user-schema.ts
│   │   └── assignment-schema.ts
│   └── utils/
│       ├── cn.ts
│       ├── date.ts
│       └── format.ts
├── types/
│   ├── database.ts                          # Generated from Supabase
│   ├── survey.ts
│   ├── user.ts
│   └── assignment.ts
├── middleware.ts                             # Auth middleware
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 4. Core Features

### 4.1 Authentication

**Login Page**: `app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;

      if (userData.role !== 'ADMIN') {
        await supabase.auth.signOut();
        throw new Error('Solo administradores pueden acceder');
      }

      router.push('/surveys');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="mt-2 text-gray-600">Ingresa con tu cuenta de administrador</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Middleware**: `middleware.ts`

```typescript
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && !req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify admin role
  if (session) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (
      userData?.role !== "ADMIN" &&
      !req.nextUrl.pathname.startsWith("/login")
    ) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect to surveys if authenticated and on login page
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/surveys", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

### 4.2 Survey Management

**Survey List**: `app/(dashboard)/surveys/page.tsx`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { SurveyList } from '@/components/surveys/survey-list';
import Link from 'next/link';

export default async function SurveysPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: surveys, error } = await supabase
    .from('surveys')
    .select(`
      *,
      survey_versions!inner (
        id,
        version,
        status,
        activated_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching surveys:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Encuestas</h1>
          <p className="text-gray-600">Gestiona las encuestas del sistema</p>
        </div>
        <Link href="/surveys/new">
          <Button>Nueva Encuesta</Button>
        </Link>
      </div>

      <SurveyList surveys={surveys || []} />
    </div>
  );
}
```

**Survey Builder**: `components/surveys/survey-builder.tsx`

```typescript
'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QuestionEditor } from './question-editor';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import type { SurveySchema, Question } from '@/types/survey';

interface SurveyBuilderProps {
  schema: SurveySchema;
  onChange: (schema: SurveySchema) => void;
}

export function SurveyBuilder({ schema, onChange }: SurveyBuilderProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const handleAddQuestion = (sectionId: string) => {
    const newQuestion: Question = {
      id: generateId(),
      type: 'text',
      label: 'Nueva pregunta',
      required: false,
    };

    const updatedSections = schema.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          questions: [...section.questions, newQuestion],
        };
      }
      return section;
    });

    onChange({ ...schema, sections: updatedSections });
    setEditingQuestionId(newQuestion.id);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    // Implement drag-and-drop logic
    // Reorder questions within section or move between sections
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        {schema.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{section.title}</h3>
              {section.description && (
                <p className="text-gray-600">{section.description}</p>
              )}
            </div>

            <Droppable droppableId={section.id}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {section.questions.map((question, questionIndex) => (
                    <Draggable
                      key={question.id}
                      draggableId={question.id}
                      index={questionIndex}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-lg border bg-white p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-2 cursor-grab text-gray-400"
                            >
                              <GripVertical size={20} />
                            </div>

                            <div className="flex-1">
                              {editingQuestionId === question.id ? (
                                <QuestionEditor
                                  question={question}
                                  onChange={(updated) => {
                                    // Update question
                                  }}
                                  onClose={() => setEditingQuestionId(null)}
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingQuestionId(question.id)}
                                  className="cursor-pointer"
                                >
                                  <p className="font-medium">{question.label}</p>
                                  <p className="text-sm text-gray-500">
                                    {question.type} {question.required && '(obligatorio)'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Delete question
                              }}
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <Button
              variant="outline"
              onClick={() => handleAddQuestion(section.id)}
              className="mt-4"
            >
              <Plus size={18} className="mr-2" />
              Agregar Pregunta
            </Button>
          </Card>
        ))}
      </DragDropContext>
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
```

---

### 4.3 User Management

**User List**: `app/(dashboard)/users/page.tsx`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UserList } from '@/components/users/user-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UsersPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios del sistema</p>
        </div>
        <Link href="/users/new">
          <Button>Nuevo Usuario</Button>
        </Link>
      </div>

      <UserList users={users || []} />
    </div>
  );
}
```

---

### 4.4 Analytics Dashboard

**Analytics Page**: `app/(dashboard)/analytics/page.tsx`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SurveyStatsCard } from '@/components/analytics/survey-stats-card';
import { CompletionRateChart } from '@/components/analytics/completion-rate-chart';

export default async function AnalyticsPage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch analytics data
  const { data: surveyStats } = await supabase.rpc('get_survey_stats');
  const { data: completionRates } = await supabase.rpc('get_completion_rates');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analíticas</h1>
        <p className="text-gray-600">Monitorea el rendimiento del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Encuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{surveyStats?.total_surveys || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{surveyStats?.total_responses || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasa de Completado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {surveyStats?.completion_rate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{surveyStats?.active_users || 0}</p>
          </CardContent>
        </Card>
      </div>

      <CompletionRateChart data={completionRates || []} />
    </div>
  );
}
```

---

## 5. Database Functions (PostgreSQL)

### Analytics Functions

```sql
-- Get survey statistics
CREATE OR REPLACE FUNCTION get_survey_stats()
RETURNS TABLE (
  total_surveys BIGINT,
  total_responses BIGINT,
  completion_rate NUMERIC,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM surveys WHERE status = 'ACTIVE') AS total_surveys,
    (SELECT COUNT(*) FROM responses WHERE submitted_at IS NOT NULL) AS total_responses,
    (SELECT ROUND((COUNT(*) FILTER (WHERE submitted_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2)
     FROM responses) AS completion_rate,
    (SELECT COUNT(DISTINCT user_id) FROM responses WHERE submitted_at > NOW() - INTERVAL '30 days') AS active_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get completion rates over time
CREATE OR REPLACE FUNCTION get_completion_rates(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(submitted_at) AS date,
    ROUND((COUNT(*) FILTER (WHERE submitted_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) AS completion_rate
  FROM responses
  WHERE submitted_at BETWEEN start_date AND end_date
  GROUP BY DATE(submitted_at)
  ORDER BY DATE(submitted_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel)

```bash
# Set via Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production  # NEVER commit!
vercel env add NEXT_PUBLIC_APP_URL production
```

---

## 7. Security Checklist

- [ ] Service role key used ONLY on backend (API routes)
- [ ] Admin role verified in middleware
- [ ] RLS policies active on all tables
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting on API routes
- [ ] Input validation with Zod
- [ ] SQL injection prevention (use Supabase client, not raw SQL)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF protection (Next.js handles this)

---

## 8. Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/api/surveys.test.ts
import { createSurvey, updateSurvey } from "@/lib/api/surveys";

describe("Survey API", () => {
  it("should create survey", async () => {
    const survey = await createSurvey({
      title: "Test Survey",
      description: "Test Description",
    });
    expect(survey.id).toBeDefined();
  });

  it("should prevent non-admin from creating survey", async () => {
    // Mock non-admin user
    await expect(createSurvey({})).rejects.toThrow("Unauthorized");
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/surveys.spec.ts
import { test, expect } from "@playwright/test";

test("should create and activate survey", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill("[name=email]", "admin@test.com");
  await page.fill("[name=password]", "password");
  await page.click("[type=submit]");

  // Create survey
  await page.goto("/surveys/new");
  await page.fill("[name=title]", "E2E Test Survey");
  await page.click("text=Crear Encuesta");

  // Verify created
  await expect(page.locator("text=E2E Test Survey")).toBeVisible();

  // Activate
  await page.click("text=Activar");
  await expect(page.locator("text=Activa")).toBeVisible();
});
```

---

## 9. Monitoring & Observability

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

---

## 10. Performance Optimization

- [ ] Use Server Components by default
- [ ] Client Components only when needed (interactivity)
- [ ] Implement pagination for large lists (surveys, users, responses)
- [ ] Use `revalidatePath()` after mutations
- [ ] Optimize images with Next.js Image component
- [ ] Enable Vercel Edge Caching
- [ ] Implement optimistic UI updates
- [ ] Use `Suspense` for loading states
- [ ] Lazy load heavy components (survey builder, charts)
- [ ] Database indexing on frequently queried columns

---

## 11. Future Enhancements

### Phase 2 Features (Post-Launch)

- [ ] Multi-language support (i18n)
- [ ] Advanced analytics (cohort analysis, funnel tracking)
- [ ] Scheduled exports (daily/weekly CSV reports)
- [ ] Notifications (email/SMS for survey assignments)
- [ ] Audit log viewer (track all admin actions)
- [ ] Role-based access (Manager role with read-only access)
- [ ] Survey templates (pre-built common surveys)
- [ ] AI-powered survey suggestions
- [ ] Data export to external systems (Zapier, Webhooks)
- [ ] Mobile app for supervisors (read-only monitoring)

---

## 12. Development Timeline

| Week | Tasks                                                         |
| ---- | ------------------------------------------------------------- |
| 1-2  | Project setup, authentication, basic layout                   |
| 3-4  | Survey CRUD, user CRUD, assignment CRUD                       |
| 5-6  | Survey builder (drag-and-drop, validation, conditional logic) |
| 7-8  | Analytics dashboard, reporting, exports                       |
| 9    | Testing, bug fixes, performance optimization                  |
| 10   | Deployment, monitoring setup, documentation                   |

---

## 13. Success Metrics

| Metric                    | Target       |
| ------------------------- | ------------ |
| **Page load time**        | < 2 seconds  |
| **Time to interactive**   | < 3 seconds  |
| **Uptime**                | 99.9%        |
| **Error rate**            | < 0.1%       |
| **Admin onboarding time** | < 30 minutes |
| **Survey creation time**  | < 10 minutes |
| **User creation time**    | < 2 minutes  |

---

**Last Updated**: February 13, 2026  
**Status**: Ready for development kick-off
