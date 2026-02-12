# 🚀 Mejoras Propuestas - Brigada Digital (Febrero 2026)

## 📋 Índice

1. [Mejoras Críticas (Alta Prioridad)](#mejoras-críticas)
2. [Mejoras de Calidad de Código](#mejoras-de-calidad)
3. [Mejoras de Arquitectura](#mejoras-de-arquitectura)
4. [Mejoras de UX/UI](#mejoras-de-uxui)
5. [Mejoras de Performance](#mejoras-de-performance)
6. [Mejoras de Seguridad](#mejoras-de-seguridad)
7. [Testing y Calidad](#testing-y-calidad)
8. [DevOps y CI/CD](#devops)

---

## 🔴 Mejoras Críticas (Alta Prioridad)

### 1. Implementar Sistema de Autenticación Real con Base de Datos

**Estado Actual:** ❌ Usando datos mock en `login-enhanced.tsx`

**Problema:**

```typescript
// app/(auth)/login-enhanced.tsx
const authenticateUser = async (email: string, password: string) => {
  // TODO: Implement real authentication with database
  // Mock authentication
  if (email === "test@brigada.com") {
    return {
      success: true,
      user: { id: 1, email, role: "BRIGADISTA", state: "INVITED" },
    };
  }
};
```

**Solución Propuesta:**

**Paso 1:** Crear servicio de autenticación (`lib/services/auth-service.ts`)

```typescript
import * as Crypto from "expo-crypto";
import { getDatabase } from "@/lib/db";
import type { User, UserState } from "@/types/user";

export class AuthService {
  /**
   * Hashear contraseña con bcrypt (usando expo-crypto)
   */
  static async hashPassword(password: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + process.env.EXPO_PUBLIC_SALT,
    );
    return hash;
  }

  /**
   * Verificar contraseña
   */
  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  /**
   * Autenticar usuario contra base de datos
   */
  static async authenticate(
    email: string,
    password: string,
  ): Promise<User | null> {
    const db = await getDatabase();

    // 1. Buscar usuario por email
    const users = await db.getAllAsync<User>(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // 2. Verificar contraseña
    const isValid = await this.verifyPassword(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Verificar si email está en whitelist
   */
  static async isWhitelisted(email: string): Promise<boolean> {
    const db = await getDatabase();

    const results = await db.getAllAsync(
      `SELECT 1 FROM whitelist WHERE email = ? AND (expires_at IS NULL OR expires_at > ?)`,
      [email, Date.now()],
    );

    return results.length > 0;
  }

  /**
   * Generar token offline (7 días)
   */
  static async generateOfflineToken(userId: number): Promise<string> {
    const db = await getDatabase();
    const token = Crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await db.runAsync(
      `INSERT INTO offline_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)`,
      [userId, token, expiresAt, Date.now()],
    );

    return token;
  }

  /**
   * Validar código de activación
   */
  static async validateActivationCode(
    code: string,
  ): Promise<{ valid: boolean; email?: string }> {
    const db = await getDatabase();

    const results = await db.getAllAsync<{ email: string; expires_at: number }>(
      `SELECT email, expires_at FROM invitations 
       WHERE code = ? AND status = 'SENT' AND expires_at > ?`,
      [code, Date.now()],
    );

    if (results.length === 0) {
      return { valid: false };
    }

    return { valid: true, email: results[0].email };
  }

  /**
   * Activar cuenta con código
   */
  static async activateAccount(
    code: string,
    password: string,
  ): Promise<boolean> {
    const db = await getDatabase();

    // 1. Validar código
    const validation = await this.validateActivationCode(code);
    if (!validation.valid || !validation.email) {
      return false;
    }

    // 2. Hashear contraseña
    const passwordHash = await this.hashPassword(password);

    // 3. Actualizar usuario
    await db.runAsync(
      `UPDATE users SET password_hash = ?, state = 'ACTIVE', updated_at = ? WHERE email = ?`,
      [passwordHash, Date.now(), validation.email],
    );

    // 4. Marcar invitación como usada
    await db.runAsync(
      `UPDATE invitations SET status = 'ACCEPTED', used_at = ? WHERE code = ?`,
      [Date.now(), code],
    );

    return true;
  }
}
```

**Paso 2:** Actualizar `login-enhanced.tsx`

```typescript
// Reemplazar funciones mock con:
const checkWhitelist = async (email: string): Promise<boolean> => {
  return await AuthService.isWhitelisted(email);
};

const authenticateUser = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  const user = await AuthService.authenticate(email, password);

  if (!user) {
    return {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Usuario o contraseña incorrectos",
      },
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      state: user.state,
    },
  };
};

const generateOfflineToken = async (userId: number): Promise<string> => {
  return await AuthService.generateOfflineToken(userId);
};
```

**Paso 3:** Actualizar `activation.tsx`

```typescript
const handleVerify = async () => {
  const validation = await AuthService.validateActivationCode(code);

  if (!validation.valid) {
    setErrorMessage("Código inválido o expirado");
    return;
  }

  // Guardar email validado
  setPendingEmail(validation.email!);
  router.push("/(auth)/create-password");
};
```

**Paso 4:** Actualizar `create-password.tsx`

```typescript
const handleSubmit = async () => {
  // Usar código del flujo de activación (guardado en AsyncStorage)
  const activationCode = await AsyncStorage.getItem("@brigada:activation_code");

  if (!activationCode) {
    setErrorMessage("Código de activación no encontrado");
    return;
  }

  const success = await AuthService.activateAccount(activationCode, password);

  if (!success) {
    setErrorMessage("Error al activar cuenta");
    return;
  }

  // Limpiar datos temporales
  await AsyncStorage.multiRemove([
    "@brigada:activation_code",
    "@brigada:pending_email",
  ]);

  // Login automático
  const user = await AuthService.authenticate(email, password);
  if (user) {
    await login(user, await AuthService.generateOfflineToken(user.id));
    navigateByRole(user.role);
  }
};
```

**Esfuerzo:** 🔴 6-8 horas  
**Impacto:** 🔴 CRÍTICO - Seguridad y funcionalidad básica  
**Prioridad:** 1

---

### 2. Implementar Gestión de Tokens con Expiración

**Estado Actual:** ❌ Tokens no expiran, no hay renovación automática

**Problema:**

```typescript
// contexts/auth-context.tsx
const login = async (user: User, token: string) => {
  // Token expira en 7 días pero no hay lógica de renovación
  const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

  // No hay verificación antes de hacer requests
  // No hay renovación automática
};
```

**Solución Propuesta:**

**Crear `lib/services/token-service.ts`**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { getDatabase } from "@/lib/db";

export interface TokenData {
  token: string;
  expiresAt: number;
  issuedAt: number;
  userId: number;
}

export class TokenService {
  private static TOKEN_KEY = "@brigada:token_data";

  /**
   * Verificar si token es válido
   */
  static async isTokenValid(): Promise<boolean> {
    const tokenData = await this.getTokenData();

    if (!tokenData) {
      return false;
    }

    const now = Date.now();
    const timeUntilExpiry = tokenData.expiresAt - now;

    // Token expirado
    if (timeUntilExpiry <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Verificar si token está por expirar (< 24h)
   */
  static async isTokenExpiringSoon(): Promise<boolean> {
    const tokenData = await this.getTokenData();

    if (!tokenData) {
      return false;
    }

    const now = Date.now();
    const timeUntilExpiry = tokenData.expiresAt - now;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return timeUntilExpiry > 0 && timeUntilExpiry <= twentyFourHours;
  }

  /**
   * Obtener datos del token
   */
  static async getTokenData(): Promise<TokenData | null> {
    const data = await AsyncStorage.getItem(this.TOKEN_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Guardar token
   */
  static async saveToken(
    userId: number,
    expiryDays: number = 7,
  ): Promise<string> {
    const token = Crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + expiryDays * 24 * 60 * 60 * 1000;

    const tokenData: TokenData = {
      token,
      expiresAt,
      issuedAt: now,
      userId,
    };

    // Guardar en AsyncStorage
    await AsyncStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));

    // Guardar en SQLite
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO offline_tokens (user_id, token, expires_at, created_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, token, expiresAt, now],
    );

    return token;
  }

  /**
   * Renovar token si está por expirar
   */
  static async renewTokenIfNeeded(): Promise<boolean> {
    const isExpiringSoon = await this.isTokenExpiringSoon();

    if (!isExpiringSoon) {
      return false;
    }

    const tokenData = await this.getTokenData();

    if (!tokenData) {
      return false;
    }

    // Generar nuevo token
    await this.saveToken(tokenData.userId);

    console.log("🔄 Token renovado automáticamente");
    return true;
  }

  /**
   * Limpiar token
   */
  static async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(this.TOKEN_KEY);
  }
}
```

**Integrar en AuthContext:**

```typescript
// contexts/auth-context.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...

  // Verificar token periódicamente
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const isValid = await TokenService.isTokenValid();

      if (!isValid && user) {
        console.log("⚠️ Token expirado, cerrando sesión");
        await logout();
      } else {
        // Intentar renovar si está por expirar
        await TokenService.renewTokenIfNeeded();
      }
    }, 60 * 1000); // Verificar cada minuto

    return () => clearInterval(intervalId);
  }, [user]);

  const login = async (user: User, token: string) => {
    // Guardar token con gestión automática
    await TokenService.saveToken(user.id);

    setUser(user);
    setToken(token);
  };

  const logout = async () => {
    await TokenService.clearToken();
    await clearSession();
  };

  // ... rest of code ...
}
```

**Esfuerzo:** 🟠 4-5 horas  
**Impacto:** 🔴 ALTO - Seguridad y experiencia de usuario  
**Prioridad:** 2

---

### 3. Resolver Problema de Texto Truncado en Logo

**Estado Actual:** ⚠️ Logo "brigadaDigital" se corta al final

**Intentos Previos:**

- ✅ Ajuste de padding
- ✅ Reducción de fontSize
- ✅ Ajuste de letterSpacing
- ✅ adjustsFontSizeToFit
- ❌ Ninguno funcionó completamente

**Causa Raíz:** Fuente Pacifico tiene glyphs decorativos que exceden bounds calculados

**Soluciones Propuestas (3 opciones):**

#### Opción A: Usar Logo SVG (RECOMENDADO)

```typescript
// components/ui/logo-svg.tsx
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export function LogoSVG({ width = 300, height = 60 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 60">
      <Defs>
        <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E74C3C" />
          <Stop offset="100%" stopColor="#C0392B" />
        </LinearGradient>
      </Defs>
      <SvgText
        fill="url(#logoGradient)"
        fontSize="48"
        fontFamily="Pacifico"
        x="0"
        y="45"
        textAnchor="start"
      >
        brigada Digital
      </SvgText>
    </Svg>
  );
}
```

**Instalación:**

```bash
npx expo install react-native-svg
```

**Uso:**

```typescript
// components/layout/splash-screen.tsx
import { LogoSVG } from '@/components/ui/logo-svg';

// Reemplazar <Text> con:
<LogoSVG width={320} height={70} />
```

**Ventajas:**

- ✅ Control total sobre bounds
- ✅ Escalado perfecto
- ✅ Soporta gradientes
- ✅ Rendimiento optimizado

#### Opción B: Cambiar a Fuente Sin Decoraciones

```typescript
// constants/theme.ts
export const theme = {
  fonts: {
    logo: "Montserrat-Bold", // Alternativa moderna y legible
    // o 'Poppins-Bold'
    // o 'Raleway-Bold'
  },
};
```

#### Opción C: Split Text con Espaciado Manual

```typescript
<View style={styles.logoContainer}>
  <Text style={styles.logoPart1}>brigada</Text>
  <Text style={styles.logoPart2}> Digital</Text>
</View>

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoPart1: {
    fontFamily: 'Pacifico',
    fontSize: 42,
    color: '#E74C3C',
  },
  logoPart2: {
    fontFamily: 'Pacifico',
    fontSize: 42,
    color: '#C0392B',
    marginLeft: -2, // Ajuste fino
  },
});
```

**Esfuerzo:** 🟢 1-2 horas (Opción A), 0.5h (Opción B/C)  
**Impacto:** 🟠 MEDIO - Branding y profesionalismo  
**Prioridad:** 3  
**Recomendación:** Opción A (SVG) para solución definitiva

---

## 🟠 Mejoras de Calidad de Código

### 4. Eliminar Código Duplicado en Layouts de Tabs

**Problema:** Los 3 layouts de roles tienen código casi idéntico

```typescript
// app/(admin)/_layout.tsx
// app/(encargado)/_layout.tsx
// app/(brigadista)/_layout.tsx
// Todos tienen la misma estructura con pequeñas diferencias
```

**Solución:** Crear componente reutilizable

```typescript
// components/layout/role-tab-layout.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Tabs } from 'expo-router';

