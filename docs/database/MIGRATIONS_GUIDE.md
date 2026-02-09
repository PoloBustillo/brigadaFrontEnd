# 🔄 Sistema de Migraciones - Guía Completa

## 📖 Índice

1. [¿Qué es una migración?](#qué-es-una-migración)
2. [¿Cómo funciona?](#cómo-funciona)
3. [Estructura del código](#estructura-del-código)
4. [Ciclo de vida](#ciclo-de-vida)
5. [Crear una nueva migración](#crear-una-nueva-migración)
6. [Mejores prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)

---

## ¿Qué es una migración?

Una **migración** es un script versionado que modifica el schema de la base de datos de forma controlada y reproducible.

### Problema que resuelve:

```
❌ Sin migraciones:
- Usuario con BD v1 actualiza app → ¡crash! falta columna 'duration'
- Desarrollador borra brigada.db y reinstala (pierde datos)
- No hay forma de saber qué versión tiene cada usuario

✅ Con migraciones:
- Usuario actualiza app → migraciones automáticas v1→v2→v3
- Datos preservados, schema actualizado
- Sistema sabe exactamente qué versión tiene cada BD
```

---

## ¿Cómo funciona?

### Flujo Paso a Paso

```
┌─────────────────────────────────────────────────────────────┐
│  1. App inicia → runMigrations()                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Crea tabla 'migrations' si no existe                    │
│     CREATE TABLE migrations (                               │
│       id INTEGER PRIMARY KEY,                               │
│       version INTEGER UNIQUE,                               │
│       name TEXT,                                            │
│       applied_at INTEGER                                    │
│     );                                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Obtiene versión actual                                  │
│     SELECT MAX(version) FROM migrations                     │
│     → Si tabla vacía: version = 0                           │
│     → Si tiene registros: version = max(version)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Obtiene lista de migraciones disponibles                │
│     [migration_v1, migration_v2, migration_v3, ...]         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Para cada migración:                                    │
│     if (migration.version > currentVersion) {               │
│       ⬆️  ejecutar migration.up(db)                         │
│       📝 registrar en tabla migrations                      │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. ✅ BD actualizada, app continúa                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura del Código

### Archivo: `lib/db/migrations.ts`

```typescript
// ============================================
// 1. FUNCIÓN PRINCIPAL
// ============================================
export async function runMigrations(): Promise<void> {
  const db = openDatabaseSync("brigada.db");

  // Crear tabla de control
  db.execSync(`CREATE TABLE IF NOT EXISTS migrations (...)`);

  // Obtener versión actual
  const currentVersion = getCurrentVersion(db);

  // Aplicar migraciones pendientes
  const migrations = getAllMigrations();
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      recordMigration(db, migration.version, migration.name);
    }
  }
}

// ============================================
// 2. FUNCIONES AUXILIARES
// ============================================
function getCurrentVersion(db): number {
  // Consulta MAX(version) de tabla migrations
  // Retorna 0 si está vacía (BD nueva)
}

function recordMigration(db, version, name): void {
  // INSERT INTO migrations (version, name) VALUES (?, ?)
}

function getAllMigrations(): Migration[] {
  // Retorna array con todas las migraciones
  return [
    migration_v1_initial_schema,
    migration_v2_add_survey_metadata,
    // ... futuras migraciones
  ];
}

// ============================================
// 3. DEFINICIONES DE MIGRACIONES
// ============================================
const migration_v1_initial_schema: Migration = {
  version: 1,
  name: "initial_schema",
  up: (db) => {
    db.execSync(`CREATE TABLE users (...)`);
    db.execSync(`CREATE TABLE survey_schemas (...)`);
    // ... crear todas las tablas iniciales
  },
};

const migration_v2_add_survey_metadata: Migration = {
  version: 2,
  name: "add_survey_metadata",
  up: (db) => {
    db.execSync(`ALTER TABLE survey_responses ADD COLUMN duration INTEGER`);
    db.execSync(`ALTER TABLE survey_responses ADD COLUMN respondent_name TEXT`);
    // ... agregar 15 columnas nuevas
  },
};
```

---

## Ciclo de Vida

### Escenario 1: Usuario Nuevo (BD no existe)

```
Estado inicial: No hay brigada.db

1. runMigrations()
2. getCurrentVersion() → 0 (tabla migrations vacía)
3. Ejecuta migration_v1 (crea todas las tablas)
4. Registra: INSERT INTO migrations (1, 'initial_schema')
5. Ejecuta migration_v2 (agrega columnas)
6. Registra: INSERT INTO migrations (2, 'add_survey_metadata')

Estado final: BD versión 2 ✅
```

### Escenario 2: Usuario con BD v1 actualiza app

```
Estado inicial: BD existe con versión 1

1. runMigrations()
2. getCurrentVersion() → 1
3. Salta migration_v1 (version 1 ≤ 1)
4. Ejecuta migration_v2 (version 2 > 1) ← SOLO ESTA
5. Registra: INSERT INTO migrations (2, 'add_survey_metadata')

Estado final: BD versión 2 ✅
```

### Escenario 3: Usuario con BD v2 actualizada

```
Estado inicial: BD existe con versión 2

1. runMigrations()
2. getCurrentVersion() → 2
3. Salta migration_v1 (version 1 ≤ 2)
4. Salta migration_v2 (version 2 ≤ 2)

Estado final: BD versión 2 ✅ (sin cambios)
```

---

## Crear una Nueva Migración

### Paso 1: Define la migración

```typescript
// En lib/db/migrations.ts

const migration_v3_add_user_preferences: Migration = {
  version: 3, // ⚠️ IMPORTANTE: incrementar número
  name: "add_user_preferences",
  up: (db) => {
    // ✅ Agregar columnas
    db.execSync(`
      ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'
    `);

    // ✅ Crear nuevas tablas
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        setting_key TEXT NOT NULL,
        setting_value TEXT,
        UNIQUE(user_id, setting_key)
      )
    `);

    // ✅ Crear índices
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
      ON user_settings(user_id)
    `);

    console.log("✅ Preferencias de usuario agregadas");
  },
};
```

### Paso 2: Agrega la migración a la lista

```typescript
function getAllMigrations(): Migration[] {
  return [
    migration_v1_initial_schema,
    migration_v2_add_survey_metadata,
    migration_v3_add_user_preferences, // ← NUEVA
  ];
}
```

### Paso 3: Actualiza el schema de Drizzle

```typescript
// En lib/db/schema.ts

export const users = sqliteTable("users", {
  // ... campos existentes ...

  // ✅ Agregar nuevo campo
  theme: text("theme", { enum: ["light", "dark"] }).default("light"),
});

// ✅ Nueva tabla
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value"),
});
```

### Paso 4: ¡Listo! Se aplicará automáticamente

```typescript
// En app/_layout.tsx (ya configurado)
useEffect(() => {
  async function setup() {
    await initDatabase();
    await runMigrations(); // ← Detecta y aplica v3 automáticamente
  }
  setup();
}, []);
```

---

## Mejores Prácticas

### ✅ DO's (Hacer)

1. **Siempre incrementar la versión**

   ```typescript
   // ✅ Correcto
   migration_v1 (version: 1)
   migration_v2 (version: 2)
   migration_v3 (version: 3)
   ```

2. **Usar nombres descriptivos**

   ```typescript
   // ✅ Correcto
   name: "add_survey_metadata";
   name: "create_attachments_table";
   name: "add_user_preferences";

   // ❌ Incorrecto
   name: "migration2";
   name: "update";
   ```

3. **Migraciones idempotentes** (se pueden ejecutar múltiples veces)

   ```typescript
   // ✅ Correcto
   db.execSync(`CREATE TABLE IF NOT EXISTS users (...)`);
   db.execSync(`CREATE INDEX IF NOT EXISTS idx_name ON users(name)`);

   // ❌ Incorrecto (falla la segunda vez)
   db.execSync(`CREATE TABLE users (...)`);
   ```

4. **Agregar valores por defecto a nuevas columnas**

   ```typescript
   // ✅ Correcto (usuarios antiguos tendrán NULL o default)
   db.execSync(`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'`);

   // ⚠️ Cuidado (usuarios antiguos tendrán NULL sin default)
   db.execSync(`ALTER TABLE users ADD COLUMN age INTEGER`);
   ```

5. **Mantener el orden cronológico**

   ```typescript
   // ✅ Correcto
   return [
     migration_v1_initial_schema,
     migration_v2_add_survey_metadata,
     migration_v3_add_preferences,
   ];

   // ❌ Incorrecto (fuera de orden)
   return [
     migration_v1_initial_schema,
     migration_v3_add_preferences,
     migration_v2_add_survey_metadata,
   ];
   ```

### ❌ DON'Ts (No hacer)

1. **NO modificar migraciones ya aplicadas**

   ```typescript
   // ❌ NUNCA HACER ESTO
   // Si migration_v2 ya está en producción, NO la cambies
   const migration_v2 = {
     version: 2,
     up: (db) => {
       // ❌ NO agregar más código aquí si usuarios ya la tienen aplicada
     },
   };

   // ✅ En su lugar, crea v3
   const migration_v3 = {
     version: 3,
     up: (db) => {
       // ✅ Nuevos cambios van en nueva migración
     },
   };
   ```

2. **NO usar DROP TABLE sin estrategia de respaldo**

   ```typescript
   // ❌ Peligroso (pérdida de datos)
   db.execSync(`DROP TABLE old_table`);

   // ✅ Mejor: renombrar primero
   db.execSync(`ALTER TABLE old_table RENAME TO old_table_backup`);
   ```

3. **NO depender de datos específicos**

   ```typescript
   // ❌ Incorrecto (asume que existe user con id='123')
   db.execSync(`UPDATE settings SET user_id='123'`);

   // ✅ Correcto (usa queries dinámicas)
   const users = db.getAllSync("SELECT id FROM users LIMIT 1");
   if (users.length > 0) {
     db.execSync(`UPDATE settings SET user_id=? WHERE user_id IS NULL`, [
       users[0].id,
     ]);
   }
   ```

---

## Troubleshooting

### Problema 1: Migración falla a mitad de ejecución

**Síntoma**: Error en consola, app no inicia

**Solución**:

```typescript
// Opción A: Arreglar la migración y volver a intentar
// 1. Elimina el registro de la migración fallida
await db.runSync("DELETE FROM migrations WHERE version = ?", [2]);

