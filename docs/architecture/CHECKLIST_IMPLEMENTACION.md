# ✅ Checklist de Implementación - Mejoras Arquitectónicas

**Proyecto:** Brigadá Frontend  
**Fecha Inicio:** 9 de febrero, 2026  
**Estado:** 🟡 En Progreso

---

## 🚨 Sprint 1: Autenticación & API (CRÍTICO)

### 🔐 1. Sistema de Autenticación Completo

#### **Dependencias**

- [ ] Instalar `expo-secure-store`
  ```bash
  npx expo install expo-secure-store
  ```
- [ ] Instalar `zustand` (opcional, para estado global)
  ```bash
  npm install zustand
  ```

#### **Servicios**

- [ ] Crear `lib/services/auth.service.ts`
  - [ ] Método `login(credentials)`
  - [ ] Método `logout()`
  - [ ] Método `checkSession()`
  - [ ] Método `getCurrentUser()`
  - [ ] Método `refreshAccessToken()`
  - [ ] Guardar tokens en SecureStore
  - [ ] Guardar usuario en AsyncStorage
- [ ] Crear `lib/services/index.ts` (barrel export)

#### **Context API**

- [ ] Crear `contexts/auth.context.tsx`
  - [ ] State: `user`, `isLoading`, `isAuthenticated`
  - [ ] Método `login(email, password)`
  - [ ] Método `logout()`
  - [ ] Método `refreshUser()`
  - [ ] useEffect para verificar sesión al inicio
- [ ] Crear `contexts/index.ts` (barrel export)
- [ ] Envolver app con `<AuthProvider>` en `app/_layout.tsx`

#### **Hooks Personalizados**

- [ ] Crear `hooks/useAuth.ts` (usar AuthContext)
- [ ] Exportar desde `hooks/index.ts`

#### **Integración en Pantallas**

- [ ] Actualizar `app/(auth)/login.tsx`
  - [ ] Importar `useAuth`
  - [ ] Llamar `login()` al enviar formulario
  - [ ] Manejar errores
  - [ ] Navegar a tabs si login exitoso
- [ ] Actualizar `app/_layout.tsx`
  - [ ] Importar `useAuth`
  - [ ] Usar `isAuthenticated` para determinar stack
  - [ ] Mostrar splash mientras `isLoading`
- [ ] Actualizar `app/profile.tsx`
  - [ ] Importar `useAuth`
  - [ ] Mostrar datos de `user`
  - [ ] Llamar `logout()` al presionar botón

#### **Variables de Entorno**

- [ ] Crear `.env` (NO subir a git)
  ```
  EXPO_PUBLIC_API_URL=https://api.brigada.com
  ```
- [ ] Agregar `.env` a `.gitignore`
- [ ] Documentar en `docs/SETUP.md`

---

### 🌐 2. Capa de API con Axios

#### **Cliente HTTP Base**

- [ ] Crear `lib/api/axios-instance.ts`
  - [ ] Crear instancia de axios con baseURL
  - [ ] Configurar timeout (15s)
  - [ ] Request interceptor: agregar token de SecureStore
  - [ ] Response interceptor: manejar 401 y refresh token
  - [ ] Response interceptor: manejar errores de red
- [ ] Exportar `apiClient`

#### **APIs por Módulo**

- [ ] Crear `lib/api/survey.api.ts`
  - [ ] `getAssignedSurveys()` - GET /surveys/assigned
  - [ ] `getSurveySchema(id)` - GET /surveys/:id/schema
  - [ ] `submitResponse(data)` - POST /responses
  - [ ] `syncPendingResponses(batch)` - POST /responses/batch
- [ ] Crear `lib/api/user.api.ts`
  - [ ] `getProfile()` - GET /user/profile
  - [ ] `updateProfile(data)` - PUT /user/profile
  - [ ] `uploadAvatar(file)` - POST /user/avatar
- [ ] Crear `lib/api/index.ts` (barrel export)

#### **Tipos TypeScript**

- [ ] Crear `types/api.types.ts`
  - [ ] Interface `ApiResponse<T>`
  - [ ] Interface `ApiError`
  - [ ] Interface `PaginatedResponse<T>`
