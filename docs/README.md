# Brigada Project Documentation

**Last Updated**: February 13, 2026  
**Project**: Brigade Survey System - Mobile App + Web Admin

---

## 📚 Documentation Index

This directory contains comprehensive documentation for the Brigade survey system, covering architecture, implementation, migration, and operational procedures.

---

## 🎯 Architecture Restructuring (NEW - Feb 2026)

### Essential Reading

| Document                                                                           | Purpose                                      | Audience             | Status        |
| ---------------------------------------------------------------------------------- | -------------------------------------------- | -------------------- | ------------- |
| **[ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md)** | Quick reference for priorities and decisions | Everyone             | 🔴 READ FIRST |
| **[ARCHITECTURE_EXECUTIVE_SUMMARY.md](./ARCHITECTURE_EXECUTIVE_SUMMARY.md)**       | High-level overview, ROI, timeline, costs    | Executives, Managers | 🟢 Complete   |
| **[ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md)**                     | Detailed technical architecture design       | Architects, Seniors  | 🟢 Complete   |
| **[ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md)**   | Task-by-task implementation checklist        | All Developers       | 🟢 Complete   |
| **[MOBILE_APP_IMPLEMENTATION.md](./MOBILE_APP_IMPLEMENTATION.md)**                 | Mobile-specific technical guide              | Mobile Team          | 🟢 Complete   |
| **[WEB_ADMIN_REQUIREMENTS.md](./WEB_ADMIN_REQUIREMENTS.md)**                       | Web Admin panel specifications               | Web Team             | 🟢 Complete   |

### Reading Order by Role

**👔 Executives/Product Owners**:

1. Read: [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) (10 min)
2. Read: [ARCHITECTURE_EXECUTIVE_SUMMARY.md](./ARCHITECTURE_EXECUTIVE_SUMMARY.md) (30 min)
3. Action: Approve or defer restructuring plan

**🏗️ Technical Leads/Architects**:

1. Read: [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) (10 min)
2. Read: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) (60 min)
3. Review: [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md) (30 min)
4. Action: Assign teams and set up environment

**📱 Mobile Developers**:

1. Read: [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) (10 min)
2. Skim: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) - Mobile sections only (20 min)
3. Deep dive: [MOBILE_APP_IMPLEMENTATION.md](./MOBILE_APP_IMPLEMENTATION.md) (90 min)
4. Reference: [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md) - Phases 3-5

**🌐 Web Developers**:

1. Read: [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) (10 min)
2. Skim: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) - Web sections only (20 min)
3. Deep dive: [WEB_ADMIN_REQUIREMENTS.md](./WEB_ADMIN_REQUIREMENTS.md) (90 min)
4. Reference: [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md) - Phase 6

**🔧 Backend/DevOps**:

1. Read: [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) (10 min)
2. Deep dive: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) - Backend sections (60 min)
3. Reference: [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md) - Phases 1-2, 5

---

## 📖 Existing Documentation

### Architecture & Design

| Document                                                   | Description                   | Status                                      |
| ---------------------------------------------------------- | ----------------------------- | ------------------------------------------- |
| [ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md)               | Previous architecture design  | 🟡 Superseded by ARCHITECTURE_SEPARATION.md |
| [PROPUESTAS_ARQUITECTURA.md](./PROPUESTAS_ARQUITECTURA.md) | Architecture proposals        | 🟡 Historical reference                     |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)                 | Database schema documentation | 🟢 Current (needs update for versioning)    |
| [DATA_ACCESS_LAYER.md](./DATA_ACCESS_LAYER.md)             | Data access patterns          | 🟢 Current                                  |
| [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)                   | Project file organization     | 🟢 Current                                  |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)             | High-level project structure  | 🟢 Current                                  |

### Features & Systems

| Document                                                                     | Description                | Status     |
| ---------------------------------------------------------------------------- | -------------------------- | ---------- |
| [FORMS_SYSTEM.md](./FORMS_SYSTEM.md)                                         | Forms implementation guide | 🟢 Current |
| [ASSIGNMENT_SYSTEM_IMPLEMENTATION.md](./ASSIGNMENT_SYSTEM_IMPLEMENTATION.md) | Assignment rules           | 🟢 Current |
| [ASSIGNMENT_BASED_PERMISSIONS.md](./ASSIGNMENT_BASED_PERMISSIONS.md)         | Permission system          | 🟢 Current |
| [CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md)                     | Image upload integration   | 🟢 Current |
| [SCREEN_FLOW_UX.md](./SCREEN_FLOW_UX.md)                                     | User experience flows      | 🟢 Current |

### Build & Deployment

