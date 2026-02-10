# 🎯 Próximos Pasos Priorizados - Brigadá App

**Fecha:** 9 de febrero, 2026  
**Arquitecto Senior:** GitHub Copilot  
**Objetivo:** Roadmap claro para las próximas 2-4 semanas

---

## 📊 Resumen Ejecutivo

### Estado Actual ✅

- **UI/UX:** 85% completado (splash, welcome, login, componentes base)
- **Arquitectura:** 40% completado (estructura de carpetas, DB configurada)
- **Backend Integration:** 0% (NO implementado)
- **Testing:** 0% (NO configurado)

### Deuda Técnica Crítica 🚨

1. **Autenticación NO implementada** - Todos los TODOs comentados
2. **Sin capa de servicios/API** - Axios instalado pero sin usar
3. **Sin testing** - Ni Jest ni Testing Library configurados
4. **Estado global básico** - No hay Context API ni Zustand

---

## 🔥 Sprint 1: Autenticación (Semana 1-2)

### Objetivo

**Implementar sistema completo de autenticación con JWT**

### Tareas Priorizadas

#### **Día 1-2: AuthService + SecureStore**

```bash
# 1. Instalar dependencias
npx expo install expo-secure-store

# 2. Crear estructura
mkdir -p lib/services
touch lib/services/auth.service.ts
touch lib/services/index.ts
```

**Archivos a crear:**

- [ ] `lib/services/auth.service.ts` - Core authentication logic
- [ ] `types/auth.types.ts` - TypeScript interfaces
- [ ] `.env` - Variables de entorno (API_URL)

**Testing:**

```bash
# Probar login con Postman/cURL primero
curl -X POST https://api.brigada.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

#### **Día 3-4: AuthContext + Navigation**

**Archivos a crear:**

- [ ] `contexts/auth.context.tsx` - React Context
- [ ] `hooks/useAuth.ts` - Custom hook

**Archivos a modificar:**

- [ ] `app/_layout.tsx` - Integrar AuthProvider + lógica de navegación
- [ ] `app/(auth)/login.tsx` - Conectar con useAuth()
- [ ] `app/profile.tsx` - Mostrar usuario actual

**Testing manual:**

1. Abrir app → debe mostrar Welcome
2. Click "Let's start" → debe ir a Login
3. Ingresar credenciales correctas → debe ir a Tabs
4. Reiniciar app → debe mantener sesión
5. Logout → debe volver a Welcome

---

#### **Día 5: Axios Interceptors**

**Archivos a crear:**

- [ ] `lib/api/axios-instance.ts` - Cliente HTTP con interceptores
- [ ] `lib/api/index.ts` - Barrel export

**Features clave:**

- Request interceptor: agregar JWT automáticamente
- Response interceptor: manejar 401 y refresh token
- Error handling: mostrar toasts en errores de red

**Testing:**

```typescript
// Probar en console
import { apiClient } from "@/lib/api";
apiClient.get("/surveys/assigned").then(console.log);
```

---

### Entregables Sprint 1 ✅

- [x] Usuario puede hacer login
- [x] Token se guarda en SecureStore
- [x] Sesión persiste al reiniciar app
- [x] Refresh token funciona automáticamente
- [x] Logout limpia toda la data
- [x] Interceptores agregan token a todas las requests

### Riesgos Sprint 1 ⚠️

- **Backend no disponible:** Mockear API con `json-server` o MSW
- **SecureStore falla en emulador:** Usar AsyncStorage temporalmente con WARNING
- **Refresh token no funciona:** Implementar solo logout y re-login

---

## 🌐 Sprint 2: API Layer (Semana 2-3)

### Objetivo

**Crear capa completa de servicios API**

### Tareas Priorizadas

#### **Día 1-2: Survey API**

**Archivos a crear:**

- [ ] `lib/api/survey.api.ts`
- [ ] `types/dto/survey.dto.ts`

**Endpoints:**

```typescript
// GET /surveys/assigned - Obtener encuestas asignadas
// GET /surveys/:id/schema - Obtener schema de encuesta
// POST /responses - Enviar respuesta
// POST /responses/batch - Sync múltiples respuestas
```

---

#### **Día 3: User/Profile API**

**Archivos a crear:**

- [ ] `lib/api/user.api.ts`
- [ ] `types/dto/user.dto.ts`

**Endpoints:**

```typescript
// GET /user/profile - Obtener perfil
// PUT /user/profile - Actualizar perfil
// POST /user/avatar - Subir avatar
```

---

#### **Día 4-5: React Query Integration**

**Ya instalado:** `@tanstack/react-query` ✅

**Archivos a crear:**

- [ ] `lib/query/query-client.ts` - Configuración
- [ ] `features/surveys/hooks/useSurveys.ts`
- [ ] `features/profile/hooks/useProfile.ts`

**Modificar:**

- [ ] `app/_layout.tsx` - Envolver con QueryClientProvider

**Ejemplo de uso:**

```typescript
// En SurveyListScreen
const { data: surveys, isLoading, error } = useSurveys();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return <SurveyList surveys={surveys} />;
```

---

### Entregables Sprint 2 ✅

- [x] API client configurado con retry logic
- [x] Survey API funcional (CRUD)
- [x] User API funcional
- [x] React Query cacheando data automáticamente
- [x] Loading/Error states manejados
- [x] Pull-to-refresh funcionando

### Riesgos Sprint 2 ⚠️

- **API endpoints no documentados:** Crear OpenAPI/Swagger docs
- **Cambios en schema backend:** Versionado de API (v1, v2)
- **Network timeouts:** Configurar timeouts apropiados (15s)

---

## 🧪 Sprint 3: Testing Setup (Semana 3-4)

### Objetivo

**Establecer base de testing (>60% coverage)**

### Tareas Priorizadas

#### **Día 1: Jest Setup**

```bash
# Instalar dependencias
npm install -D jest @testing-library/react-native @testing-library/jest-native @types/jest jest-expo