- [ ] Crear `types/dto/` (Data Transfer Objects)
  - [ ] `survey.dto.ts`
  - [ ] `response.dto.ts`
  - [ ] `user.dto.ts`

---

### 🧪 3. Testing Básico

#### **Setup de Testing**

- [ ] Instalar dependencias de testing
  ```bash
  npm install -D jest @testing-library/react-native @testing-library/jest-native @types/jest jest-expo
  ```
- [ ] Crear `jest.config.js`
- [ ] Crear `jest.setup.js`
- [ ] Agregar scripts a `package.json`
  ```json
  {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
  ```

#### **Tests de Servicios**

- [ ] Crear `__tests__/services/auth.service.test.ts`
  - [ ] Test: login exitoso
  - [ ] Test: login con credenciales incorrectas
  - [ ] Test: logout limpia storage
  - [ ] Test: checkSession retorna true con token válido
  - [ ] Test: checkSession retorna false sin token
  - [ ] Test: refreshAccessToken funciona correctamente
- [ ] Crear `__tests__/services/__mocks__/`
  - [ ] Mock de AsyncStorage
  - [ ] Mock de SecureStore
  - [ ] Mock de axios

#### **Tests de Componentes**

- [ ] Crear `__tests__/components/ui/Button.test.tsx`
  - [ ] Test: renderiza correctamente
  - [ ] Test: llama onPress al presionar
  - [ ] Test: muestra loading spinner
  - [ ] Test: está disabled cuando loading
- [ ] Crear `__tests__/components/ui/Input.test.tsx`
  - [ ] Test: renderiza con placeholder
  - [ ] Test: muestra/oculta password
  - [ ] Test: muestra mensaje de error

#### **Tests de Hooks**

- [ ] Crear `__tests__/hooks/useAuth.test.ts`
  - [ ] Test: retorna usuario cuando está autenticado
  - [ ] Test: login actualiza estado
  - [ ] Test: logout limpia estado

---

## 🏗️ Sprint 2: Arquitectura & Estado Global

### 📦 4. Feature-Based Architecture

#### **Migración de Estructura**

- [ ] Crear carpeta `features/`
- [ ] Migrar feature `auth/`
  - [ ] `features/auth/components/`
  - [ ] `features/auth/screens/`
  - [ ] `features/auth/services/`
  - [ ] `features/auth/hooks/`
  - [ ] `features/auth/types/`
- [ ] Migrar feature `surveys/`
  - [ ] `features/surveys/components/`
  - [ ] `features/surveys/screens/`
  - [ ] `features/surveys/services/`
  - [ ] `features/surveys/hooks/`
  - [ ] `features/surveys/types/`
- [ ] Migrar feature `profile/`
  - [ ] `features/profile/components/`
  - [ ] `features/profile/screens/`
  - [ ] `features/profile/services/`
  - [ ] `features/profile/hooks/`
- [ ] Actualizar imports en toda la app
- [ ] Actualizar `tsconfig.json` paths
- [ ] Documentar en `docs/architecture/FEATURE_STRUCTURE.md`

---

### 🔄 5. React Query para Data Fetching

#### **Setup**

- [ ] React Query ya instalado ✅ (`@tanstack/react-query`)
- [ ] Crear `lib/query/query-client.ts`
  - [ ] Configurar QueryClient
  - [ ] Configurar default options (staleTime, gcTime)
  - [ ] Configurar retry logic
- [ ] Envolver app con `<QueryClientProvider>` en `app/_layout.tsx`

#### **Hooks de Query**

- [ ] Crear `features/surveys/hooks/useSurveys.ts`
  - [ ] Hook `useSurveys()` - fetch assigned surveys
  - [ ] Hook `useSurveySchema(id)` - fetch schema
  - [ ] Hook `useSubmitResponse()` - mutation para enviar
  - [ ] Hook `useSyncResponses()` - mutation para sync
- [ ] Crear `features/profile/hooks/useProfile.ts`
  - [ ] Hook `useProfile()` - fetch profile
  - [ ] Hook `useUpdateProfile()` - mutation
  - [ ] Hook `useUploadAvatar()` - mutation

#### **Integración en Componentes**

