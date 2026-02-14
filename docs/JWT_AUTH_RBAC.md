# JWT-Based Authentication & RBAC System

Complete implementation of JWT authentication with role-based access control for the Brigada Survey System.

## 🎯 Features Implemented

### 1. JWT Authentication



- ✅ Short-lived access tokens (30 minutes default)
- ✅ Token stored securely in AsyncStorage
- ✅ Automatic token expiration checking
- ✅ Token refresh on app startup
- ✅ Deactivated users cannot authenticate



### 2. Role-Based Access Control (RBAC)


Three roles with distinct permissions:


#### Admin

- Create, edit, delete surveys

- Create, edit, delete users
- Manage all assignments
- View all responses

- Full system access


#### Encargado (Supervisor)

- View all surveys
- Create and manage assignments

- View responses from assigned brigadistas

- Cannot create surveys or users


#### Brigadista

- View assigned surveys

- Submit survey responses


- View own responses only
- Cannot access admin features

### 3. Permission System

Granular permissions enforce access at:


- API endpoint level (backend)
- Route level (frontend guards)
- Component level (conditional rendering)
- Action level (button visibility)

### 4. Security Features

- JWT tokens with expiration validation
- Automatic logout on token expiration
- Automatic logout on user deactivation
- 401/403 error handling with auto-redirect
- Secure token storage

## 📁 File Structure

```
lib/
├── api/
│   ├── client.ts          # Axios instance with JWT interceptors
│   ├── auth.ts            # Auth API endpoints
│   ├── types.ts           # API types and interfaces
│   └── index.ts
├── auth/
│   ├── permissions.ts     # Permission definitions and checks
│   ├── guards.ts          # Route guards and hooks
│   └── index.ts
contexts/
└── auth-context.tsx       # Updated with JWT integration
app/
└── unauthorized.tsx       # Unauthorized access screen
```

## 🚀 Usage Examples

### 1. Protect Routes by Role

```tsx
import { useRequireRole } from "@/lib/auth/guards";

export default function AdminScreen() {
  // Only allow Admin role
  useRequireRole(["ADMIN"]);

  return <View>...</View>;
}
```

### 2. Protect Routes by Permission

```tsx
import { useRequirePermission, Permission } from "@/lib/auth";

export default function CreateSurveyScreen() {
  // Require specific permission
  useRequirePermission(Permission.CREATE_SURVEY);

  return <View>...</View>;
}
```

### 3. Conditional Rendering

```tsx
import { useHasPermission, Permission } from "@/lib/auth";

function SurveyList() {
  const canCreate = useHasPermission(Permission.CREATE_SURVEY);

  return (
    <View>
      {canCreate && <Button title="Create Survey" onPress={handleCreate} />}
    </View>
  );
}
```

### 4. Login with Backend

```tsx
import { useAuth } from "@/contexts/auth-context";

function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Auto-redirects to role-specific home
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return <View>...</View>;
}
```

### 5. Check Multiple Permissions

```tsx
import { useHasAnyPermission, Permission } from "@/lib/auth";

function ResponsesScreen() {
  // Check if user can view any responses
  const canViewResponses = useHasAnyPermission([
    Permission.VIEW_ALL_RESPONSES,
    Permission.VIEW_ASSIGNED_RESPONSES,

    Permission.VIEW_OWN_RESPONSES,
  ]);

  if (!canViewResponses) {
    return <Text>No tienes acceso a respuestas</Text>;
  }


  return <View>...</View>;

}
```

## 🔐 Permission Reference


### Survey Management


- `CREATE_SURVEY` - Create new surveys (Admin only)
- `EDIT_SURVEY` - Edit surveys (Admin only)

- `DELETE_SURVEY` - Delete surveys (Admin only)
- `VIEW_ALL_SURVEYS` - View all surveys (Admin, Encargado)
- `PUBLISH_SURVEY` - Publish survey versions (Admin only)


### User Management


- `CREATE_USER` - Create users (Admin only)
- `EDIT_USER` - Edit any user (Admin only)
- `DELETE_USER` - Delete users (Admin only)
- `VIEW_ALL_USERS` - View all users (Admin only)


### Assignment Management

- `CREATE_ASSIGNMENT` - Create assignments (Admin, Encargado)
- `EDIT_ASSIGNMENT` - Edit assignments (Admin, Encargado)
- `DELETE_ASSIGNMENT` - Delete assignments (Admin, Encargado)

- `VIEW_ASSIGNMENTS` - View assignments (All roles - filtered by role)

### Survey Responses