| Document                                                 | Description                        | Status       |
| -------------------------------------------------------- | ---------------------------------- | ------------ |
| [EAS_BUILD_QUICKSTART.md](./EAS_BUILD_QUICKSTART.md)     | EAS build guide                    | 🟢 Current   |
| [GUIA_BUILD_PASO_A_PASO.md](./GUIA_BUILD_PASO_A_PASO.md) | Step-by-step build guide (Spanish) | 🟢 Current   |
| [EJECUTAR_BUILD_AHORA.md](./EJECUTAR_BUILD_AHORA.md)     | Execute build now (Spanish)        | 🟢 Current   |
| [APK_STANDALONE_GUIDE.md](./APK_STANDALONE_GUIDE.md)     | Standalone APK guide               | 🟢 Current   |
| [EXPO_GO_VS_EAS.md](./EXPO_GO_VS_EAS.md)                 | Expo Go vs EAS comparison          | 🟢 Current   |
| [BUILD_IN_PROGRESS.md](./BUILD_IN_PROGRESS.md)           | Build status tracker               | 🟡 Temporary |

### UI/UX Implementation

| Document                                                       | Description                  | Status      |
| -------------------------------------------------------------- | ---------------------------- | ----------- |
| [GUIA_USO_DESIGN_SYSTEM.md](./GUIA_USO_DESIGN_SYSTEM.md)       | Design system usage guide    | 🟢 Current  |
| [INTEGRACION_DESIGN_SYSTEM.md](./INTEGRACION_DESIGN_SYSTEM.md) | Design system integration    | 🟢 Current  |
| [PROPUESTAS_UI_2026.md](./PROPUESTAS_UI_2026.md)               | UI proposals for 2026        | 🟢 Current  |
| [SPLASH\_\*.md](./SPLASH_*.md)                                 | Splash screen implementation | 🟢 Complete |

### Bug Fixes & Improvements

| Document                                  | Description                         | Status      |
| ----------------------------------------- | ----------------------------------- | ----------- |
| [LOGIN\_\*.md](./LOGIN_*.md)              | Login screen fixes and improvements | 🟢 Complete |
| [KEYBOARD*FIX*\*.md](./KEYBOARD_FIX_*.md) | Keyboard handling fixes             | 🟢 Complete |
| [DEBUG_TEXT_FIX.md](./DEBUG_TEXT_FIX.md)  | Debug text removal                  | 🟢 Complete |

### Testing & Data

| Document                                                   | Description              | Status     |
| ---------------------------------------------------------- | ------------------------ | ---------- |
| [LOGIN_TESTING_CHECKLIST.md](./LOGIN_TESTING_CHECKLIST.md) | Login testing procedures | 🟢 Current |
| [MOCK_USERS_GUIDE.md](./MOCK_USERS_GUIDE.md)               | Test user accounts       | 🟢 Current |
| [DATOS-PRUEBA.md](./DATOS-PRUEBA.md)                       | Test data (Spanish)      | 🟢 Current |

### Phase Completion Records

| Document                                     | Description                | Status      |
| -------------------------------------------- | -------------------------- | ----------- |
| [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) | Phase 1 completion summary | 🟢 Complete |
| [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md) | Phase 2 completion summary | 🟢 Complete |
| [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md) | Phase 3 completion summary | 🟢 Complete |
| [RESUMEN_FINAL.md](./RESUMEN_FINAL.md)       | Final summary (Spanish)    | 🟢 Complete |

### Process & Lifecycle

| Document                                                   | Description                  | Status          |
| ---------------------------------------------------------- | ---------------------------- | --------------- |
| [MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md)       | Database migration lifecycle | 🟢 Current      |
| [CHECKLIST.md](./CHECKLIST.md)                             | General project checklist    | 🟡 Needs update |
| [MEJORAS_PROPUESTAS_2026.md](./MEJORAS_PROPUESTAS_2026.md) | Proposed improvements 2026   | 🟢 Current      |

---

## 🚀 Quick Start for New Team Members

### Day 1: Understanding the System

**Morning (2 hours)**:

1. Read [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) - 10 min
2. Read your role-specific docs:
   - Mobile: [MOBILE_APP_IMPLEMENTATION.md](./MOBILE_APP_IMPLEMENTATION.md) - 90 min
   - Web: [WEB_ADMIN_REQUIREMENTS.md](./WEB_ADMIN_REQUIREMENTS.md) - 90 min
   - Backend: [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) Backend sections - 60 min
3. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 20 min

**Afternoon (3 hours)**:

1. Set up development environment
2. Clone repository
3. Run mobile app locally
4. Review existing codebase structure
5. Ask questions in team channel

### Week 1: Deep Dive

**Mobile Developers**:

- Day 2-3: Review current mobile app structure ([FILE_STRUCTURE.md](./FILE_STRUCTURE.md))
- Day 4: Study offline queue system ([DATA_ACCESS_LAYER.md](./DATA_ACCESS_LAYER.md))
- Day 5: Plan Phase 3-5 tasks from checklist

**Web Developers**:

- Day 2-3: Next.js project setup ([WEB_ADMIN_REQUIREMENTS.md](./WEB_ADMIN_REQUIREMENTS.md) Section 2)
- Day 4: Database schema review ([DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md))
- Day 5: UI component planning

**Backend Developers**:

- Day 2-3: Supabase setup and RLS policies ([ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md))
- Day 4: API endpoint design
- Day 5: Database migration planning

---

## 📊 Project Status Dashboard

### Current State (Feb 2026)

| Component         | Status      | Health                 |
| ----------------- | ----------- | ---------------------- |
| **Mobile App**    | Production  | 🟢 Stable              |
| **Backend**       | Production  | 🟡 Needs restructuring |
| **Web Admin**     | Not Started | 🔴 To be built         |
| **Database**      | Production  | 🟡 Needs migrations    |
| **Documentation** | Complete    | 🟢 Up to date          |

### Architecture Restructuring

| Phase                          | Status      | Progress | ETA     |
| ------------------------------ | ----------- | -------- | ------- |
| **Phase 1: Backend API**       | Not Started | 0%       | Week 2  |
| **Phase 2: Versioning**        | Not Started | 0%       | Week 4  |
| **Phase 3: Dynamic Rendering** | Not Started | 0%       | Week 6  |
| **Phase 4: Mobile Cleanup**    | Not Started | 0%       | Week 7  |
| **Phase 5: Token Security**    | Not Started | 0%       | Week 8  |
| **Phase 6: Web Admin**         | Not Started | 0%       | Week 10 |
| **Phase 7: Testing**           | Not Started | 0%       | Week 10 |

---

## 🔄 Documentation Updates

### When to Update Docs

- **Daily**: Update [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md) checkboxes
- **Weekly**: Update progress in [ARCHITECTURE_EXECUTIVE_SUMMARY.md](./ARCHITECTURE_EXECUTIVE_SUMMARY.md)
- **On schema changes**: Update [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **On architecture changes**: Update [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md)
- **On feature completion**: Create summary document (e.g., LOGIN_IMPROVEMENTS_SUMMARY.md)

### How to Contribute

1. Create new docs in `docs/` directory
2. Use Markdown format
3. Update this README.md with new doc reference
4. Include:
   - Purpose/objective
   - Target audience
   - Last updated date
   - Status indicator (🔴/🟡/🟢)

---

## 📞 Support & Questions

### Architecture Questions

- Review [ARCHITECTURE_SEPARATION.md](./ARCHITECTURE_SEPARATION.md) first
- Check [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) FAQ section
- Ask in #architecture Slack channel

### Implementation Questions

- Check role-specific implementation guide first
- Review [ARCHITECTURE_MIGRATION_CHECKLIST.md](./ARCHITECTURE_MIGRATION_CHECKLIST.md)
- Ask in #dev-support Slack channel

### Urgent Issues

- See [ARCHITECTURE_QUICK_DECISION_GUIDE.md](./ARCHITECTURE_QUICK_DECISION_GUIDE.md) Emergency Contacts section

---

## 🎯 Key Principles

### Documentation Philosophy

1. **Single Source of Truth**: Each topic has one authoritative document
2. **Version Control**: All docs tracked in Git
3. **Up to Date**: Docs updated before/during implementation, not after
4. **Accessible**: Written for intended audience (avoid jargon when possible)
5. **Actionable**: Include concrete steps, not just theory

### Code-Documentation Alignment

- Code comments → Explain "why" (not "what")
- README files → Explain "how to use"
- Docs folder → Explain "architecture and design decisions"

---

## 📝 Document Templates

### New Feature Document Template

```markdown
# [Feature Name]

**Status**: [Planning/In Progress/Complete]
**Owner**: [Team/Person]
**Last Updated**: [Date]

## Overview

[Brief description]

## Requirements

[What needs to be built]

## Implementation

[How it will be built]

## Testing

[How to verify it works]

## Rollout Plan

[How to deploy]

## Success Metrics

[How to measure success]
```

### Bug Fix Document Template

```markdown
# [Bug Name] Fix

**Status**: [In Progress/Fixed]
**Severity**: [Critical/High/Medium/Low]
**Last Updated**: [Date]

## Problem

[What was broken]

## Root Cause

[Why it broke]

## Solution

[How we fixed it]

## Prevention

[How to avoid in future]

## Testing

[How to verify fix]
```

---

## 🏷️ Status Indicators

- 🔴 **Critical/Urgent**: Requires immediate attention
- 🟡 **In Progress/Warning**: Work ongoing or needs update
- 🟢 **Complete/Current**: Up to date and stable
- ⚪ **Deprecated**: No longer relevant

---

**Maintained by**: Development Team  
**Review Cycle**: Weekly during active development, monthly during maintenance  
**Questions?** Ask in #documentation Slack channel