- [ ] Actualizar `features/surveys/screens/SurveyListScreen.tsx`
  - [ ] Usar `useSurveys()` en lugar de fetch manual
  - [ ] Manejar `isLoading`, `error`, `data`
  - [ ] Implementar pull-to-refresh
- [ ] Actualizar `features/profile/screens/ProfileScreen.tsx`
  - [ ] Usar `useProfile()`
  - [ ] Implementar optimistic updates

---

### 📱 6. Zustand para Estado Global

#### **Setup**

- [ ] Instalar `zustand` si no está
  ```bash
  npm install zustand
  ```

#### **Stores**

- [ ] Crear `store/auth.store.ts`
  - [ ] State: `user`, `isAuthenticated`
  - [ ] Actions: `setUser`, `clearUser`
  - [ ] Persistence con AsyncStorage
- [ ] Crear `store/ui.store.ts`
  - [ ] State: `theme`, `language`, `notifications`
  - [ ] Actions: `setTheme`, `setLanguage`, `toggleNotifications`
- [ ] Crear `store/offline.store.ts`
  - [ ] State: `isOnline`, `pendingActions`
  - [ ] Actions: `setOnlineStatus`, `addPendingAction`, `clearPending`
- [ ] Crear `store/index.ts` (barrel export)

#### **Integración**

- [ ] Reemplazar Context API con Zustand donde sea más eficiente
- [ ] Documentar cuándo usar Context vs Zustand en `docs/STATE_MANAGEMENT.md`

---

## ⚡ Sprint 3: Performance & Validación

### 🚀 7. Optimización de Performance

#### **Memoización**

- [ ] Audit componentes con React DevTools Profiler
- [ ] Envolver componentes pesados con `React.memo()`
  - [ ] `SurveyCard`
  - [ ] `QuestionRenderer`
  - [ ] `ProfileCard`
- [ ] Usar `useCallback` para funciones pasadas como props
- [ ] Usar `useMemo` para cálculos costosos

#### **Virtualización de Listas**

- [ ] Instalar `@shopify/flash-list`
  ```bash
  npm install @shopify/flash-list
  ```
- [ ] Reemplazar `FlatList` con `FlashList` en:
  - [ ] Lista de encuestas
  - [ ] Lista de preguntas
  - [ ] Historial de respuestas
- [ ] Configurar `estimatedItemSize` correctamente

#### **Lazy Loading**

- [ ] Implementar `React.lazy` para screens pesadas
- [ ] Crear `<Suspense>` wrapper con fallback
- [ ] Lazy load componentes grandes (gráficos, mapas)

#### **Optimización de Imágenes**

- [ ] Usar `expo-image` en lugar de `Image` nativa
- [ ] Configurar `blurhash` para placeholders
- [ ] Implementar cache de imágenes
- [ ] Optimizar tamaños de imágenes en assets

---

### ✅ 8. Validación con Zod

#### **Setup**

- [ ] Instalar `zod` y `react-hook-form`
  ```bash
  npm install zod react-hook-form @hookform/resolvers
  ```

#### **Schemas de Validación**

- [ ] Crear `lib/validation/auth.schema.ts`
  - [ ] Schema `loginSchema`
  - [ ] Schema `registerSchema`
  - [ ] Schema `resetPasswordSchema`
- [ ] Crear `lib/validation/survey.schema.ts`
  - [ ] Schema `textQuestionSchema`
  - [ ] Schema `numberQuestionSchema`
  - [ ] Schema `dateQuestionSchema`
  - [ ] Schema `photoQuestionSchema`
- [ ] Crear `lib/validation/profile.schema.ts`
  - [ ] Schema `updateProfileSchema`

#### **Integración en Formularios**

- [ ] Integrar con `react-hook-form` en:
  - [ ] Login form
  - [ ] Register form
  - [ ] Profile edit form
  - [ ] Survey forms

---

## 🎨 Sprint 4: UI/UX & CI/CD

### 🎨 9. Theming Avanzado

#### **Opción A: React Native Paper**

- [ ] Instalar React Native Paper
  ```bash
  npm install react-native-paper react-native-vector-icons
  ```
- [ ] Crear `theme/paper-theme.ts`
- [ ] Envolver app con `<PaperProvider>`
- [ ] Migrar componentes UI a Paper components