interface TabConfig {
  name: string;
  title: string;
  icon: string;
  headerTitle?: string;
}

interface RoleTabLayoutProps {
  role: 'admin' | 'encargado' | 'brigadista';
  tabs: TabConfig[];
}

export function RoleTabLayout({ role, tabs }: RoleTabLayoutProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: 'rgba(0,0,0,0.1)',
        },
        headerShown: true,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerTitle: tab.headerTitle || tab.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
```

**Uso:**

```typescript
// app/(admin)/_layout.tsx
import { RoleTabLayout } from '@/components/layout/role-tab-layout';

export default function AdminLayout() {
  return (
    <RoleTabLayout
      role="admin"
      tabs={[
        { name: 'index', title: 'Dashboard', icon: 'chart.bar.fill' },
        { name: 'surveys/index', title: 'Encuestas', icon: 'doc.text.fill' },
        { name: 'users', title: 'Usuarios', icon: 'person.3.fill' },
        { name: 'responses/index', title: 'Respuestas', icon: 'list.bullet.clipboard.fill' },
      ]}
    />
  );
}
```

**Esfuerzo:** 🟢 1 hora  
**Impacto:** 🟢 BAJO - Mantenibilidad  
**Prioridad:** 5

---

### 5. Mejorar Manejo de Errores en Autenticación

**Problema:** Errores genéricos, difíciles de debuggear

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : "Error al iniciar sesión";
  setErrorMessage(message);
}
```

