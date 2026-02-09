# 🔄 Sistema de Migraciones - Resumen Visual

## 🎯 Concepto Clave

```
Sin migraciones:
┌──────────────┐
│ App v1.0     │  →  Usuario tiene BD con 10 columnas
└──────────────┘

┌──────────────┐
│ App v1.1     │  →  ❌ CRASH! Falta columna 'duration'
└──────────────┘      (código espera 15 columnas)


Con migraciones:
┌──────────────┐
│ App v1.0     │  →  BD versión 1 (10 columnas)
└──────────────┘

┌──────────────┐
│ App v1.1     │  →  ✅ Detecta v1 → aplica migration_v2
└──────────────┘      BD actualizada a v2 (15 columnas)
                      ¡Datos preservados!
```

---

## 📊 Tabla de Control: `migrations`

Esta tabla rastrea qué migraciones ya se aplicaron:

```sql
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
```

**Ejemplo de contenido:**

| id  | version | name                 | applied_at |
| --- | ------- | -------------------- | ---------- |
| 1   | 1       | initial_schema       | 1707480000 |
| 2   | 2       | add_survey_metadata  | 1707566400 |
| 3   | 3       | add_user_preferences | 1707652800 |

**¿Cómo se usa?**

```typescript
// Cada vez que runMigrations() se ejecuta:
const currentVersion = db.getFirstSync(
  "SELECT MAX(version) FROM migrations",
).version; // → Retorna 3

// Solo aplica migraciones con version > 3
```

---

## 🔄 Flujo Completo (Diagrama Detallado)

