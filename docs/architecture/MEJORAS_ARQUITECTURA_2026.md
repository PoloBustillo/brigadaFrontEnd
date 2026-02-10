# 🏗️ Propuesta de Mejoras Arquitectónicas - Brigadá App

**Fecha:** 9 de febrero, 2026  
**Arquitecto:** Senior Full-Stack Developer  
**Proyecto:** Brigadá Frontend (React Native + Expo)

---

## 📋 Índice

1. [Análisis del Estado Actual](#análisis-del-estado-actual)
2. [Mejoras Críticas (Sprint 1-2)](#mejoras-críticas-sprint-1-2)
3. [Mejoras de Arquitectura (Sprint 3-4)](#mejoras-de-arquitectura-sprint-3-4)
4. [Mejoras de Productividad (Sprint 5-6)](#mejoras-de-productividad-sprint-5-6)
5. [Mejoras de Performance](#mejoras-de-performance)
6. [Mejoras de Seguridad](#mejoras-de-seguridad)
7. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🔍 Análisis del Estado Actual

### ✅ Fortalezas Identificadas

1. **Arquitectura Limpia**
   - Estructura de carpetas bien organizada (`app/`, `components/`, `lib/`, `utils/`)
   - Uso de Expo Router para navegación file-based
   - Sistema de componentes base implementado

2. **Base de Datos Robusta**
   - SQLite con Drizzle ORM configurado
   - Repositorios implementados (Survey, Response, Sync, File)
   - Soporte para modo offline

3. **UX/UI Profesional**
   - Splash screen optimizado (WCAG AAA)
   - Sistema de diseño establecido (colors, typography, spacing)
   - Componentes reutilizables (Button, Input, Card, Badge, Alert, ProgressBar)

4. **Documentación Completa**
   - Guías en `docs/guides/`
   - Documentación de fixes en `docs/fixes/`
   - Estructura clara y mantenible

### ⚠️ Áreas de Mejora Críticas

1. **❌ Autenticación NO Implementada**
   - AsyncStorage comentado en `app/_layout.tsx`
   - TODOs en login sin implementar
   - No hay servicio de autenticación
   - No hay gestión de tokens JWT

2. **❌ Sin Capa de Servicios (API)**
   - No existe carpeta `services/` o `api/`
   - No hay cliente HTTP configurado (Axios instalado pero sin usar)
   - No hay interceptores para tokens
   - No hay manejo de errores centralizado

3. **❌ Estado Global Básico**
   - No hay Context API o Zustand/Redux configurado
   - AsyncStorage no se usa para persistencia
   - No hay gestión de usuario actual

4. **❌ Sin Testing**
   - No hay tests unitarios
   - No hay tests de integración
   - No hay E2E tests con Detox

5. **⚠️ Performance No Optimizada**
   - No hay uso de React.memo
   - No hay virtualización de listas
   - No hay lazy loading de componentes

---

## 🚨 Mejoras Críticas (Sprint 1-2)

### 1. 🔐 Implementar Sistema de Autenticación Completo

**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo:** 8-12 horas  
**Impacto:** Alto - Desbloquea funcionalidad principal

#### **1.1. Servicio de Autenticación**

```typescript
// 📁 lib/services/auth.service.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "brigadista" | "supervisor" | "admin";
  avatar?: string;
}

class AuthService {
  private readonly API_URL =
    process.env.EXPO_PUBLIC_API_URL || "https://api.brigada.com";
  private readonly TOKEN_KEY = "auth_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly USER_KEY = "current_user";

  /**
   * Login con email y password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await axios.post<{ user: User; tokens: AuthTokens }>(
        `${this.API_URL}/auth/login`,
        credentials,
      );

      const { user, tokens } = response.data;

      // Guardar tokens de forma segura
      await this.saveTokens(tokens);
      await this.saveUser(user);

      return user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Error de autenticación",
        );
      }
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      const token = await this.getAccessToken();

      // Notificar al backend (opcional)
      if (token) {
        await axios.post(`${this.API_URL}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Limpiar datos locales SIEMPRE
      await this.clearStorage();
    }
  }

  /**
   * Verificar si hay sesión activa
   */
  async checkSession(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;

      // Verificar si el token es válido
      const response = await axios.get(`${this.API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.status === 200;
    } catch (error) {
      // Token inválido o expirado
      await this.clearStorage();
      return false;
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  /**
   * Refrescar access token usando refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        this.REFRESH_TOKEN_KEY,
      );
      if (!refreshToken) return null;

      const response = await axios.post<{
        accessToken: string;
        expiresIn: number;
      }>(`${this.API_URL}/auth/refresh`, { refreshToken });

      const { accessToken } = response.data;
      await SecureStore.setItemAsync(this.TOKEN_KEY, accessToken);

      return accessToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      await this.clearStorage();
      return null;
    }
  }

  // Helpers privados
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(this.TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.TOKEN_KEY);
  }

  private async clearStorage(): Promise<void> {
    await SecureStore.deleteItemAsync(this.TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();
export type { LoginCredentials, User, AuthTokens };
```

#### **1.2. Context de Autenticación**

```typescript
// 📁 contexts/auth.context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '@/lib/services/auth.service';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const hasSession = await authService.checkSession();
      if (hasSession) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login({ email, password });
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### **1.3. Axios Interceptor para Tokens**

```typescript
// 📁 lib/api/axios-instance.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { authService } from "@/lib/services/auth.service";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.brigada.com";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Agregar token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("auth_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Manejar 401 y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refresh token
        const newToken = await authService.refreshAccessToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh falló, logout
        await authService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

---

### 2. 🌐 Crear Capa de Servicios API

**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo:** 6-8 horas  
**Impacto:** Alto - Estructura escalable

```typescript
// 📁 lib/api/survey.api.ts
import { apiClient } from "./axios-instance";

export interface SurveyDTO {
  id: string;
  title: string;
  description: string;
  schema: any;
  active: boolean;
  createdAt: string;
}

export interface CreateResponseDTO {
  surveyId: string;
  answers: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
}

class SurveyAPI {
  /**
   * Obtener encuestas asignadas al usuario
   */
  async getAssignedSurveys(): Promise<SurveyDTO[]> {
    const response = await apiClient.get("/surveys/assigned");
    return response.data;
  }

  /**
   * Obtener schema de encuesta
   */
  async getSurveySchema(surveyId: string): Promise<any> {
    const response = await apiClient.get(`/surveys/${surveyId}/schema`);
    return response.data;
  }

  /**
   * Enviar respuesta completada
   */
  async submitResponse(data: CreateResponseDTO): Promise<void> {
    await apiClient.post("/responses", data);
  }

  /**
   * Sincronizar respuestas pendientes (offline → online)
   */
  async syncPendingResponses(responses: CreateResponseDTO[]): Promise<void> {
    await apiClient.post("/responses/batch", { responses });
  }
}

export const surveyAPI = new SurveyAPI();
```

```typescript
// 📁 lib/api/index.ts
export { apiClient } from "./axios-instance";
export { surveyAPI } from "./survey.api";
export { authService } from "../services/auth.service";
```

---

### 3. 📱 Implementar Estado Global con Zustand

**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 4-6 horas  
**Impacto:** Medio - Mejora gestión de estado

```typescript
// 📁 store/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/lib/services/auth.service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

```bash
# Instalar Zustand
npm install zustand
```

---

### 4. ✅ Testing Básico

**Prioridad:** 🟠 ALTA  
**Esfuerzo:** 8-12 horas  
**Impacto:** Alto - Calidad y confianza

```typescript
// 📁 __tests__/services/auth.service.test.ts
import { authService } from "@/lib/services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

jest.mock("@react-native-async-storage/async-storage");
jest.mock("expo-secure-store");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should login successfully", async () => {
    // Mock axios response
    const mockUser = { id: "1", email: "test@test.com", name: "Test" };

    // Test login
    const user = await authService.login({
      email: "test@test.com",
      password: "password123",
    });

    expect(user).toEqual(mockUser);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it("should logout and clear storage", async () => {
    await authService.logout();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("auth_token");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("current_user");
  });
});
```

```json
// 📁 package.json - Agregar scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.0"
  }
}
```

---

## 🏗️ Mejoras de Arquitectura (Sprint 3-4)

### 5. 📦 Feature-Based Architecture

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 6-10 horas  
**Impacto:** Alto - Escalabilidad

Reorganizar código por features en lugar de tipo de archivo:

```
features/
├── auth/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── services/
│   │   └── auth.service.ts
│   ├── hooks/
│   │   └── useAuth.ts
│   └── types/
│       └── auth.types.ts
├── surveys/
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── hooks/
└── profile/
    ├── components/
    ├── screens/
    └── services/
```

**Beneficios:**

- ✅ Código relacionado agrupado
- ✅ Fácil encontrar archivos
- ✅ Imports más limpios
- ✅ Escalable a largo plazo

---

### 6. 🔄 React Query para Data Fetching

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 6-8 horas  
**Impacto:** Alto - Cache automático, sincronización

```typescript
// 📁 features/surveys/hooks/useSurveys.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { surveyAPI } from "@/lib/api";

export function useSurveys() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: () => surveyAPI.getAssignedSurveys(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: surveyAPI.submitResponse,
    onSuccess: () => {
      // Invalidar cache de respuestas
      queryClient.invalidateQueries({ queryKey: ["responses"] });
    },
  });
}
```

**Beneficios:**

- ✅ Cache automático
- ✅ Refetch automático
- ✅ Loading/Error states
- ✅ Optimistic updates
- ✅ Menos boilerplate

---

### 7. 🎨 Theming con React Native Paper o NativeBase

**Prioridad:** 🟢 BAJA  
**Esfuerzo:** 4-6 horas  
**Impacto:** Medio - UI consistente

```typescript
// 📁 theme/paper-theme.ts
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { colors } from "@/constants/colors";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
  },
};
```

---

## ⚡ Mejoras de Performance

### 8. Optimización de Renders

```typescript
// Memoizar componentes pesados
const SurveyCard = React.memo(({ survey }: { survey: Survey }) => {
  // ...
});