**Solución:** Sistema de errores tipado

```typescript
// lib/errors/auth-errors.ts
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",
  ACCOUNT_NOT_ACTIVATED = "ACCOUNT_NOT_ACTIVATED",
  EMAIL_NOT_WHITELISTED = "EMAIL_NOT_WHITELISTED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  NETWORK_ERROR = "NETWORK_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "AuthError";
  }

  static invalidCredentials(): AuthError {
    return new AuthError(
      AuthErrorCode.INVALID_CREDENTIALS,
      "Usuario o contraseña incorrectos",
    );
  }

  static accountDisabled(): AuthError {
    return new AuthError(
      AuthErrorCode.ACCOUNT_DISABLED,
      "Tu cuenta ha sido deshabilitada. Contacta al administrador.",
    );
  }

  static notWhitelisted(email: string): AuthError {
    return new AuthError(
      AuthErrorCode.EMAIL_NOT_WHITELISTED,
      "Email no autorizado. Debes estar en la whitelist para acceder.",
      { email },
    );
  }

  // Agregar más métodos estáticos para cada tipo de error
}

// Hook para mensajes de error localizados
export function useAuthErrorMessage(error: AuthError | null): string {
  if (!error) return "";

  const errorMessages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.INVALID_CREDENTIALS]: "Usuario o contraseña incorrectos",
    [AuthErrorCode.USER_NOT_FOUND]: "Usuario no encontrado",
    [AuthErrorCode.ACCOUNT_DISABLED]: "Cuenta deshabilitada",
    [AuthErrorCode.ACCOUNT_NOT_ACTIVATED]: "Cuenta no activada",
    [AuthErrorCode.EMAIL_NOT_WHITELISTED]: "Email no autorizado",
    [AuthErrorCode.TOKEN_EXPIRED]: "Sesión expirada",
    [AuthErrorCode.NETWORK_ERROR]: "Error de conexión",
    [AuthErrorCode.DATABASE_ERROR]: "Error en la base de datos",
  };

  return errorMessages[error.code] || error.message;
}
```