```
┌─────────────────────────────────────────────────────────────────────┐
│  APP INICIA                                                         │
│  └─ app/_layout.tsx                                                 │
│     └─ useEffect(() => {                                            │
│          initDatabase();     // Abre brigada.db                     │
│          runMigrations();    // ← AQUÍ EMPIEZA EL FLUJO            │
│        })                                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 1: Crear tabla de control (si no existe)                     │
│  ────────────────────────────────────────────────────────────────   │
│  db.execSync(`                                                      │
│    CREATE TABLE IF NOT EXISTS migrations (                         │
│      id INTEGER PRIMARY KEY,                                       │
│      version INTEGER UNIQUE,                                       │
│      name TEXT,                                                    │
│      applied_at INTEGER                                            │
│    )                                                               │
│  `);                                                               │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 2: Obtener versión actual                                    │
│  ────────────────────────────────────────────────────────────────   │
│  const currentVersion = getCurrentVersion(db);                      │
│  │                                                                  │
│  └─► SELECT MAX(version) FROM migrations                           │
│                                                                     │
│  Posibles resultados:                                               │
│  • NULL (tabla vacía)      → version = 0  (BD nueva)               │
│  • 1                       → version = 1  (solo v1 aplicada)       │
│  • 2                       → version = 2  (v1 + v2 aplicadas)      │
│                                                                     │
│  📊 console.log('Versión actual de BD: 2')                         │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 3: Obtener lista de migraciones disponibles                  │
│  ────────────────────────────────────────────────────────────────   │
│  const migrations = getAllMigrations();                             │
│                                                                     │
│  Retorna:                                                           │
│  [                                                                  │
│    { version: 1, name: 'initial_schema', up: Function },           │
│    { version: 2, name: 'add_survey_metadata', up: Function },      │
│    { version: 3, name: 'add_user_preferences', up: Function }      │
│  ]                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 4: Iterar y aplicar pendientes                                │
│  ────────────────────────────────────────────────────────────────   │
│  for (const migration of migrations) {                              │
│    if (migration.version > currentVersion) {                        │
│      await migration.up(db);                                        │
│      recordMigration(db, migration.version, migration.name);        │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌───────────────────────────────────────────────────────────────┐
│  ITERACIÓN 1: migration_v1                                    │
│  ──────────────────────────────────────────────────────────   │
│  version: 1                                                   │
│  currentVersion: 2                                            │
│                                                               │
│  ¿1 > 2? NO                                                   │
│  └─► SKIP ⏩ (ya aplicada)                                    │
└───────────────────────────────────────────────────────────────┘
                                  ↓
┌───────────────────────────────────────────────────────────────┐
│  ITERACIÓN 2: migration_v2                                    │
│  ──────────────────────────────────────────────────────────   │
│  version: 2                                                   │
│  currentVersion: 2                                            │
│                                                               │
│  ¿2 > 2? NO                                                   │
│  └─► SKIP ⏩ (ya aplicada)                                    │
└───────────────────────────────────────────────────────────────┘
                                  ↓
┌───────────────────────────────────────────────────────────────┐
│  ITERACIÓN 3: migration_v3                                    │
│  ──────────────────────────────────────────────────────────   │
│  version: 3                                                   │
│  currentVersion: 2                                            │
│                                                               │
│  ¿3 > 2? SÍ ✅                                                │
│  └─► EJECUTAR:                                                │
│       │                                                       │
│       ├─► 📝 console.log('Aplicando migración v3...')        │
│       │                                                       │
│       ├─► migration_v3.up(db)                                 │
│       │   • db.execSync('ALTER TABLE users ADD ...')         │
│       │   • db.execSync('CREATE TABLE user_settings ...')    │
│       │   • ✅ console.log('Preferencias agregadas')         │
│       │                                                       │
│       └─► recordMigration(db, 3, 'add_user_preferences')     │
│           INSERT INTO migrations (3, 'add_user_preferences') │
│                                                               │
│  ✅ console.log('Migración v3 aplicada')                     │
└───────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 5: Finalizar                                                  │
│  ────────────────────────────────────────────────────────────────   │
│  ✨ console.log('Todas las migraciones aplicadas correctamente')   │
│                                                                     │
│  Estado final de tabla migrations:                                  │
│  ┌────┬─────────┬────────────────────────┬────────────┐            │
│  │ id │ version │ name                   │ applied_at │            │
│  ├────┼─────────┼────────────────────────┼────────────┤            │
│  │ 1  │ 1       │ initial_schema         │ 1707480000 │            │
│  │ 2  │ 2       │ add_survey_metadata    │ 1707566400 │            │
│  │ 3  │ 3       │ add_user_preferences   │ 1707652800 │ ← NUEVA   │
│  └────┴─────────┴────────────────────────┴────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  APP CONTINÚA CON BD ACTUALIZADA ✅                                 │
│  └─ Ahora puede usar las nuevas columnas/tablas                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Ejemplo Práctico: Usuario Actualiza App

### Antes de actualizar:

```
Usuario tiene App v1.0
BD versión: 1

Contenido de brigada.db:
• Tabla migrations: [v1]
• Tabla survey_responses con 10 columnas
```

### Usuario actualiza a App v1.1:

```
1. Descarga App v1.1 (incluye migration_v2)
2. Abre la app
3. runMigrations() se ejecuta automáticamente
4. Detecta: currentVersion = 1
5. Encuentra: migration_v2 con version = 2
6. 2 > 1 → ¡Aplica migration_v2!
7. migration_v2.up(db) ejecuta:
   ALTER TABLE survey_responses ADD COLUMN duration INTEGER;
   ALTER TABLE survey_responses ADD COLUMN respondent_name TEXT;
   ... (15 columnas nuevas)
8. Registra: INSERT INTO migrations (2, 'add_survey_metadata')
```

### Después de actualizar:

```
Usuario tiene App v1.1
BD versión: 2