// Memoizar callbacks
const handleSubmit = useCallback(() => {
  submitResponse(data);
}, [data]);

// Memoizar valores calculados
const totalAnswered = useMemo(() => {
  return answers.filter((a) => a.completed).length;
}, [answers]);
```

### 9. Virtualización de Listas

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={surveys}
  renderItem={({ item }) => <SurveyCard survey={item} />}
  estimatedItemSize={120}
/>
```

---

## 🔒 Mejoras de Seguridad

### 10. Validación con Zod

```typescript
// 📁 lib/validation/auth.schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    name: z.string().min(2),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
```

### 11. Expo Secure Store para Datos Sensibles

```bash
# Ya instalado, solo usar correctamente
npx expo install expo-secure-store
```

```typescript
// SIEMPRE usar SecureStore para tokens
import * as SecureStore from "expo-secure-store";

// ✅ CORRECTO
await SecureStore.setItemAsync("auth_token", token);

// ❌ INCORRECTO
await AsyncStorage.setItem("auth_token", token);
```

---

## 📅 Roadmap de Implementación

### **Sprint 1 (1-2 semanas)**

- [x] Splash screen optimizado (COMPLETADO)
- [x] UI components base (COMPLETADO)
- [ ] 🔴 **Implementar AuthService completo**
- [ ] 🔴 **Crear AuthContext**
- [ ] 🔴 **Configurar Axios interceptors**
- [ ] 🔴 **Integrar login real con backend**

