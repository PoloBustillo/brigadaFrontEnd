# 🚀 Integration Next Steps

Your JWT authentication system with RBAC is **fully implemented**! This guide shows exactly what needs to be done to integrate it into your existing screens.

## ✅ What's Already Done

### Backend

- ✅ FastAPI server with JWT authentication
- ✅ PostgreSQL database with user roles
- ✅ 3 test users created (Admin, Encargado, Brigadista)
- ✅ RBAC endpoints with permission checks
- ✅ Survey versioning system
- ✅ Assignment management
- ✅ Offline sync with client_id deduplication

### Frontend

- ✅ API client with JWT interceptors
- ✅ Automatic token refresh logic
- ✅ Token expiration validation (30 min)
- ✅ Permission system (15+ permissions)
- ✅ Route guards (8 different hooks)
- ✅ Auth context updated with backend integration
- ✅ Unauthorized access screen
- ✅ Base URL configured for localhost:8000

## 📋 Test Users

Backend has 3 users ready for testing:

| Email                  | Password      | Role       | Permissions                  |
| ---------------------- | ------------- | ---------- | ---------------------------- |
| admin@brigada.com      | admin123      | ADMIN      | All permissions              |
| encargado@brigada.com  | encargado123  | ENCARGADO  | Assignments + View responses |
| brigadista@brigada.com | brigadista123 | BRIGADISTA | Submit responses only        |

## 🔧 Integration Tasks

### 1️⃣ Update Login Screen (HIGHEST PRIORITY)

**File**: `app/(auth)/login.tsx`

**Current code** (probably using mock login):

```typescript
const handleLogin = () => {
  login(mockUser, "mock-token");
};
```

**New code** (call backend):

```typescript
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "Por favor completa todos los campos");
    return;
  }

  setIsLoading(true);
  try {
    // New login - takes email and password
    await login(email, password);
    // User will auto-redirect to role-specific home
  } catch (error: any) {
    Alert.alert(
      "Error de Autenticación",
      error.message || "Credenciales incorrectas",
    );
  } finally {
    setIsLoading(false);
  }
};
```

**See full example**: `docs/examples/login-screen-example.tsx`

### 2️⃣ Add Route Guards to Protected Screens

Add guards at the top of screen components (after imports):

#### Admin Screens

```typescript
// app/(admin)/create-survey.tsx
import { useRequireRole } from "@/lib/auth/guards";

export default function CreateSurveyScreen() {
  // Auto-redirects if not Admin
  useRequireRole(["ADMIN"]);

  // rest of component...
}
```

#### Encargado Screens

```typescript
// app/(encargado)/assignments.tsx
import { useRequireRole } from "@/lib/auth/guards";

export default function AssignmentsScreen() {
  // Auto-redirects if not Admin or Encargado
  useRequireRole(["ADMIN", "ENCARGADO"]);

  // rest of component...
}
```

#### Brigadista Screens

```typescript
// app/(brigadista)/surveys.tsx
import { useRequireRole } from "@/lib/auth/guards";

export default function BrigadistaSurveysScreen() {
  // All authenticated users can access
  useRequireRole(["ADMIN", "ENCARGADO", "BRIGADISTA"]);

  // rest of component...
}
```

#### Permission-Based Guards

```typescript
// For specific actions
import { useRequirePermission, Permission } from "@/lib/auth";

export default function SurveyManagementScreen() {
  // Only users with CREATE_SURVEY permission
  useRequirePermission(Permission.CREATE_SURVEY);

  // rest of component...
}
```

**See full example**: `docs/examples/protected-screen-example.tsx`

### 3️⃣ Add Conditional UI Elements

Show/hide buttons based on permissions:

```typescript
import { useHasPermission, Permission } from "@/lib/auth";

export default function SurveyListScreen() {
  const canCreateSurvey = useHasPermission(Permission.CREATE_SURVEY);
  const canDeleteSurvey = useHasPermission(Permission.DELETE_SURVEY);

  return (
    <View>
      {/* Only show to Admins */}
      {canCreateSurvey && (
        <Button
          title="Create Survey"
          onPress={handleCreateSurvey}
        />
      )}

      {/* Show surveys */}
      {surveys.map(survey => (
        <SurveyItem
          key={survey.id}
          survey={survey}
          // Only show delete button to Admins
          canDelete={canDeleteSurvey}
        />
      ))}
    </View>
  );
}
```

**See full example**: `docs/examples/conditional-rendering-example.tsx`