- `SUBMIT_RESPONSE` - Submit responses (Brigadista only)
- `VIEW_OWN_RESPONSES` - View own responses (Brigadista)
- `VIEW_ASSIGNED_RESPONSES` - View brigadista responses (Encargado)
- `VIEW_ALL_RESPONSES` - View all responses (Admin)

### Profile

- `EDIT_OWN_PROFILE` - Edit own profile (All roles)
- `CHANGE_OWN_PASSWORD` - Change own password (All roles)

## 🔧 Configuration

### Token Lifetime

Backend controls token expiration (default: 30 minutes). Configure in `brigadaBackEnd/app/core/config.py`:

```python
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Short-lived for security
```

### API Base URL

Update in `constants/config.ts`:

```typescript
api: {
  baseUrl: __DEV__
    ? "http://localhost:8000"  // Backend dev server
    : "https://api.brigada.com",
  timeout: 30000,
}
```

##<admin@brigada.com>
<encargado@brigada.com>
##<brigadista@brigada.com>lopment)
<encargado@brigada.com>
Un<brigadista@brigada.com>uth-context.tsx` to test without backend:

```tsx
const mockUser: User = {
  id: 999,
  email: "test@brigada.com",
  name: "Test User",
  role: "ADMIN", // Change role to test
  state: "ACTIVE",
  created_at: Date.now(),
  updated_at: Date.now(),
};<admin@brigada.com>
se<encargado@brigada.com>

se<brigadista@brigada.com>");
```

### Test Users (Backend)

Use seeded test users from backend:


| Email                  | Password      | Role       |
| ---------------------- | ------------- | ---------- |
| admin@brigada.com      | admin123      | ADMIN      |
| encargado@brigada.com  | encargado123  | ENCARGADO  |
| brigadista@brigada.com | brigadista123 | BRIGADISTA |



## 🛡️ Security Best Practices

1. **Short-lived tokens**: 30-minute expiration prevents indefinite offline usage
2. **Token validation**: Checked on every API request
3. **User deactivation**: Disabled users auto-logout on token refresh
4. **No refresh tokens in mobile**: Use re-login for better security
5. **401/403 handling**: Auto-redirect to login on auth failures


## 🎨 User Flows

### Login Flow

1. User enters email/password

2. Backend validates credentials
3. Backend returns JWT access token
4. Frontend stores token + user data
5. Auto-redirect to role-specific home

### Token Expiration Flow


1. User makes API request
2. Interceptor checks token expiration
3. If expired: Clear session → Redirect to login
4. If valid: Add to Authorization header

### Permission Denied Flow
1
1. User accesses protected route
1. Guard checks user role/permissions

3. If denied: Redirect to `/unauthorized`
4. User can go back or return home

## 📊 Role Matrix

| Feature            | Admin | Encargado     | Brigadista    |
1
| ------------------ | ----- | ------------- | ------------- |
1 Create Surveys     | ✅    | ❌            | ❌            |

| View Surveys       | ✅    | ✅            | ✅ (assigned) |
| Create Users       | ✅    | ❌            | ❌            |
| Create Assignments | ✅    | ✅            | ❌            |
| Submit Responses   | ❌    | ❌            | ✅            |
| View All Responses | ✅    | ✅ (assigned) | ❌            |
| View Own Responses | ✅    | ✅            | ✅            |

1# 🔄 Migration Guide



### Updating Existing Screens

1. **Add route guard**:


```tsx
import { useRequireRole } from "@/lib/auth/guards";

1xport default function MyScreen() {


  useRequireRole(["ADMIN", "ENCARGADO"]);
  // ... rest of component
}
```

2. **Update login calls**:

```tsx
// Old

await login(userObject, tokenString);

// New
await login(email, password);

```


3. **Add permission checks**:

```tsx

import { useHasPermission, Permission } from "@/lib/auth";

const canCreate = useHasPermission(Permission.CREATE_SURVEY);
```

## 🚨 Troubleshooting

### Token expired immediately

- Check backend token expiration settings
- Verify system time is synchronized

### 401 errors on all requests

- Verify backend is running
- Check API_URL in config
- Ensure login was successful


### Permission denied unexpectedly

- Check role-permission mapping in `permissions.ts`
- Verify user role in backend
- Check route guard implementation

## 📝 Next Steps

1. ✅ JWT authentication implemented
2. ✅ RBAC system implemented
3. ✅ Route guards implemented
4. 🔄 Update login screen UI
5. 🔄 Add permission checks to existing screens
6. 🔄 Test all role scenarios
7. 🔄 Add refresh token support (optional)

## 🤝 Contributing

When adding new features:

1. Define permissions in `lib/auth/permissions.ts`
2. Add to role mappings
3. Create route guards for screens
4. Add conditional rendering in components
5. Test with all three roles