### **Sprint 2 (1-2 semanas)**

- [ ] 🔴 **Crear capa de API (survey.api, user.api)**
- [ ] 🟠 **Implementar Zustand stores**
- [ ] 🟠 **Setup Jest + Testing Library**
- [ ] 🟠 **Escribir tests unitarios para auth**

### **Sprint 3 (1-2 semanas)**

- [ ] 🟡 **Migrar a feature-based architecture**
- [ ] 🟡 **Implementar React Query**
- [ ] 🟡 **Optimizar renders con memo/callback**
- [ ] 🟡 **Agregar Zod validation**

### **Sprint 4 (1-2 semanas)**

- [ ] 🟢 **Implementar theming (Paper/NativeBase)**
- [ ] 🟢 **Virtualización con FlashList**
- [ ] 🟢 **E2E tests con Detox**
- [ ] 🟢 **CI/CD con EAS Build**

---

## 🎯 Próximos Pasos Inmediatos (Esta Semana)

### **Día 1-2: Autenticación**

1. Crear `lib/services/auth.service.ts`
2. Crear `contexts/auth.context.tsx`
3. Integrar en `app/_layout.tsx`
4. Implementar login real en `app/(auth)/login.tsx`

### **Día 3-4: API Layer**

1. Crear `lib/api/axios-instance.ts` con interceptors
2. Crear `lib/api/survey.api.ts`
3. Crear `lib/api/user.api.ts`
4. Exportar todo desde `lib/api/index.ts`