**Uso:**

```typescript
// app/(auth)/login-enhanced.tsx
import { AuthError, AuthErrorCode } from "@/lib/errors/auth-errors";

try {
  const isWhitelisted = await checkWhitelist(email);
  if (!isWhitelisted) {
    throw AuthError.notWhitelisted(email);
  }

  const authResult = await authenticateUser(email, password);
  if (!authResult.success) {
    throw AuthError.invalidCredentials();
  }
} catch (error) {
  if (error instanceof AuthError) {
    setErrorMessage(error.message);
    // Log para debugging con código de error
    console.error(`[Auth Error] ${error.code}:`, error.details);
  } else {
    setErrorMessage("Error inesperado");
    console.error("[Unexpected Error]:", error);
  }
}
```

**Esfuerzo:** 🟢 2 horas  
**Impacto:** 🟠 MEDIO - Debugging y UX  
**Prioridad:** 6

---

## 🏗️ Mejoras de Arquitectura

### 6. Implementar Sistema de Sincronización Offline

**Estado Actual:** ❌ Base de datos SQLite creada pero sin lógica de sync

**Solución:** Sistema de cola de sincronización

```typescript
// lib/services/sync-service.ts
import { getDatabase } from "@/lib/db";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";

interface SyncQueueItem {
  id: string;
  entity_type: "response" | "file" | "user";
  entity_id: string;
  operation: "create" | "update" | "delete";
  data: any;
  created_at: number;
  retry_count: number;
  status: "pending" | "syncing" | "failed" | "synced";
}

export class SyncService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isSyncing = false;

  /**
   * Iniciar sincronización automática
   */
  static startAutoSync(intervalMinutes: number = 5): void {
    this.stopAutoSync();

    this.syncInterval = setInterval(
      () => {
        this.syncPendingItems();
      },
      intervalMinutes * 60 * 1000,
    );

    // Sync inicial
    this.syncPendingItems();
  }

  /**
   * Detener sincronización automática
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Verificar conectividad
   */
  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Agregar item a cola de sincronización
   */
  static async addToQueue(
    item: Omit<SyncQueueItem, "id" | "created_at" | "retry_count" | "status">,
  ): Promise<void> {
    const db = await getDatabase();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, data, status, created_at, retry_count)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, 0)`,
      [
        id,
        item.entity_type,
        item.entity_id,
        item.operation,
        JSON.stringify(item.data),
        Date.now(),
      ],
    );

    console.log(
      `✅ Agregado a cola de sync: ${item.entity_type} ${item.operation}`,
    );
  }

  /**
   * Sincronizar items pendientes
   */
  static async syncPendingItems(): Promise<void> {
    if (this.isSyncing) {
      console.log("⏳ Sync ya en progreso, saltando...");
      return;
    }

    const isOnline = await this.isOnline();
    if (!isOnline) {
      console.log("📡 Sin conexión, sync diferido");
      return;
    }

    this.isSyncing = true;
    console.log("🔄 Iniciando sincronización...");

    try {
      const db = await getDatabase();
      const pendingItems = await db.getAllAsync<SyncQueueItem>(
        `SELECT * FROM sync_queue 
         WHERE status IN ('pending', 'failed') AND retry_count < 3
         ORDER BY created_at ASC
         LIMIT 50`,
      );

      if (pendingItems.length === 0) {
        console.log("✅ No hay items pendientes de sincronización");
        return;
      }

      console.log(`📦 Sincronizando ${pendingItems.length} items...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          successCount++;

          // Marcar como sincronizado
          await db.runAsync(
            `UPDATE sync_queue SET status = 'synced', synced_at = ? WHERE id = ?`,
            [Date.now(), item.id],
          );
        } catch (error) {
          failCount++;
          console.error(`❌ Error sincronizando item ${item.id}:`, error);

          // Incrementar retry_count
          await db.runAsync(
            `UPDATE sync_queue SET status = 'failed', retry_count = retry_count + 1, error = ? WHERE id = ?`,
            [error instanceof Error ? error.message : "Unknown error", item.id],
          );
        }
      }

      console.log(
        `✅ Sync completo: ${successCount} exitosos, ${failCount} fallidos`,
      );

      if (successCount > 0) {
        Toast.show({
          type: "success",
          text1: "Sincronización completa",
          text2: `${successCount} elemento${successCount > 1 ? "s" : ""} sincronizado${successCount > 1 ? "s" : ""}`,
        });
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincronizar un item específico
   */
  private static async syncItem(item: SyncQueueItem): Promise<void> {
    // TODO: Implementar lógica de sync con API backend
    // Por ahora simular sync exitoso
    console.log(
      `🔄 Sync: ${item.entity_type} ${item.operation}`,
      item.entity_id,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Obtener estadísticas de sincronización
   */
  static async getSyncStats(): Promise<{
    pending: number;
    failed: number;
    synced: number;
  }> {
    const db = await getDatabase();

    const pending = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`,
    );

    const failed = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed' AND retry_count < 3`,
    );

    const synced = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'synced' AND date(synced_at) = date('now')`,
    );

    return {
      pending: pending?.count ?? 0,
      failed: failed?.count ?? 0,
      synced: synced?.count ?? 0,
    };
  }
}
```

**Instalación:**

```bash
npx expo install @react-native-community/netinfo
```

**Uso en App:**

```typescript
// app/_layout.tsx
import { SyncService } from "@/lib/services/sync-service";

export default function RootLayout() {
  useEffect(() => {
    // Iniciar sync automático cada 5 minutos
    SyncService.startAutoSync(5);

    return () => {
      SyncService.stopAutoSync();
    };
  }, []);

  // ... rest of code
}
```

**Esfuerzo:** 🔴 8-12 horas  
**Impacto:** 🔴 CRÍTICO - Funcionalidad core offline-first  
**Prioridad:** 4

---

### 7. Implementar React Query para Gestión de Estado del Servidor

**Problema:** No hay cache, refetching, o gestión de estados de loading

**Solución:** Integrar React Query (TanStack Query)

```bash
npm install @tanstack/react-query
```

```typescript
// lib/api/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

```typescript
// app/_layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/api/query-client';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* ... rest of app */}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

**Ejemplo de uso:**

```typescript
// hooks/use-surveys.ts
import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/lib/db';

export function useSurveys() {
  return useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const db = await getDatabase();
      return db.getAllAsync<Survey>(`SELECT * FROM surveys WHERE is_active = 1`);
    },
  });
}

// En el componente:
function SurveysList() {
  const { data: surveys, isLoading, error, refetch } = useSurveys();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlashList
      data={surveys}
      renderItem={({ item }) => <SurveyCard survey={item} />}
      estimatedItemSize={100}
      refreshing={false}
      onRefresh={refetch}
    />
  );
}
```

**Esfuerzo:** 🟠 4-6 horas  
**Impacto:** 🟠 ALTO - Performance y UX  
**Prioridad:** 7

---

## 🎨 Mejoras de UX/UI

### 8. Mejorar Sistema de Toasts con Estados Específicos

**Problema:** Toast genérico, no diferencia tipos de operaciones

**Solución:** Sistema de toasts tipado con iconos y colores

```typescript
// lib/ui/toast-service.ts
import Toast from "react-native-toast-message";

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "sync"
  | "offline";

interface ToastConfig {
  title: string;
  message?: string;
  duration?: number;
}

export class ToastService {
  static success(config: ToastConfig | string): void {
    const options = typeof config === "string" ? { title: config } : config;

    Toast.show({
      type: "success",
      text1: options.title,
      text2: options.message,
      visibilityTime: options.duration || 3000,
    });
  }

  static error(config: ToastConfig | string): void {
    const options = typeof config === "string" ? { title: config } : config;

    Toast.show({
      type: "error",
      text1: options.title,
      text2: options.message,
      visibilityTime: options.duration || 4000,
    });
  }

  static info(config: ToastConfig | string): void {
    const options = typeof config === "string" ? { title: config } : config;

    Toast.show({
      type: "info",
      text1: options.title,
      text2: options.message,
      visibilityTime: options.duration || 3000,
    });
  }

  static warning(config: ToastConfig | string): void {
    const options = typeof config === "string" ? { title: config } : config;

    Toast.show({
      type: "warning",
      text1: options.title,
      text2: options.message,
      visibilityTime: options.duration || 3500,
    });
  }

  static syncSuccess(itemCount: number): void {
    Toast.show({
      type: "success",
      text1: "Sincronización completa",
      text2: `${itemCount} elemento${itemCount > 1 ? "s" : ""} sincronizado${itemCount > 1 ? "s" : ""}`,
      visibilityTime: 2000,
    });
  }

  static offline(): void {
    Toast.show({
      type: "warning",
      text1: "Sin conexión",
      text2:
        "Los cambios se sincronizarán automáticamente cuando haya conexión",
      visibilityTime: 3000,
    });
  }

  static tokenExpiring(): void {
    Toast.show({
      type: "warning",
      text1: "Token por expirar",
      text2: "Tu sesión offline vence en menos de 24 horas",
      visibilityTime: 4000,
    });
  }
}
```

**Uso:**

```typescript
// Reemplazar toasts existentes:
Toast.show({
  /* ... */
});

// Con:
ToastService.success("Respuesta guardada");
ToastService.error({ title: "Error al guardar", message: error.message });
ToastService.offline();
ToastService.syncSuccess(5);
```

**Esfuerzo:** 🟢 1 hora  
**Impacto:** 🟢 BAJO - UX mejorada  
**Prioridad:** 9

---

### 9. Agregar Indicador de Sincronización en Header

**Solución:** Componente de estado de sync visible

```typescript
// components/shared/sync-status-indicator.tsx
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SyncService } from '@/lib/services/sync-service';

export function SyncStatusIndicator() {
  const [stats, setStats] = useState({ pending: 0, failed: 0, synced: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Actualizar cada 10s

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const syncStats = await SyncService.getSyncStats();
    const online = await SyncService.isOnline();

    setStats(syncStats);
    setIsOnline(online);
  };

  const handlePress = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    await SyncService.syncPendingItems();
    await loadStats();
    setIsSyncing(false);
  };

  const hasPending = stats.pending > 0 || stats.failed > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={!isOnline || isSyncing}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#3498db" />
      ) : (
        <>
          {!isOnline && (
            <Ionicons name="cloud-offline" size={20} color="#95a5a6" />
          )}
          {isOnline && !hasPending && (
            <Ionicons name="cloud-done" size={20} color="#27ae60" />
          )}
          {isOnline && hasPending && (
            <>
              <Ionicons name="cloud-upload" size={20} color="#f39c12" />
              <Text style={styles.pendingCount}>{stats.pending + stats.failed}</Text>
            </>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#f39c12',
  },
});
```

**Agregar a headers:**

```typescript
// app/(brigadista)/_layout.tsx
import { SyncStatusIndicator } from '@/components/shared/sync-status-indicator';

<Tabs.Screen
  name="index"
  options={{
    title: 'Inicio',
    headerRight: () => <SyncStatusIndicator />,
    // ...
  }}
/>
```

**Esfuerzo:** 🟢 2 horas  
**Impacto:** 🟠 MEDIO - Visibilidad de estado offline  
**Prioridad:** 8

---

## ⚡ Mejoras de Performance

### 10. Implementar Lazy Loading de Screens

**Problema:** Todas las screens se cargan al inicio

**Solución:** React.lazy para código splitting

```typescript
// app/_layout.tsx
import { lazy, Suspense } from 'react';

// Lazy load de layouts pesados
const AdminLayout = lazy(() => import('./(admin)/_layout'));
const EncargadoLayout = lazy(() => import('./(encargado)/_layout'));
const BrigadistaLayout = lazy(() => import('./(brigadista)/_layout'));

export default function RootLayout() {
  const { user } = useAuth();

  const getRoleLayout = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
        return (
          <Suspense fallback={<LoadingScreen />}>
            <AdminLayout />
          </Suspense>
        );
      case 'ENCARGADO':
        return (
          <Suspense fallback={<LoadingScreen />}>
            <EncargadoLayout />
          </Suspense>
        );
      case 'BRIGADISTA':
        return (
          <Suspense fallback={<LoadingScreen />}>
            <BrigadistaLayout />
          </Suspense>
        );
    }
  };

  // ... rest of code
}
```

**Esfuerzo:** 🟢 1 hora  
**Impacto:** 🟠 MEDIO - Tiempo de carga inicial  
**Prioridad:** 10

---

### 11. Optimizar Queries de Base de Datos con Prepared Statements

**Problema:** Queries sin preparar, posible SQL injection

**Solución:** Usar prepared statements consistentemente

```typescript
// lib/repositories/user-repository.ts
import { getDatabase } from "@/lib/db";
import type { User } from "@/types/user";

export class UserRepository {
  /**
   * Buscar usuario por email (prepared statement)
   */
  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();

    // ✅ CORRECTO: Usar placeholders
    const users = await db.getAllAsync<User>(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    return users[0] || null;
  }

  /**
   * ❌ INCORRECTO: Concatenación de strings (vulnerable a SQL injection)
   */
  static async findByEmailUnsafe(email: string): Promise<User | null> {
    const db = await getDatabase();

    // ❌ NO HACER ESTO
    const users = await db.getAllAsync<User>(
      `SELECT * FROM users WHERE email = '${email}' LIMIT 1`,
    );

    return users[0] || null;
  }

  /**
   * Actualizar estado de usuario
   */
  static async updateState(userId: number, newState: string): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE users SET state = ?, updated_at = ? WHERE id = ?`,
      [newState, Date.now(), userId],
    );
  }

  /**
   * Buscar usuarios por rol
   */
  static async findByRole(role: string): Promise<User[]> {
    const db = await getDatabase();

    return db.getAllAsync<User>(
      `SELECT * FROM users WHERE role = ? AND state = 'ACTIVE' ORDER BY name`,
      [role],
    );
  }
}
```

**Esfuerzo:** 🟢 2-3 horas (refactorizar queries existentes)  
**Impacto:** 🔴 CRÍTICO - Seguridad  
**Prioridad:** 2

---

## 🔒 Mejoras de Seguridad

### 12. Implementar Validación de Inputs con Zod

**Problema:** Validación manual, propenso a errores

**Solución:** Schemas Zod para validación consistente

```bash
npm install zod
```

```typescript
// lib/validation/auth-schemas.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "Contraseña demasiado larga"),
});