// 2. Corrige el código de migration_v2

// 3. Vuelve a ejecutar runMigrations()

// Opción B: Resetear BD (solo en desarrollo)
import * as FileSystem from "expo-file-system";
const dbPath = `${FileSystem.documentDirectory}SQLite/brigada.db`;
await FileSystem.deleteAsync(dbPath);
// La próxima vez que abra la app, se creará desde cero
```

### Problema 2: "Column already exists"

**Causa**: Intentaste agregar una columna que ya existe

**Solución**: Usar migraciones idempotentes

```typescript
// ❌ Causa error si ya existe
db.execSync(`ALTER TABLE users ADD COLUMN theme TEXT`);

// ✅ Primero verifica si existe
const columns = db.getAllSync(`PRAGMA table_info(users)`);
const hasTheme = columns.some((col) => col.name === "theme");
if (!hasTheme) {
  db.execSync(`ALTER TABLE users ADD COLUMN theme TEXT`);
}
```

### Problema 3: Versión incorrecta registrada

**Síntoma**: `getCurrentVersion()` retorna número incorrecto

**Solución**:

```typescript
// Ver qué migraciones están registradas
const registered = db.getAllSync("SELECT * FROM migrations ORDER BY version");
console.log(registered);

// Si hay registros incorrectos, eliminarlos (CUIDADO)
db.runSync("DELETE FROM migrations WHERE version > 2");
```

### Problema 4: BD de producción desincronizada

**Prevención**: Nunca editar BD manualmente en producción

**Si sucede**:

```typescript
// Crear migración de "arreglo" que detecte el estado
const migration_v4_fix_schema: Migration = {
  version: 4,
  name: "fix_schema_inconsistencies",
  up: (db) => {
    // Detectar qué columnas faltan y agregarlas
    const columns = db.getAllSync(`PRAGMA table_info(survey_responses)`);

    if (!columns.some((c) => c.name === "duration")) {
      db.execSync(`ALTER TABLE survey_responses ADD COLUMN duration INTEGER`);
    }

    if (!columns.some((c) => c.name === "notes")) {
      db.execSync(`ALTER TABLE survey_responses ADD COLUMN notes TEXT`);
    }

    // ... etc
  },
};
```

---

## Testing de Migraciones

### Test Manual

```typescript
// En __tests__/migrations.test.ts
import * as FileSystem from "expo-file-system";
import { openDatabaseSync } from "expo-sqlite";
import { runMigrations } from "../lib/db/migrations";

