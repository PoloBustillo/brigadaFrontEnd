# Architecture Migration Checklist

**Status**: 🔴 IN PROGRESS  
**Started**: February 13, 2026  
**Target Completion**: April 13, 2026 (8 weeks)

---

## Overview

This checklist tracks the migration from a mobile-first architecture to a **Web Admin + Mobile App** architecture with clear separation of concerns.

**Reference**: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md)

---

## Phase 1: Backend API Separation (Weeks 1-2)

### API Structure

- [ ] **Create admin API namespace**
  - [ ] `/api/admin/surveys/*` endpoints
  - [ ] `/api/admin/users/*` endpoints
  - [ ] `/api/admin/assignments/*` endpoints
  - [ ] `/api/admin/analytics/*` endpoints
  - [ ] `/api/admin/reports/*` endpoints

- [ ] **Create mobile API namespace**
  - [ ] `/api/mobile/auth/*` endpoints
  - [ ] `/api/mobile/surveys/*` endpoints (read-only)
  - [ ] `/api/mobile/responses/*` endpoints
  - [ ] `/api/mobile/documents/*` endpoints
  - [ ] `/api/mobile/me/*` endpoints

### Authentication & Authorization

- [ ] **Separate API key usage**
  - [ ] Admin endpoints use `service_role` key
  - [ ] Mobile endpoints use `anon`/`authenticated` JWT only
  - [ ] Verify `service_role` key NOT embedded in mobile app

- [ ] **Implement token expiration strategy**
  - [ ] Set JWT access token to 1 hour
  - [ ] Set refresh token to 7 days
  - [ ] Add token refresh on app foreground
  - [ ] Add token validation before sync

### RLS Policies

- [ ] **Audit all tables for RLS**
  - [ ] `surveys` table
  - [ ] `survey_versions` table (new)
  - [ ] `questions` table
  - [ ] `responses` table
  - [ ] `users` table
  - [ ] `survey_assignments` table
  - [ ] `documents` table

- [ ] **Create role-based policies**
  - [ ] Admin: Full CRUD access
  - [ ] Encargado: Read assigned surveys, write responses
  - [ ] Brigadista: Read assigned surveys, write responses
  - [ ] Public: No access

- [ ] **Test policy enforcement**
  - [ ] Attempt unauthorized survey creation from mobile JWT
  - [ ] Attempt unauthorized user access
  - [ ] Verify data isolation between roles

### Documentation

- [ ] **Document API contracts**
  - [ ] Create OpenAPI/Swagger spec for admin endpoints
  - [ ] Create OpenAPI/Swagger spec for mobile endpoints
  - [ ] Document authentication flows
  - [ ] Document error codes and responses

---

## Phase 2: Survey Versioning (Weeks 3-4)

### Database Changes

- [ ] **Create `survey_versions` table**

  ```sql
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
  ```

- [ ] **Add version tracking to responses**

  ```sql
  ALTER TABLE responses
  ADD COLUMN survey_version_id UUID REFERENCES survey_versions(id);
  ```