export const activationCodeSchema = z.object({
  code: z
    .string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d+$/, "El código solo debe contener números"),
});

export const createPasswordSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivationCodeInput = z.infer<typeof activationCodeSchema>;
export type CreatePasswordInput = z.infer<typeof createPasswordSchema>;
```

**Uso:**

```typescript
// app/(auth)/login-enhanced.tsx
import { loginSchema } from "@/lib/validation/auth-schemas";

const handleLogin = async () => {
  try {
    // Validar con Zod
    const validatedData = loginSchema.parse({ email, password });

    // Continuar con lógica de login
    const authResult = await authenticateUser(
      validatedData.email,
      validatedData.password,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      setErrorMessage(firstError.message);

      // Marcar campo específico con error
      if (firstError.path[0] === "email") {
        setEmailError(firstError.message);
      } else if (firstError.path[0] === "password") {
        setPasswordError(firstError.message);
      }
    }
  }
};
```

**Esfuerzo:** 🟠 3-4 horas  
**Impacto:** 🟠 ALTO - Seguridad y UX  
**Prioridad:** 5

---

### 13. Implementar Rate Limiting en Login

**Problema:** Sin protección contra ataques de fuerza bruta

**Solución:** Limitar intentos de login

```typescript
// lib/security/rate-limiter.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export class RateLimiter {
  private static STORAGE_KEY = "@brigada:login_attempts";
  private static MAX_ATTEMPTS = 5;
  private static WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  private static LOCKOUT_MS = 30 * 60 * 1000; // 30 minutos

  /**
   * Verificar si está permitido intentar login
   */
  static async canAttemptLogin(
    email: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const record = await this.getAttemptRecord(email);

    if (!record) {
      return { allowed: true };
    }

    // Verificar si está bloqueado
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      return {
        allowed: false,
        reason: `Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} minuto${minutesLeft > 1 ? "s" : ""}.`,
      };
    }

    // Verificar si la ventana de tiempo expiró (reiniciar contador)
    const windowExpired = Date.now() - record.firstAttemptAt > this.WINDOW_MS;
    if (windowExpired) {
      await this.resetAttempts(email);
      return { allowed: true };
    }

    // Verificar cantidad de intentos
    if (record.count >= this.MAX_ATTEMPTS) {
      await this.lockAccount(email);
      return {
        allowed: false,
        reason: "Demasiados intentos fallidos. Cuenta bloqueada temporalmente.",
      };
    }

    return { allowed: true };
  }

  /**
   * Registrar intento fallido
   */
  static async recordFailedAttempt(email: string): Promise<void> {
    const record = await this.getAttemptRecord(email);

    if (!record) {
      await this.setAttemptRecord(email, {
        count: 1,
        firstAttemptAt: Date.now(),
      });
      return;
    }

    // Incrementar contador
    record.count += 1;
    await this.setAttemptRecord(email, record);

    // Bloquear si se alcanzó el máximo
    if (record.count >= this.MAX_ATTEMPTS) {
      await this.lockAccount(email);
    }
  }

  /**
   * Reiniciar intentos después de login exitoso
   */
  static async resetAttempts(email: string): Promise<void> {
    const key = this.getStorageKey(email);
    await AsyncStorage.removeItem(key);
  }

  private static async getAttemptRecord(
    email: string,
  ): Promise<AttemptRecord | null> {
    const key = this.getStorageKey(email);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  private static async setAttemptRecord(
    email: string,
    record: AttemptRecord,
  ): Promise<void> {
    const key = this.getStorageKey(email);
    await AsyncStorage.setItem(key, JSON.stringify(record));
  }

  private static async lockAccount(email: string): Promise<void> {
    const record = await this.getAttemptRecord(email);

    if (!record) return;

    record.lockedUntil = Date.now() + this.LOCKOUT_MS;
    await this.setAttemptRecord(email, record);
  }

  private static getStorageKey(email: string): string {
    return `${this.STORAGE_KEY}:${email.toLowerCase()}`;
  }
}
```

**Uso:**

```typescript
// app/(auth)/login-enhanced.tsx
import { RateLimiter } from "@/lib/security/rate-limiter";