# Crear configs
touch jest.config.js
touch jest.setup.js
```

**Configurar:**

- [ ] `jest.config.js`
- [ ] `jest.setup.js`
- [ ] `package.json` scripts

---

#### **Día 2-3: Unit Tests**

**Prioridad:**

1. [ ] `__tests__/services/auth.service.test.ts`
2. [ ] `__tests__/hooks/useAuth.test.ts`
3. [ ] `__tests__/components/ui/Button.test.tsx`
4. [ ] `__tests__/components/ui/Input.test.tsx`

**Cobertura mínima:** 80% para servicios críticos

---

#### **Día 4-5: Integration Tests**

1. [ ] Login flow completo
2. [ ] Survey submission flow
3. [ ] Offline sync flow

---

### Entregables Sprint 3 ✅

- [x] Jest configurado y corriendo
- [x] > 60% coverage en services/
- [x] Tests de componentes críticos
- [x] CI corriendo tests en cada PR

### Riesgos Sprint 3 ⚠️

- **Tests toman mucho tiempo:** Correr en paralelo
- **Mocks complejos:** Usar MSW para API mocking
- **Coverage bajo:** Enfocarse en paths críticos primero

---

## 📦 Sprint 4: Arquitectura Avanzada (Semana 4-5)

### Objetivo

**Refactorizar a feature-based architecture**

### Tareas Priorizadas

#### **Día 1-2: Feature Structure**

```bash
mkdir -p features/auth/{components,screens,services,hooks,types}
mkdir -p features/surveys/{components,screens,services,hooks,types}
mkdir -p features/profile/{components,screens,services,hooks,types}
```

**Migrar gradualmente:**

1. [ ] Feature `auth/`
2. [ ] Feature `surveys/`
3. [ ] Feature `profile/`

---

#### **Día 3-4: Zustand Stores**

```bash
npm install zustand
```

**Crear:**

- [ ] `store/auth.store.ts`
- [ ] `store/ui.store.ts`
- [ ] `store/offline.store.ts`

---

#### **Día 5: Performance**

- [ ] Instalar `@shopify/flash-list`
- [ ] Reemplazar FlatLists
- [ ] Agregar React.memo() donde necesario
- [ ] Optimizar re-renders

---

### Entregables Sprint 4 ✅

- [x] Feature-based structure
- [x] Zustand para estado global
- [x] FlashList en listas largas
- [x] App arranca en <2s

---

## 🎯 Quick Wins (Implementar YA - 1 hora c/u)

### 1. Variables de Entorno

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.brigada.com
EXPO_PUBLIC_API_TIMEOUT=15000
```