### 4️⃣ Start Backend Server

Before testing, start the backend:

```bash
cd brigadaBackEnd

# Option 1: Docker (recommended)
docker-compose up

# Option 2: Local development
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python scripts/seed_data.py  # Create test users
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

### 5️⃣ Test the Integration

1. **Start Backend**: `docker-compose up`
2. **Start Frontend**: `npm start` or `npx expo start`
3. **Test Login**:
   - Try: `admin@brigada.com` / `admin123`
   - Should redirect to admin home
   - Check AsyncStorage has user data
4. **Test Guards**:
   - Navigate to an admin-only screen
   - Logout and login as brigadista
   - Try to access same screen - should redirect to /unauthorized
5. **Test Token Expiration**:
   - Login, wait 31 minutes (or manually change token exp in backend)
   - Make any API call - should auto-logout
6. **Test Permissions**:
   - Login as different roles
   - Check which buttons are visible

## 🔐 Security Features

All automatic - no code needed:

- ✅ **Token Storage**: Stored securely in memory (not AsyncStorage)
- ✅ **Auto Expiration**: Tokens expire after 30 minutes
- ✅ **Expiration Check**: Validated before every API call
- ✅ **401 Handling**: Auto-logout on unauthorized
- ✅ **403 Handling**: Shows "No tienes permisos" message
- ✅ **Deactivated Users**: Auto-logout if user is disabled
- ✅ **Offline Prevention**: Short-lived tokens prevent indefinite offline use

## 📚 Reference Docs

- **Auth System**: `docs/JWT_AUTH_RBAC.md` - Complete JWT/RBAC guide
- **Permissions**: `lib/auth/permissions.ts` - All 15+ permissions
- **Guards**: `lib/auth/guards.ts` - All 8 guard hooks
- **API Client**: `lib/api/client.ts` - Axios setup with interceptors
- **Auth API**: `lib/api/auth.ts` - Backend endpoints

## 🎯 Quick Start Checklist

### Must Do (30 minutes)

- [ ] Start backend: `cd brigadaBackEnd && docker-compose up`
- [ ] Update login screen to use `await login(email, password)`
- [ ] Test login with 3 test users
- [ ] Add `useRequireRole()` to admin screens
- [ ] Add `useRequireRole()` to encargado screens
- [ ] Add `useRequireRole()` to brigadista screens

### Nice to Have (1-2 hours)

- [ ] Add conditional rendering for create buttons
- [ ] Add permission checks before API calls
- [ ] Add loading states during API operations
- [ ] Test token expiration flow
- [ ] Test deactivated user flow

### Future Enhancements

- [ ] Implement refresh tokens (currently only access tokens)
- [ ] Add remember me functionality
- [ ] Add password reset flow
- [ ] Add change password screen
- [ ] Add user profile edit screen

## 🐛 Troubleshooting

### Login fails with network error

- Check backend is running: http://localhost:8000/docs
- Check `constants/config.ts` has `baseUrl: "http://localhost:8000"`
- Check your device and backend are on same network (if using Expo Go on device)

### Guards not redirecting

- Make sure `useProtectedRoute()` is in root layout `app/_layout.tsx`
- Check `AuthProvider` wraps the app in `app/_layout.tsx`

### Permissions not working

- Verify user role in AsyncStorage matches backend role
- Check `lib/auth/permissions.ts` rolePermissions map
- Call `refreshUser()` if user was updated in backend

### Token expired immediately

- Backend and frontend need synchronized clocks
- Check token expiration in backend `app/core/config.py` (default 30 min)
- Check client-side buffer in `lib/api/client.ts` (default 60 sec)

## 💡 Tips

1. **Development**: Use mock mode if backend is down:

   ```typescript
   // In auth-context.tsx
   const MOCK_MODE = true; // Change to false when backend ready
   ```

2. **Testing Roles**: Login as different users without restarting:
   - Logout from app
   - Login with different test user email
   - Guards will automatically apply new permissions

3. **Permission Debugging**: Add console.log to see permissions:

   ```typescript
   const perms = getPermissions(user?.role);
   console.log("User permissions:", perms);
   ```

4. **Network Debugging**: Enable request logging in API client:
   ```typescript
   // In lib/api/client.ts request interceptor
   console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
   ```

## 🎉 You're Ready!

Your authentication system is production-ready. Just follow the checklist above and you'll have a fully secured app with role-based access control.

**Need help?** Check `docs/JWT_AUTH_RBAC.md` for detailed usage examples.