- [ ] **Create audit log table**
  ```sql
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

### Backend Logic

- [ ] **Implement version creation**
  - [ ] Create new version endpoint
  - [ ] Auto-increment version number
  - [ ] Copy schema from previous version
  - [ ] Set status to DRAFT

- [ ] **Implement version activation**
  - [ ] Activate version endpoint
  - [ ] Set `is_immutable = true`
  - [ ] Archive previous active version
  - [ ] Record `activated_at` timestamp

- [ ] **Implement version archival**
  - [ ] Archive version endpoint
  - [ ] Prevent archival if responses exist
  - [ ] Record `archived_at` timestamp

- [ ] **Implement immutability enforcement**
  - [ ] Prevent updates to active/archived versions
  - [ ] Return clear error messages
  - [ ] Enforce at database level (triggers)

### Data Migration

- [ ] **Migrate existing surveys**
  - [ ] Create script to convert surveys to versioned schema
  - [ ] Set all existing surveys to version 1
  - [ ] Set status to ACTIVE
  - [ ] Validate migration success

- [ ] **Link existing responses**
  - [ ] Update responses with correct `survey_version_id`
  - [ ] Verify data integrity
  - [ ] Create backup before migration

---

## Phase 3: Dynamic Rendering (Weeks 5-6)

### Mobile App Components

- [ ] **Create universal question renderer**
  - [ ] `QuestionRenderer` component
  - [ ] Support question types:
    - [ ] `text` (TextInput)
    - [ ] `number` (NumberInput)
    - [ ] `single_choice` (RadioGroup)
    - [ ] `multiple_choice` (CheckboxGroup)
    - [ ] `date` (DatePicker)
    - [ ] `time` (TimePicker)
    - [ ] `document` (DocumentUpload)
    - [ ] `signature` (SignaturePad)
    - [ ] `location` (LocationPicker)
    - [ ] `photo` (CameraCapture)

- [ ] **Create validation engine**
  - [ ] `validateResponse()` function
  - [ ] Support validation types:
    - [ ] Required fields
    - [ ] Min/max length
    - [ ] Min/max value
    - [ ] Regex pattern
    - [ ] Custom validation rules
  - [ ] Return structured errors

- [ ] **Create conditional logic engine**
  - [ ] `evaluateCondition()` function
  - [ ] Show/hide questions based on answers
  - [ ] Enable/disable questions
  - [ ] Set default values dynamically

### Survey Schema Definition

- [ ] **Define JSON schema structure**

  ```typescript
  interface SurveySchema {
    title: string;
    description: string;
    sections: SurveySection[];
    validation_rules: ValidationRule[];
    conditional_logic: ConditionalLogic[];
    submission_rules: SubmissionRule[];
  }
  ```

- [ ] **Create schema TypeScript types**
  - [ ] `SurveySection`
  - [ ] `Question`
  - [ ] `ValidationRule`
  - [ ] `ConditionalLogic`
  - [ ] `SubmissionRule`

- [ ] **Create schema validation**
  - [ ] Validate schema on creation (backend)
  - [ ] Validate schema on fetch (mobile)
  - [ ] Handle invalid schemas gracefully

### Testing

- [ ] **Test dynamic rendering**
  - [ ] Create test surveys with all question types
  - [ ] Test validation rules
  - [ ] Test conditional logic
  - [ ] Test error handling

- [ ] **Test schema updates**
  - [ ] Update schema in Web Admin
  - [ ] Verify mobile app fetches new version
  - [ ] Clear local cache on version change
  - [ ] Test backward compatibility

---

## Phase 4: Mobile App Cleanup (Week 7)

### Remove Admin Functionality

- [ ] **Remove admin screens**
  - [ ] Delete `app/(admin)/` directory (or mark as deprecated)
  - [ ] Remove admin routes from router
  - [ ] Remove admin navigation items
  - [ ] Update tab bar configuration

- [ ] **Remove admin components**
  - [ ] Survey creation forms
  - [ ] User management forms
  - [ ] Assignment management forms
  - [ ] Analytics dashboards

- [ ] **Remove admin-only logic**
  - [ ] Survey CRUD operations
  - [ ] User CRUD operations
  - [ ] Assignment CRUD operations
  - [ ] Settings management

### Simplify Auth Context

- [ ] **Update `auth-context.tsx`**
  - [ ] Remove admin role checks (still track role, but don't route)
  - [ ] Simplify role-based navigation
  - [ ] Remove admin-specific state

- [ ] **Update routing logic**
  - [ ] Remove admin route redirects
  - [ ] Keep only operational routes:
    - [ ] `(brigadista)/*`
    - [ ] `(encargado)/*`
    - [ ] `(auth)/*`
    - [ ] Profile screen

### Update Documentation

- [ ] **Update README.md**
  - [ ] Remove references to admin features
  - [ ] Document operational-only nature
  - [ ] Link to Web Admin documentation

- [ ] **Update architecture docs**
  - [ ] Mark `ARCHITECTURE_NEW.md` as deprecated
  - [ ] Reference `ARCHITECTURE_SEPARATION.md` as current

---

## Phase 5: Token Security (Week 8)

### Token Refresh Implementation

- [ ] **Add foreground token refresh**
  - [ ] Detect app state change (background → foreground)
  - [ ] Check token expiration
  - [ ] Refresh if expired or near expiration
  - [ ] Handle refresh failure (force re-login)

- [ ] **Add token validation before sync**
  - [ ] Check token before each sync attempt
  - [ ] Refresh if expired
  - [ ] Handle invalid tokens gracefully
  - [ ] Show user-friendly error messages

### Backend User Status Validation

- [ ] **Create `is_user_active()` function**

  ```sql
  CREATE OR REPLACE FUNCTION is_user_active(user_uuid UUID)
  RETURNS BOOLEAN AS $$
    SELECT is_active FROM users WHERE id = user_uuid;
  $$ LANGUAGE sql SECURITY DEFINER;
  ```

- [ ] **Add RLS policy for inactive users**

  ```sql
  CREATE POLICY "Inactive users cannot access"
  ON responses
  FOR ALL
  TO authenticated
  USING (is_user_active(auth.uid()));
  ```

- [ ] **Apply to all relevant tables**
  - [ ] `surveys`
  - [ ] `responses`
  - [ ] `documents`
  - [ ] `survey_assignments`

### Testing Deactivation Scenarios

- [ ] **Test user deactivation**
  - [ ] Deactivate user in Web Admin
  - [ ] Verify mobile app loses access within 1 hour
  - [ ] Verify sync fails with clear error
  - [ ] Verify user is forced to re-login

- [ ] **Test offline behavior**
  - [ ] User works offline for 30 minutes (token valid)
  - [ ] User attempts sync after 2 hours (token expired)
  - [ ] Verify sync fails and requires re-login
  - [ ] Verify queued responses preserved

---

## Phase 6: Web Admin Panel (Weeks 3-10, Parallel Track)

> **Note**: This is a separate Next.js project, tracked here for completeness

### Project Setup

- [ ] **Create Next.js project**
  - [ ] Initialize with TypeScript
  - [ ] Set up App Router
  - [ ] Configure Tailwind CSS
  - [ ] Set up Supabase Admin SDK

- [ ] **Set up authentication**
  - [ ] Admin login page
  - [ ] Session management
  - [ ] Role verification middleware
  - [ ] Logout functionality

### Survey Management

- [ ] **Create survey CRUD interface**
  - [ ] List surveys (with filters/search)
  - [ ] Create survey form
  - [ ] Edit survey form (draft only)
  - [ ] Version history view
  - [ ] Activate/archive actions

- [ ] **Create survey builder**
  - [ ] Drag-and-drop question ordering
  - [ ] Question type selector
  - [ ] Validation rule builder
  - [ ] Conditional logic builder
  - [ ] Preview functionality

### User Management

- [ ] **Create user CRUD interface**
  - [ ] List users (with filters/search)
  - [ ] Create user form
  - [ ] Edit user form
  - [ ] Activate/deactivate toggle
  - [ ] Role management

### Assignment Management

- [ ] **Create assignment interface**
  - [ ] Assign surveys to users
  - [ ] Batch assignment
  - [ ] Assignment timeline view
  - [ ] Remove assignments

### Analytics & Reports

- [ ] **Create analytics dashboards**
  - [ ] Survey completion rates
  - [ ] User activity metrics
  - [ ] Response quality metrics
  - [ ] Geographic distribution

- [ ] **Create export functionality**
  - [ ] Export responses to CSV
  - [ ] Export analytics reports
  - [ ] Scheduled exports

---

## Phase 7: Testing & Validation (Weeks 9-10)

### End-to-End Testing

- [ ] **Test complete workflows**
  - [ ] Admin creates survey → Brigadista receives → Submits response
  - [ ] Admin assigns survey → Encargado monitors → Reviews responses
  - [ ] Admin deactivates user → User loses access → Cannot sync

- [ ] **Test offline scenarios**
  - [ ] Work offline for 30 minutes → Sync successfully
  - [ ] Work offline for 2 hours → Token expires → Force re-login
  - [ ] Submit 50 responses offline → Sync in batch

- [ ] **Test version scenarios**
  - [ ] Admin updates survey (new version) → Mobile fetches new schema
  - [ ] Responses reference correct version
  - [ ] Old version archived properly

### Security Audit

- [ ] **Penetration testing**
  - [ ] Attempt to access admin endpoints from mobile JWT
  - [ ] Attempt to modify surveys from mobile app
  - [ ] Attempt to create users from mobile app
  - [ ] Attempt to bypass RLS policies

- [ ] **Token security testing**
  - [ ] Verify tokens expire correctly
  - [ ] Test token refresh edge cases
  - [ ] Test deactivated user scenarios

### Performance Testing

- [ ] **Load testing**
  - [ ] 100 concurrent users fetching surveys
  - [ ] 1000 responses syncing simultaneously
  - [ ] Large survey schemas (100+ questions)

- [ ] **Mobile app performance**
  - [ ] Measure app launch time
  - [ ] Measure survey rendering time
  - [ ] Measure sync time for various response counts

### Documentation

- [ ] **User documentation**
  - [ ] Web Admin user guide
  - [ ] Mobile app user guide
  - [ ] Troubleshooting guide

- [ ] **Developer documentation**
  - [ ] API reference
  - [ ] Database schema reference
  - [ ] Deployment guide
  - [ ] Monitoring guide

---

## Success Metrics

| Metric                           | Target                        | Current | Status |
| -------------------------------- | ----------------------------- | ------- | ------ |
| **Admin actions in mobile app**  | 0                             | TBD     | 🔴     |
| **API endpoint separation**      | 100%                          | 0%      | 🔴     |
| **RLS policy coverage**          | 100%                          | TBD     | 🔴     |
| **Survey version immutability**  | 100%                          | 0%      | 🔴     |
| **Token expiration enforcement** | <1 hour for deactivated users | TBD     | 🔴     |
| **Dynamic rendering**            | 100% of surveys               | 0%      | 🔴     |
| **Mobile app LOC reduction**     | 50%                           | 0%      | 🔴     |

---

## Risk Assessment

| Risk                             | Impact | Probability | Mitigation                                  |
| -------------------------------- | ------ | ----------- | ------------------------------------------- |
| **Data loss during migration**   | HIGH   | LOW         | Full backup before migration, rollback plan |
| **Extended downtime**            | MEDIUM | MEDIUM      | Phased rollout, blue-green deployment       |
| **User resistance to Web Admin** | MEDIUM | LOW         | Training, documentation, support            |
| **Performance degradation**      | MEDIUM | MEDIUM      | Load testing, optimization, caching         |
| **Security vulnerabilities**     | HIGH   | LOW         | Penetration testing, security audit         |

---

## Rollback Plan

If critical issues arise during migration:

1. **Preserve database backups** at each phase start
2. **Keep mobile app admin screens** until Web Admin is fully validated
3. **Feature flags** to toggle between old and new systems
4. **Gradual migration**: Start with one survey, then expand
5. **Monitoring**: Set up alerts for errors, performance issues

---

## Weekly Progress Tracking

### Week 1 (Feb 13-19)

- [ ] Phase 1 kickoff
- [ ] Backend API structure defined
- [ ] RLS policies drafted

### Week 2 (Feb 20-26)

- [ ] Phase 1 complete
- [ ] API documentation complete
- [ ] Testing complete

### Week 3 (Feb 27 - Mar 5)

- [ ] Phase 2 kickoff
- [ ] Database changes deployed
- [ ] Version creation logic implemented

### Week 4 (Mar 6-12)

- [ ] Phase 2 complete
- [ ] Data migration complete
- [ ] Version immutability enforced

### Week 5 (Mar 13-19)

- [ ] Phase 3 kickoff
- [ ] QuestionRenderer component complete
- [ ] Validation engine complete

### Week 6 (Mar 20-26)

- [ ] Phase 3 complete
- [ ] All question types supported
- [ ] Testing complete

### Week 7 (Mar 27 - Apr 2)

- [ ] Phase 4 complete
- [ ] Admin screens removed from mobile app
- [ ] Documentation updated

### Week 8 (Apr 3-9)

- [ ] Phase 5 complete
- [ ] Token refresh implemented
- [ ] Deactivation scenarios tested

### Weeks 9-10 (Apr 10-23)

- [ ] End-to-end testing complete
- [ ] Security audit complete
- [ ] Documentation complete
- [ ] **GO LIVE**

---

## Sign-Off

- [ ] **Technical Lead** - Architecture approved
- [ ] **Product Owner** - Requirements validated
- [ ] **Security Team** - Security audit passed
- [ ] **QA Team** - Testing complete
- [ ] **DevOps** - Deployment ready

---

**Last Updated**: February 13, 2026  
**Next Review**: February 20, 2026