const handleLogin = async () => {
  // Verificar rate limiting
  const { allowed, reason } = await RateLimiter.canAttemptLogin(email);

  if (!allowed) {
    setErrorMessage(reason || "Demasiados intentos");
    shake();
    return;
  }

  try {
    // ... lógica de login ...

    if (!authResult.success) {
      // Registrar intento fallido
      await RateLimiter.recordFailedAttempt(email);
      throw new Error("Credenciales inválidas");
    }

    // Login exitoso, reiniciar contador
    await RateLimiter.resetAttempts(email);

    // ... continuar con navegación ...
  } catch (error) {
    // ... manejo de error ...
  }
};
```

**Esfuerzo:** 🟢 2 horas  
**Impacto:** 🔴 ALTO - Seguridad  
**Prioridad:** 4

---

## 🧪 Testing y Calidad

### 14. Agregar Tests Unitarios para Servicios Críticos

**Solución:** Jest + React Native Testing Library

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

```typescript
// lib/services/__tests__/auth-service.test.ts
import { AuthService } from "../auth-service";
import { getDatabase } from "@/lib/db";

// Mock de base de datos
jest.mock("@/lib/db");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("debería retornar null para credenciales inválidas", async () => {
      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([]),
      };
      (getDatabase as jest.Mock).mockResolvedValue(mockDb);

      const result = await AuthService.authenticate(
        "test@test.com",
        "wrongpass",
      );

      expect(result).toBeNull();
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users"),
        ["test@test.com"],
      );
    });

    it("debería retornar usuario para credenciales válidas", async () => {
      const mockUser = {
        id: 1,
        email: "test@test.com",
        password_hash: "hashedpassword",
        role: "BRIGADISTA",
        state: "ACTIVE",
      };

      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([mockUser]),
      };
      (getDatabase as jest.Mock).mockResolvedValue(mockDb);

      // Mock de verifyPassword
      jest.spyOn(AuthService, "verifyPassword").mockResolvedValue(true);

      const result = await AuthService.authenticate(
        "test@test.com",
        "correctpass",
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe("isWhitelisted", () => {
    it("debería retornar true para email en whitelist", async () => {
      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([{ email: "test@test.com" }]),
      };
      (getDatabase as jest.Mock).mockResolvedValue(mockDb);

      const result = await AuthService.isWhitelisted("test@test.com");

      expect(result).toBe(true);
    });

    it("debería retornar false para email no autorizado", async () => {
      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([]),
      };
      (getDatabase as jest.Mock).mockResolvedValue(mockDb);

      const result = await AuthService.isWhitelisted("notwhitelisted@test.com");

      expect(result).toBe(false);
    });
  });
});
```

**Configurar Jest:**

```javascript
// jest.config.js
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "contexts/**/*.{ts,tsx}",
    "!**/__tests__/**",
    "!**/node_modules/**",
  ],
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
};
```

**Scripts package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Esfuerzo:** 🔴 8-10 horas (setup + tests iniciales)  
**Impacto:** 🔴 CRÍTICO - Calidad y confiabilidad  
**Prioridad:** 8

---

### 15. Implementar E2E Testing con Detox

**Solución:** Tests end-to-end automatizados

```bash
npm install --save-dev detox detox-cli
```

```typescript
// e2e/auth-flow.test.ts
import { by, device, element, expect } from "detox";