describe("Migration System", () => {
  beforeEach(async () => {
    // Limpiar BD antes de cada test
    const dbPath = `${FileSystem.documentDirectory}SQLite/test.db`;
    if (await FileSystem.getInfoAsync(dbPath).exists) {
      await FileSystem.deleteAsync(dbPath);
    }
  });

  it("should create all tables from scratch", async () => {
    await runMigrations();

    const db = openDatabaseSync("test.db");
    const tables = db.getAllSync(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);

    expect(tables).toContainEqual({ name: "users" });
    expect(tables).toContainEqual({ name: "survey_responses" });
    expect(tables).toContainEqual({ name: "migrations" });
  });

  it("should apply incremental migration", async () => {
    const db = openDatabaseSync("test.db");

    // Simular BD en v1
    db.execSync("CREATE TABLE migrations (version INTEGER, name TEXT)");
    db.execSync('INSERT INTO migrations VALUES (1, "initial_schema")');
    db.execSync("CREATE TABLE survey_responses (id TEXT PRIMARY KEY)");

    // Ejecutar migraciones
    await runMigrations();

    // Verificar que agregó las columnas de v2
    const columns = db.getAllSync("PRAGMA table_info(survey_responses)");
    expect(columns).toContainEqual(
      expect.objectContaining({ name: "duration" }),
    );
  });
});
```

---

## Resumen Visual

```
┌───────────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO DEL SISTEMA DE MIGRACIONES                   │
└───────────────────────────────────────────────────────────────┘

