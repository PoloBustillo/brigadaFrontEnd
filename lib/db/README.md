# 🗄️ Base de Datos SQLite - Brigada Digital

Sistema de base de datos local offline-first para gestión de usuarios y autenticación.

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Inicialización](#inicialización)
- [Esquema de Base de Datos](#esquema-de-base-de-datos)
- [Uso Básico](#uso-básico)
- [API Reference](#api-reference)
- [Migraciones](#migraciones)
- [Testing](#testing)

---

## 🚀 Instalación

Las dependencias necesarias ya están instaladas:

```bash
npx expo install expo-sqlite
```

## 🎬 Inicialización

Inicializa la base de datos al arrancar la aplicación:

```typescript
import { initializeDatabase } from "@/lib/db";

// En tu App.tsx o _layout.tsx
useEffect(() => {
  async function setupDatabase() {
    try {
      await initializeDatabase();
      console.log("✅ Base de datos lista");
    } catch (error) {
      console.error("❌ Error inicializando BD:", error);
    }
  }

  setupDatabase();
}, []);
```

---

## 📊 Esquema de Base de Datos

### 1. Tabla: `users`

Almacena usuarios del sistema con roles y estados.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  email TEXT UNIQUE NOT NULL,       -- Email único
  password_hash TEXT NOT NULL,      -- Hash bcrypt
  full_name TEXT NOT NULL,          -- Nombre completo
  phone TEXT,                       -- Teléfono opcional
  role TEXT NOT NULL,               -- ADMIN | ENCARGADO | BRIGADISTA
  state TEXT NOT NULL,              -- INVITED | PENDING | ACTIVE | DISABLED
  created_at TEXT NOT NULL,         -- ISO 8601
  updated_at TEXT NOT NULL,         -- ISO 8601 (auto-update)
  last_login_at TEXT,               -- ISO 8601
  created_by TEXT,                  -- UUID del creador
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Roles:**

- `ADMIN`: Acceso completo, puede crear usuarios
- `ENCARGADO`: Supervisor, gestiona brigadistas
- `BRIGADISTA`: Usuario base, captura encuestas

**Estados:**

- `INVITED`: Código generado, no activado
- `PENDING`: Código activado, registro incompleto
- `ACTIVE`: Usuario activo
- `DISABLED`: Usuario deshabilitado

---

### 2. Tabla: `invitations`

Códigos de activación con expiración de 7 días.

```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,              -- UUID
  code TEXT UNIQUE NOT NULL,        -- Código de 8 caracteres
  email TEXT NOT NULL,              -- Email del invitado
  role TEXT NOT NULL,               -- Rol asignado
  status TEXT NOT NULL,             -- PENDING | ACTIVATED | EXPIRED | REVOKED
  created_at TEXT NOT NULL,         -- ISO 8601
  expires_at TEXT NOT NULL,         -- ISO 8601 (created_at + 7 días)
  activated_at TEXT,                -- ISO 8601
  activated_by TEXT,                -- UUID del usuario
  created_by TEXT NOT NULL,         -- UUID del admin
  FOREIGN KEY (activated_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Generación de código:**

```typescript
function generateActivationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
```

---

### 3. Tabla: `whitelist`

Lista de usuarios autorizados sincronizada del servidor.

```sql
CREATE TABLE whitelist (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT UNIQUE NOT NULL,     -- UUID del usuario
  email TEXT NOT NULL,              -- Email del usuario
  role TEXT NOT NULL,               -- Rol actual
  is_active INTEGER NOT NULL,       -- 1 = activo, 0 = inactivo
  last_sync_at TEXT NOT NULL,       -- ISO 8601
  synced_at TEXT NOT NULL,          -- ISO 8601
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Uso:** Permite login offline verificando contra whitelist local.

---

### 4. Tabla: `audit_logs`

Registro de auditoría de acciones del sistema.

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT,                     -- UUID (null para eventos sistema)
  action TEXT NOT NULL,             -- LOGIN | LOGOUT | USER_CREATED | etc.
  resource TEXT,                    -- Recurso afectado (ej: "user:uuid")
  details TEXT,                     -- JSON con detalles adicionales
  ip_address TEXT,                  -- Dirección IP
  user_agent TEXT,                  -- User agent
  created_at TEXT NOT NULL,         -- ISO 8601
  synced_to_server INTEGER NOT NULL -- 0 = no sincronizado, 1 = sincronizado
);
```

**Acciones comunes:**

- `LOGIN` / `LOGOUT`
- `USER_CREATED` / `USER_UPDATED` / `USER_DISABLED`
- `INVITATION_SENT` / `INVITATION_ACTIVATED`
- `WHITELIST_SYNCED`

---

## 💻 Uso Básico

### Obtener instancia de BD

```typescript
import { getDatabase } from "@/lib/db";

const db = await getDatabase();
```

### Consultar usuarios

```typescript
const users = await db.getAllAsync<User>(
  `SELECT * FROM users WHERE state = ? ORDER BY created_at DESC`,
  ["ACTIVE"],
);
```

### Insertar usuario

```typescript
import { v4 as uuidv4 } from "uuid";

const userId = uuidv4();
await db.runAsync(
  `INSERT INTO users (id, email, password_hash, full_name, role, state) 
   VALUES (?, ?, ?, ?, ?, ?)`,
  [userId, email, passwordHash, fullName, "BRIGADISTA", "PENDING"],
);
```

### Verificar código de activación

```typescript
const invitation = await db.getFirstAsync<Invitation>(
  `SELECT * FROM invitations 
   WHERE code = ? AND status = 'PENDING' AND datetime(expires_at) > datetime('now')`,
  [code],
);

if (invitation) {
  // Código válido
}
```

---

## 🔧 API Reference

### `initializeDatabase()`

Inicializa la base de datos, crea tablas y ejecuta migraciones.

```typescript
await initializeDatabase();
```

### `getDatabase()`

Obtiene la instancia singleton de SQLite.

```typescript
const db = await getDatabase();
```

### `getDatabaseStats()`

Obtiene estadísticas de la base de datos.

```typescript
const stats = await getDatabaseStats();
// {
//   totalUsers: 5,
//   activeUsers: 4,
//   pendingInvitations: 2,
//   whitelistEntries: 4,
//   unsyncedLogs: 12
// }
```

### `closeDatabase()`

Cierra la conexión (útil para testing).

```typescript
await closeDatabase();
```

### `resetDatabase()` ⚠️

Elimina completamente la BD. **Solo en desarrollo**.

```typescript
if (__DEV__) {
  await resetDatabase();
}
```

---

## 🔄 Migraciones

El sistema de migraciones es automático y basado en versiones.

### Estructura

```typescript
export const CURRENT_DB_VERSION = 1;

async function runMigrations(db, fromVersion) {
  if (fromVersion < 1) {
    // Migración 0 -> 1: Crear tablas iniciales
  }
  if (fromVersion < 2) {
    // Migración 1 -> 2: Agregar nueva columna
  }
  // ...
}
```

### Agregar una nueva migración

1. **Incrementa la versión:**

```typescript
export const CURRENT_DB_VERSION = 2; // Era 1
```

2. **Agrega el bloque de migración:**

```typescript
if (fromVersion < 2) {
  console.log("📦 Migración v2: Agregar columna avatar");
  await db.execAsync(`
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  `);
}
```

3. **La migración se ejecutará automáticamente** en el próximo inicio.

---

## 🧪 Testing

### Ejecutar test de inicialización

```typescript
import { testDatabaseInitialization } from "@/lib/db/test-db";

await testDatabaseInitialization();
```

### Resultado esperado:

```
🧪 Iniciando test de base de datos...

1️⃣ Inicializando base de datos...
🚀 Inicializando base de datos...
📊 Versión actual de BD: 0
🔄 Ejecutando migraciones desde versión 0 a 1
📦 Creando tablas de autenticación...
✅ Tablas de autenticación creadas
✅ Migraciones completadas. Versión actual: 1
✅ Base de datos inicializada correctamente

2️⃣ Obteniendo estadísticas...
📊 Estadísticas: {
  "totalUsers": 1,
  "activeUsers": 1,
  "pendingInvitations": 0,
  "whitelistEntries": 0,
  "unsyncedLogs": 0
}

3️⃣ Verificando admin por defecto...
✅ Admin encontrado: {
  "id": "00000000-0000-0000-0000-000000000001",
  "email": "admin@brigada.digital",
  "full_name": "Administrador Sistema",
  "role": "ADMIN",
  "state": "ACTIVE"
}

4️⃣ Verificando tablas...
📋 Tablas creadas: audit_logs, invitations, users, whitelist

5️⃣ Verificando índices...
🔍 Índices creados: idx_audit_logs_action, idx_audit_logs_created_at, ...

✅ ¡Test completado exitosamente!
```

---

## 🔒 Datos de Prueba

### Admin por defecto

**Email:** `admin@brigada.digital`  
**Password:** `admin123`  
**Rol:** `ADMIN`

⚠️ **IMPORTANTE:** Cambiar esta contraseña en producción.

---

## 📚 Próximos Pasos

Después de configurar la base de datos, continúa con:

1. **AuthService** - Servicio de autenticación con JWT
2. **AuthContext** - Context global de autenticación
3. **Pantallas de Login/Activación** - UI de autenticación
4. **Sistema de Permisos** - Control de acceso por roles

---

## 🛠️ Troubleshooting

### Error: "Cannot find module 'expo-sqlite'"

```bash
npx expo install expo-sqlite
```

### Error: "Database is locked"

Asegúrate de cerrar la BD antes de eliminarla:

```typescript
await closeDatabase();
await resetDatabase();
```

### Ver logs de migraciones

Los logs se imprimen automáticamente en consola con emojis:

- 🚀 Inicialización
- 📦 Creación de tablas
- 🔄 Migraciones
- ✅ Éxito
- ❌ Error

---

## 📝 Notas Técnicas

- **Timestamps:** Formato ISO 8601 (texto) para compatibilidad
- **UUIDs:** Generados con `uuid` o `crypto.randomUUID()`
- **Passwords:** Hash con bcrypt, cost=10
- **Triggers:** Auto-actualiza `updated_at` en users
- **Índices:** Optimizados para queries frecuentes

---

**¡Base de datos lista para usar!** 🎉