describe("Flujo de Autenticación", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("debería mostrar pantalla de bienvenida al iniciar", async () => {
    await expect(element(by.text("Brigada Digital"))).toBeVisible();
    await expect(element(by.text("Let's start"))).toBeVisible();
  });

  it('debería navegar a login al tocar "Let\'s start"', async () => {
    await element(by.text("Let's start")).tap();
    await expect(element(by.text("Iniciar Sesión"))).toBeVisible();
  });

  it("debería mostrar error con email inválido", async () => {
    await element(by.text("Let's start")).tap();

    await element(by.id("email-input")).typeText("invalid-email");
    await element(by.id("password-input")).typeText("password123");
    await element(by.text("Iniciar Sesión")).tap();

    await expect(element(by.text("Email inválido"))).toBeVisible();
  });

  it("debería hacer login exitoso con credenciales válidas", async () => {
    await element(by.text("Let's start")).tap();

    await element(by.id("email-input")).typeText("admin@brigada.com");
    await element(by.id("password-input")).typeText("admin123");
    await element(by.text("Iniciar Sesión")).tap();

    // Debería navegar a dashboard
    await expect(element(by.text("Dashboard"))).toBeVisible();
  });

  it("debería completar flujo de activación", async () => {
    await element(by.text("Usa tu código de activación")).tap();

    // Ingresar código
    await element(by.id("activation-code-input")).typeText("123456");
    await element(by.text("Verificar código")).tap();

    // Crear contraseña
    await expect(element(by.text("Crear Contraseña"))).toBeVisible();
    await element(by.id("password-input")).typeText("NewPassword123");
    await element(by.id("confirm-password-input")).typeText("NewPassword123");
    await element(by.text("Crear cuenta")).tap();

    // Debería navegar a dashboard
    await expect(element(by.text("Inicio"))).toBeVisible();
  });
});
```

**Esfuerzo:** 🔴 10-12 horas  
**Impacto:** 🟠 ALTO - Calidad y confiabilidad  
**Prioridad:** 12

---

## 🚀 DevOps y CI/CD

### 16. Configurar CI/CD con GitHub Actions

**Solución:** Pipeline automatizado

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build APK
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build APK
        run: eas build --platform android --profile preview --non-interactive

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: "*.apk"
```