Contenido de brigada.db:
• Tabla migrations: [v1, v2]
• Tabla survey_responses con 25 columnas ✅
• Datos antiguos preservados ✅
```

---

## 🧪 Experimento Mental: ¿Qué pasa si...?

### Escenario A: Usuario nuevo instala App v1.1

```
1. No hay brigada.db
2. runMigrations()
3. currentVersion = 0 (tabla migrations vacía)
4. Aplica migration_v1 (crea todas las tablas)
5. Aplica migration_v2 (agrega 15 columnas)
6. Resultado: BD versión 2 con todo creado desde cero ✅
```

### Escenario B: Usuario saltó de v1.0 a v1.2 (sin pasar por v1.1)

```
1. currentVersion = 1
2. App v1.2 tiene [v1, v2, v3]
3. Aplica v2 (2 > 1 ✅)
4. Aplica v3 (3 > 1 ✅)
5. Resultado: BD versión 3 (saltó 2 versiones de golpe) ✅
```

### Escenario C: Usuario ya tiene la última versión

```
1. currentVersion = 2
2. App v1.1 tiene [v1, v2]
3. No aplica v1 (1 ≤ 2 ❌)
4. No aplica v2 (2 ≤ 2 ❌)
5. Resultado: Sin cambios, app continúa normal ✅
```

### Escenario D: Migración falla a mitad de ejecución

```
1. currentVersion = 1
2. Intenta aplicar v2
3. migration_v2.up(db) ejecuta:
   ALTER TABLE survey_responses ADD COLUMN duration INTEGER; ✅
   ALTER TABLE survey_responses ADD COLUMN notes TEXT; ✅
   ALTER TABLE nonexistent ADD COLUMN foo TEXT; ❌ ERROR!
4. Lanza excepción, app no inicia
5. Solución:
   a) Eliminar registro: DELETE FROM migrations WHERE version = 2;
   b) Arreglar el código de migration_v2
   c) Volver a intentar
```

---

## 📋 Checklist: Crear Nueva Migración

```
□ 1. Decide qué cambios necesitas (nueva columna, tabla, índice)

□ 2. Crea el objeto Migration:
     const migration_vX_nombre: Migration = {
       version: X,  // ← Incrementa el número
       name: "descripcion_clara",
       up: (db) => { /* cambios aquí */ }
     }

□ 3. Agrega a getAllMigrations():
     return [..., migration_vX_nombre];

□ 4. Actualiza el schema de Drizzle (lib/db/schema.ts)

□ 5. Prueba en ambiente de desarrollo:
     • Borra brigada.db
     • Reinicia app
     • Verifica que crea todo desde cero

□ 6. Prueba migración incremental:
     • Simula BD antigua (inserta registro en migrations)
     • Reinicia app
     • Verifica que solo aplica la nueva

□ 7. Verifica en consola:
     ⬆️  Aplicando migración vX: nombre
     ✅ Migración vX aplicada
     ✨ Todas las migraciones aplicadas correctamente

□ 8. Commit y push
```

---

## 🚨 Errores Comunes y Soluciones

| Error                      | Causa                                  | Solución                                          |
| -------------------------- | -------------------------------------- | ------------------------------------------------- |
| "Column already exists"    | Intentas agregar columna que ya existe | Verificar con `PRAGMA table_info()` antes         |
| "No such table"            | Referencia a tabla que aún no existe   | Revisar orden de migraciones                      |
| "UNIQUE constraint failed" | Dos migraciones con mismo `version`    | Asignar versión única incremental                 |
| Migración queda a mitad    | Error en SQL de migration.up()         | Eliminar registro de migrations y arreglar código |
| App crashea al iniciar     | Migración falló                        | Revisar logs, eliminar BD y volver a intentar     |

---

## 💡 Regla de Oro

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🚫 NUNCA modifiques una migración que ya está en          │
│     producción (usuarios ya la tienen aplicada)            │
│                                                             │
│  ✅ SIEMPRE crea una nueva migración para cambios          │
│     adicionales                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Mal ❌:
  const migration_v2 = {
    version: 2,
    up: (db) => {
      // ... código original ...
      db.execSync('ALTER TABLE users ADD COLUMN age INTEGER'); // ← NO!
    }
  }

Bien ✅:
  const migration_v3 = {
    version: 3,
    up: (db) => {
      db.execSync('ALTER TABLE users ADD COLUMN age INTEGER'); // ← SÍ!
    }
  }
```

---

## 📚 Ver También

- **Guía completa**: `MIGRATIONS_GUIDE.md`
- **Código fuente**: `lib/db/migrations.ts`
- **Schema**: `lib/db/schema.ts`
- **Changelog v2**: `CHANGELOG_v2.md`