#### **Opción B: NativeBase**

- [ ] Instalar NativeBase
  ```bash
  npm install native-base
  ```
- [ ] Crear `theme/nativebase-theme.ts`
- [ ] Envolver app con `<NativeBaseProvider>`
- [ ] Migrar componentes UI a NativeBase

#### **Dark Mode**

- [ ] Implementar toggle dark/light mode
- [ ] Guardar preferencia en AsyncStorage
- [ ] Sincronizar con system theme
- [ ] Actualizar colores en `constants/colors.ts`

---

### 🧪 10. E2E Testing con Detox

#### **Setup**

- [ ] Instalar Detox
  ```bash
  npm install -D detox jest
  ```
- [ ] Configurar `.detoxrc.js`
- [ ] Crear build para testing
- [ ] Crear `e2e/` folder

#### **Tests E2E**

- [ ] `e2e/auth.e2e.ts`
  - [ ] Test: login flow completo
  - [ ] Test: logout
  - [ ] Test: invalid credentials
- [ ] `e2e/surveys.e2e.ts`
  - [ ] Test: ver lista de encuestas
  - [ ] Test: completar encuesta
  - [ ] Test: guardar como borrador
- [ ] `e2e/offline.e2e.ts`
  - [ ] Test: app funciona offline
  - [ ] Test: sync al volver online

---

### 🚀 11. CI/CD con GitHub Actions

#### **GitHub Actions Workflows**

- [ ] Crear `.github/workflows/test.yml`
  - [ ] Correr tests en cada push
  - [ ] Generar coverage report
  - [ ] Fallar si coverage < 80%
- [ ] Crear `.github/workflows/lint.yml`
  - [ ] Correr ESLint
  - [ ] Correr TypeScript check
  - [ ] Correr Prettier check
- [ ] Crear `.github/workflows/build.yml`
  - [ ] Build con EAS Build
  - [ ] Upload a TestFlight/Play Store (solo en tags)

#### **EAS Build**

- [ ] Configurar `eas.json`
  - [ ] Profile `development`
  - [ ] Profile `preview`
  - [ ] Profile `production`
- [ ] Crear builds de prueba
- [ ] Configurar secrets en GitHub
- [ ] Documentar proceso en `docs/DEPLOYMENT.md`

---

## 📊 Métricas de Calidad

### **Cobertura de Tests**

- [ ] Unit tests: >= 80%
- [ ] Integration tests: >= 60%
- [ ] E2E tests: Flujos críticos cubiertos

### **Performance**

- [ ] Time to Interactive (TTI): < 3s
- [ ] Bundle size: < 5MB
- [ ] Startup time: < 2s
- [ ] Smooth 60 FPS en animaciones

### **Code Quality**

- [ ] ESLint: 0 errores
- [ ] TypeScript: strict mode, 0 errores
- [ ] Complexity: Cyclomatic < 10
- [ ] Duplicación: < 3%

---

## 🎯 Estado General

### **Completado** ✅

- [x] Splash screen optimizado
- [x] UI components base
- [x] Design system (colors, typography, spacing)
- [x] Welcome/Login screens (UI)
- [x] SQLite con Drizzle ORM
- [x] Documentación completa

### **En Progreso** 🟡

- [ ] Sistema de autenticación
- [ ] Capa de API
- [ ] Testing setup

### **Pendiente** ⏳

- [ ] Feature-based architecture
- [ ] React Query integration
- [ ] Zustand stores
- [ ] Performance optimization
- [ ] Zod validation
- [ ] Theming avanzado
- [ ] E2E testing
- [ ] CI/CD pipeline

---

## 📝 Notas

**Prioridad de Implementación:**

1. 🔴 Autenticación (crítico)
2. 🔴 API layer (crítico)
3. 🟠 Testing básico (alta)
4. 🟡 Feature architecture (media)
5. 🟢 UI theming (baja)

**Tiempo Estimado Total:** 6-8 semanas (a tiempo completo)

**Dependencias Críticas:**

- Backend API funcionando
- Endpoints documentados
- JWT implementado en backend
- Variables de entorno configuradas

---

**Última Actualización:** 9 de febrero, 2026  
**Responsable:** Equipo Brigadá  
**Versión:** 1.0