App inicia
    ↓
runMigrations()
    ↓
┌─────────────────────────────────────┐
│ ¿Existe tabla migrations?           │
│  NO  → Crear tabla                  │
│  SÍ  → Continuar                    │
└─────────────────────────────────────┘
    ↓
getCurrentVersion()
    ↓
┌─────────────────────────────────────┐
│ SELECT MAX(version) FROM migrations │
│ → Retorna: 0, 1, 2, 3...            │
└─────────────────────────────────────┘
    ↓
getAllMigrations()
    ↓
┌─────────────────────────────────────┐
│ [v1, v2, v3, v4, ...]               │
└─────────────────────────────────────┘
    ↓
Para cada migración:
    ↓
┌─────────────────────────────────────┐
│ ¿version > currentVersion?          │
│  SÍ  → Ejecutar migration.up(db)   │
│        + Registrar en tabla         │
│  NO  → Skip                         │
└─────────────────────────────────────┘
    ↓
✅ Todas las migraciones aplicadas
    ↓
App continúa con BD actualizada
```

---

## Referencias

- **Código fuente**: `lib/db/migrations.ts`
- **Inicialización**: `app/_layout.tsx` (llamada a `runMigrations()`)
- **Schema**: `lib/db/schema.ts` (debe coincidir con migraciones)
- **Expo SQLite docs**: https://docs.expo.dev/versions/latest/sdk/sqlite/

---

¿Preguntas frecuentes?

**P: ¿Puedo revertir una migración?**
R: No hay sistema de rollback automático. Deberías crear una nueva migración que revierta los cambios.

**P: ¿Qué pasa si dos migraciones tienen el mismo número de versión?**
R: El campo `version` es UNIQUE, por lo que fallará al intentar registrar la segunda.

**P: ¿Cuándo se ejecutan las migraciones?**
R: Cada vez que la app inicia, en `app/_layout.tsx`. Solo aplica las pendientes.

**P: ¿Puedo tener migraciones en múltiples archivos?**
R: Sí, pero debes importarlas y agregarlas al array en `getAllMigrations()`.