### 2. Error Boundary

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Catch errors in component tree
}
```

### 3. Toast Notifications

```bash
npm install react-native-toast-message
```

### 4. Network Status Hook

```typescript
// hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}
```

### 5. Loading Overlay

```typescript
// components/LoadingOverlay.tsx
export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" />
      <Text>Cargando...</Text>
    </View>
  );
}
```

---

## 📋 Checklist Semanal

### Semana 1

- [ ] Lunes: Setup AuthService + SecureStore
- [ ] Martes: Implementar login/logout
- [ ] Miércoles: AuthContext + useAuth hook
- [ ] Jueves: Integrar en screens (login, profile)
- [ ] Viernes: Axios interceptors + testing manual

### Semana 2

- [ ] Lunes: Survey API + DTOs
- [ ] Martes: User API
- [ ] Miércoles: React Query setup
- [ ] Jueves: useSurveys hook
- [ ] Viernes: useProfile hook + testing

### Semana 3

- [ ] Lunes: Jest setup + primer test
- [ ] Martes: Auth service tests
- [ ] Miércoles: Component tests
- [ ] Jueves: Hook tests
- [ ] Viernes: Integration tests + CI

### Semana 4

- [ ] Lunes: Crear feature/ structure
- [ ] Martes: Migrar auth feature
- [ ] Miércoles: Migrar surveys feature
- [ ] Jueves: Zustand stores
- [ ] Viernes: Performance optimization

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm start                    # Expo dev server
npm run android             # Android build
npm run ios                 # iOS build

# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Linting
npm run lint                # ESLint
npm run lint:fix            # Auto-fix

# Build
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

---

## 📚 Recursos de Aprendizaje

### Documentación Oficial

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand](https://github.com/pmndrs/zustand)
- [Testing Library](https://callstack.github.io/react-native-testing-library/)

### Tutoriales Recomendados

- Kent C. Dodds - Testing React Apps
- React Native EU - Performance Best Practices
- Expo Docs - Authentication Flow

---

## 💡 Consejos del Arquitecto

### 1. Start Simple, Iterate

No intentes implementar todo a la vez. Comienza con:

1. Auth básico (login/logout)
2. Una API funcional (surveys)
3. Un test que pase

### 2. Test Early, Test Often

Escribe tests mientras desarrollas, no al final.

### 3. Use Types Everywhere

TypeScript te salvará de bugs tontos.

### 4. Document as You Go

Actualiza docs/ cuando cambies arquitectura.

### 5. Performance Later

Primero que funcione, luego optimiza.

---

## 🎯 Definición de "Done"

Una feature está DONE cuando:

- [ ] ✅ Código implementado y funcional
- [ ] ✅ Tests escritos y pasando (>80% coverage)
- [ ] ✅ TypeScript sin errores (strict mode)
- [ ] ✅ ESLint sin warnings
- [ ] ✅ Documentado en docs/
- [ ] ✅ Probado en dispositivo real
- [ ] ✅ PR aprobado por peer review

---

## 🚀 Siguiente Sesión de Trabajo

### Opción A: Implementar AuthService (2-3 horas)

"Vamos a implementar el servicio de autenticación completo con SecureStore"

### Opción B: Setup Testing (1-2 horas)

"Vamos a configurar Jest y escribir los primeros tests"

### Opción C: API Layer (2-3 horas)

"Vamos a crear la capa de servicios API con Axios interceptors"

### Opción D: Feature Migration (3-4 horas)

"Vamos a migrar a feature-based architecture"

---

**¿Cuál prefieres empezar? 🤔**

Mi recomendación como arquitecto: **Opción A (AuthService)** porque desbloquea todo lo demás.

---

**Elaborado por:** GitHub Copilot - Senior Architect  
**Fecha:** 9 de febrero, 2026  
**Versión:** 1.0