### **Día 5: Testing Setup**

1. Configurar Jest + Testing Library
2. Escribir tests para `auth.service.ts`
3. Escribir tests para componentes críticos
4. Configurar CI en GitHub Actions

---

## 📚 Recursos y Librerías Recomendadas

### **Ya Instaladas** ✅

- `@tanstack/react-query` - Data fetching (YA INSTALADO)
- `axios` - HTTP client (YA INSTALADO)
- `@react-native-async-storage/async-storage` (YA INSTALADO)
- `drizzle-orm` - ORM (YA INSTALADO)

### **Por Instalar** 📦

```bash
# Autenticación segura
npx expo install expo-secure-store

# Estado global
npm install zustand

# Validación
npm install zod

# Testing
npm install -D jest @testing-library/react-native @testing-library/jest-native

# Performance
npm install @shopify/flash-list

# UI Library (opcional)
npm install react-native-paper
# O
npm install native-base
```

---

## 💡 Consejos de Arquitecto Senior

### **1. Separation of Concerns**

- ✅ Servicios para lógica de negocio
- ✅ Repositorios para acceso a datos
- ✅ Componentes solo para UI
- ✅ Hooks para lógica reutilizable

### **2. Single Responsibility**

- Cada archivo/función hace UNA cosa
- Componentes pequeños (< 200 líneas)
- Funciones puras siempre que sea posible

### **3. DRY (Don't Repeat Yourself)**

- Crear hooks personalizados
- Reutilizar componentes
- Centralizar configuración (API URLs, constantes)

### **4. Error Handling**

```typescript
// Centralizar manejo de errores
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
  ) {
    super(message);
  }
}

// Error boundary para React
class ErrorBoundary extends React.Component {
  // ...
}
```

### **5. Performance First**

- Lazy load screens
- Memoizar componentes pesados
- Virtualizar listas largas
- Optimizar imágenes
- Usar useNativeDriver para animaciones

### **6. Security First**

- Tokens en SecureStore, NO AsyncStorage
- Validar inputs con Zod
- HTTPS only
- No hardcodear secrets
- Usar variables de entorno

---

## 🎯 Conclusión

**Prioridad #1:** Implementar autenticación completa (AuthService + Context)  
**Prioridad #2:** Crear capa de API con Axios interceptors  
**Prioridad #3:** Setup testing básico

Una vez completadas estas 3 prioridades, el proyecto tendrá:

- ✅ Autenticación segura y funcional
- ✅ Comunicación robusta con backend
- ✅ Base de tests para calidad
- ✅ Arquitectura escalable

**Siguiente sesión:** ¿Comenzamos con la implementación del AuthService?

---

**Elaborado por:** GitHub Copilot - Senior Architect  
**Fecha:** 9 de febrero, 2026  
**Versión:** 1.0