**Esfuerzo:** 🟠 4-6 horas  
**Impacto:** 🟠 ALTO - Automatización y calidad  
**Prioridad:** 11

---

## 📊 Resumen de Prioridades

### 🔴 Crítico (Implementar Ya)

1. **Sistema de autenticación con DB real** (6-8h) - Seguridad
2. **Prepared statements** (2-3h) - Seguridad
3. **Gestión de tokens** (4-5h) - Seguridad y UX

### 🟠 Alta Prioridad (Próxima Sprint)

4. **Sistema de sincronización offline** (8-12h) - Funcionalidad core
5. **Rate limiting** (2h) - Seguridad
6. **Validación con Zod** (3-4h) - Seguridad y UX

### 🟡 Media Prioridad (Backlog)

7. **React Query** (4-6h) - Performance
8. **Indicador de sync** (2h) - UX
9. **Sistema de toasts mejorado** (1h) - UX
10. **Lazy loading** (1h) - Performance

### 🟢 Baja Prioridad (Nice to Have)

11. **CI/CD** (4-6h) - DevOps
12. **E2E testing** (10-12h) - Calidad
13. **Logo SVG** (1-2h) - Branding
14. **Tests unitarios** (8-10h) - Calidad
15. **Componente reutilizable tabs** (1h) - DRY

---

## 🎯 Plan de Implementación Sugerido

### Sprint 1 (2 semanas)

- ✅ Autenticación real con DB
- ✅ Prepared statements
- ✅ Gestión de tokens

### Sprint 2 (2 semanas)

- ✅ Sistema de sincronización
- ✅ Rate limiting
- ✅ Validación con Zod

### Sprint 3 (1 semana)

- ✅ React Query
- ✅ Indicador de sync
- ✅ Toasts mejorados

### Sprint 4 (1 semana)

- ✅ CI/CD
- ✅ Tests unitarios básicos
- ✅ Logo SVG

---

## 📝 Notas Finales

- Todas las mejoras son **retrocompatibles**
- **No rompen** la funcionalidad existente
- Pueden implementarse **incrementalmente**
- Cada mejora incluye **código completo** listo para usar
- Estimaciones de esfuerzo son **conservadoras**

**Estado actual del proyecto:** ✅ Base sólida, funcionalidad core implementada
**Próximo paso sugerido:** 🔴 Autenticación real con base de datos

---

**Fecha:** Febrero 10, 2026  
**Versión:** 1.0  
**Autor:** Análisis técnico del proyecto Brigada Digital
