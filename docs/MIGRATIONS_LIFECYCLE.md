# 🔄 Ciclo de Vida de las Migraciones - Explicación Completa

## ❓ La Pregunta Clave

**"¿De dónde obtengo las migraciones si solo tengo BD local?"**

**Respuesta corta**: Las migraciones NO vienen de la BD, vienen del **código de tu app** (empaquetadas en el archivo `lib/db/migrations.ts`).

---

## 🎯 Concepto Fundamental

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPORTANTE: Las migraciones son CÓDIGO, no datos              │
└─────────────────────────────────────────────────────────────────┘

❌ FALSO: Las migraciones se descargan del servidor
❌ FALSO: Las migraciones están en la BD
❌ FALSO: Necesitas internet para obtener migraciones

✅ VERDAD: Las migraciones están en el código de tu app
✅ VERDAD: Se incluyen cuando instalas/actualizas la app
✅ VERDAD: Funcionan 100% offline
```

---

## 📦 ¿Dónde están las Migraciones?

### Ubicación Física

```
brigadaFrontEnd/
├── lib/
│   └── db/
│       └── migrations.ts  ← AQUÍ están todas las migraciones
```

### Contenido del Archivo

```typescript
// lib/db/migrations.ts

// Esta función es el "catálogo" de migraciones
function getAllMigrations(): Migration[] {
  return [
    migration_v1_initial_schema, // ← Migración 1
    migration_v2_add_survey_metadata, // ← Migración 2
    // migration_v3_...                // ← Futuras migraciones
  ];
}

// Cada migración es un objeto con código SQL
const migration_v1_initial_schema: Migration = {
  version: 1,
  name: "initial_schema",
  up: (db) => {
    // Este código crea las tablas
    db.execSync(`CREATE TABLE users (...)`);
    db.execSync(`CREATE TABLE survey_schemas (...)`);
    // ... etc
  },
};

const migration_v2_add_survey_metadata: Migration = {
  version: 2,
  name: "add_survey_metadata",
  up: (db) => {
    // Este código agrega columnas
    db.execSync(`ALTER TABLE survey_responses ADD COLUMN duration INTEGER`);
    db.execSync(`ALTER TABLE survey_responses ADD COLUMN notes TEXT`);
    // ... etc
  },
};
```

---

## 🔄 Ciclo de Vida Completo

### Fase 1: Desarrollo (El Desarrollador Crea la Migración)

```
┌──────────────────────────────────────────────────┐
│  DESARROLLADOR en su laptop                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Decide agregar un nuevo campo               │
│     "Necesito agregar campo 'duration'"         │
│                                                  │
│  2. Edita lib/db/migrations.ts                  │
│     • Crea migration_v2                         │
│     • Escribe el SQL: ALTER TABLE ...           │
│                                                  │
│  3. Actualiza lib/db/schema.ts                  │
│     • Agrega campo en el tipo TypeScript        │
│                                                  │
│  4. Prueba localmente                           │
│     • Borra BD local                            │
│     • Reinicia app                              │
│     • Verifica que migración funcione           │
│                                                  │
│  5. Commit y push a Git                         │
│     git add lib/db/migrations.ts                │
│     git commit -m "Add migration v2"            │
│     git push                                    │
└──────────────────────────────────────────────────┘
```

### Fase 2: Empaquetado (Build de la App)

```
┌──────────────────────────────────────────────────┐
│  SISTEMA DE BUILD (eas build / expo build)      │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Descarga código de Git                      │
│                                                  │
│  2. Empaqueta TODOS los archivos JS/TS          │
│     Incluye: lib/db/migrations.ts               │
│     ↓                                            │
│     Las migraciones van dentro del bundle       │
│                                                  │
│  3. Genera APK (Android) o IPA (iOS)            │
│     app-v1.1.apk                                │
│     ├── assets/                                 │
│     ├── index.bundle  ← Aquí están las migs     │
│     └── ...                                     │
│                                                  │
│  4. App lista para distribuir                   │
└──────────────────────────────────────────────────┘
```

### Fase 3: Instalación/Actualización (Usuario Final)

```
┌──────────────────────────────────────────────────┐
│  USUARIO descarga/actualiza app                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Play Store/App Store:                          │
│  "Nueva versión disponible: v1.1"               │
│                                                  │
│  Usuario presiona "Actualizar"                  │
│  ↓                                               │
│  Se descarga app-v1.1.apk                       │
│  ↓                                               │
│  Se instala en el dispositivo                   │
│  ↓                                               │
│  ✅ Ahora el dispositivo tiene:                 │
│     • Todo el código de la app                  │
│     • Incluyendo lib/db/migrations.ts con v2    │
└──────────────────────────────────────────────────┘
```

### Fase 4: Primera Ejecución (Migraciones Automáticas)

```
┌──────────────────────────────────────────────────┐
│  USUARIO abre la app actualizada                │
├──────────────────────────────────────────────────┤
│                                                  │
│  app/_layout.tsx se ejecuta:                    │
│                                                  │
│  useEffect(() => {                              │
│    initDatabase();     // Abre brigada.db       │
│    runMigrations();    // ← AQUÍ PASA LA MAGIA  │
│  }, []);                                        │
│                                                  │
│  ↓                                               │
│                                                  │
│  runMigrations() busca migraciones en CÓDIGO:   │
│  const migrations = getAllMigrations();         │
│  // Retorna [v1, v2] desde migrations.ts        │
│                                                  │
│  ↓                                               │
│                                                  │
│  Compara con BD local:                          │
│  currentVersion = 1  (guardado en BD)           │
│  migrations = [v1, v2]  (del código)            │
│                                                  │
│  ↓                                               │
│                                                  │
│  Ejecuta v2 porque 2 > 1:                       │
│  migration_v2.up(db)                            │
│  ALTER TABLE survey_responses ADD ...           │
│                                                  │
│  ↓                                               │
│                                                  │
│  Guarda en BD: INSERT INTO migrations (2, ...)  │
│                                                  │
│  ✅ BD actualizada, app continúa                │
└──────────────────────────────────────────────────┘
```

---

## 🔍 Diagrama de Flujo Detallado

```
CÓDIGO (migrations.ts)          BD LOCAL (brigada.db)
─────────────────────          ─────────────────────

┌─────────────────┐            ┌─────────────────┐
│ migration_v1    │            │ migrations      │
│ version: 1      │            │ ┌─────┬───────┐ │
│ up: CREATE...   │            │ │ ver │ name  │ │
└─────────────────┘            │ ├─────┼───────┤ │
                               │ │  1  │ init  │ │
┌─────────────────┐            │ └─────┴───────┘ │
│ migration_v2    │            └─────────────────┘
│ version: 2      │                    ↑
│ up: ALTER...    │                    │
└─────────────────┘                    │
        ↓                              │
        │                              │
        └──── runMigrations() ─────────┘
              compara y ejecuta


FLUJO:
1. runMigrations() lee currentVersion de BD → 1
2. getAllMigrations() retorna [v1, v2] del código
3. Encuentra que v2 no está aplicada (2 > 1)
4. Ejecuta migration_v2.up(db)
5. Guarda en BD: INSERT INTO migrations (2, ...)
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Usuario Nuevo (Instala App por Primera Vez)

```
ESTADO INICIAL:
• No hay brigada.db en el dispositivo
• App tiene migrations.ts con [v1, v2]

PASO 1: Usuario abre app
┌────────────────────────────────────┐
│ runMigrations()                    │
│ └─ currentVersion = 0 (BD nueva)   │
└────────────────────────────────────┘

PASO 2: Ejecuta todas las migraciones
┌────────────────────────────────────┐
│ Ejecuta v1: CREATE TABLE users ... │
│ Ejecuta v2: ALTER TABLE ...        │
└────────────────────────────────────┘

RESULTADO:
• BD creada con versión 2
• Tiene todas las tablas y columnas
```

### Ejemplo 2: Usuario Existente (Actualiza de v1.0 a v1.1)

```
ESTADO INICIAL:
• brigada.db existe con versión 1
• Usuario descarga app v1.1 (incluye migration_v2)

PASO 1: Usuario abre app actualizada
┌────────────────────────────────────┐
│ runMigrations()                    │
│ └─ currentVersion = 1 (lee de BD)  │
└────────────────────────────────────┘

PASO 2: Solo ejecuta migraciones nuevas
┌────────────────────────────────────┐
│ Salta v1 (1 ≤ 1)                   │
│ Ejecuta v2 (2 > 1)                 │
│ └─ ALTER TABLE survey_responses... │
└────────────────────────────────────┘

RESULTADO:
• BD actualizada a versión 2
• Datos antiguos preservados
• Nuevas columnas agregadas
```

### Ejemplo 3: Usuario Actualizado (Ya Tiene v1.1)

```
ESTADO INICIAL:
• brigada.db existe con versión 2
• Usuario abre app (ya tiene migration_v2)

PASO 1: runMigrations()
┌────────────────────────────────────┐
│ currentVersion = 2                 │
│ getAllMigrations() → [v1, v2]      │
└────────────────────────────────────┘

PASO 2: No ejecuta nada
┌────────────────────────────────────┐
│ Salta v1 (1 ≤ 2)                   │
│ Salta v2 (2 ≤ 2)                   │
│ └─ Sin migraciones pendientes      │
└────────────────────────────────────┘

RESULTADO:
• Sin cambios en BD
• App continúa normal (< 10ms)
```

---

## 🎓 Preguntas y Respuestas

### P1: ¿Necesito un servidor para las migraciones?

**R:** No. Las migraciones están en el código de tu app, no en un servidor.

```
✅ Offline-first: Todo funciona sin internet
✅ Autónomo: Cada dispositivo maneja sus propias migraciones
```

### P2: ¿Cómo se sincronizan las migraciones entre dispositivos?

**R:** No se "sincronizan". Cada dispositivo ejecuta las migraciones localmente.

```
Dispositivo A:
• Actualiza a app v1.1 → aplica migration_v2 → BD versión 2

Dispositivo B:
• Actualiza a app v1.1 → aplica migration_v2 → BD versión 2

Ambos terminan con la misma estructura de BD,
pero los DATOS son independientes (hasta que se sincronicen en Fase 3).
```

### P3: ¿Qué pasa si un usuario no actualiza la app?

**R:** Sigue usando la versión antigua con BD antigua (no hay problema).

```
Usuario A (app v1.0):
• BD versión 1
• 10 columnas en survey_responses
• ✅ Todo funciona normal

Usuario B (app v1.1):
• BD versión 2
• 25 columnas en survey_responses
• ✅ Todo funciona normal

Cada uno tiene una BD compatible con su versión de código.
```

### P4: ¿Cuándo se crean las migraciones?

**R:** Durante el desarrollo, cuando decides cambiar el schema.

```
GATILLOS COMUNES:

• Necesitas un nuevo campo
  → Crear migration_vX con ALTER TABLE

• Nueva funcionalidad requiere nueva tabla
  → Crear migration_vX con CREATE TABLE

• Necesitas un índice para performance
  → Crear migration_vX con CREATE INDEX

• Error en migración anterior
  → NO edites la anterior
  → Crea nueva migration_vX+1 que arregle
```

### P5: ¿Cómo creo una nueva migración?

**R:** Editando `lib/db/migrations.ts`:

```typescript
// 1. Define la migración
const migration_v3_add_photos: Migration = {
  version: 3, // ← Incrementa el número
  name: "add_photos_table",
  up: (db) => {
    db.execSync(`
      CREATE TABLE photos (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL,
        url TEXT NOT NULL
      )
    `);
  },
};

// 2. Agrégala al catálogo
function getAllMigrations(): Migration[] {
  return [
    migration_v1_initial_schema,
    migration_v2_add_survey_metadata,
    migration_v3_add_photos, // ← NUEVA
  ];
}
```

### P6: ¿Se pueden perder migraciones?

**R:** No, mientras no borres el código.

```
❌ NO puedes perder migraciones porque:
  • Están en Git (versionadas)
  • Están en el bundle de la app
  • Son parte del código fuente

✅ Solo se "pierden" si:
  • Borras el archivo migrations.ts (no hagas eso)
  • No las incluyes en getAllMigrations()
```

---

## 🔐 Tabla de Control: `migrations`

Esta tabla en la BD LOCAL rastrea qué migraciones ya se aplicaron:

```sql
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY,
  version INTEGER UNIQUE,  -- Número de versión
  name TEXT,               -- Nombre descriptivo
  applied_at INTEGER       -- Timestamp de aplicación
);
```

**Ejemplo de contenido:**

```
┌────┬─────────┬────────────────────────┬────────────┐
│ id │ version │ name                   │ applied_at │
├────┼─────────┼────────────────────────┼────────────┤
│ 1  │ 1       │ initial_schema         │ 1707480000 │
│ 2  │ 2       │ add_survey_metadata    │ 1707566400 │
└────┴─────────┴────────────────────────┴────────────┘
```

**Propósito:**

- Evitar ejecutar la misma migración dos veces
- Saber qué versión tiene cada dispositivo
- Detectar qué migraciones faltan aplicar

---

## 🎬 Diagrama Final: De Código a BD

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: DESARROLLO                                         │
│  ─────────────────────────────────────────────────────────  │
│  Desarrollador escribe:                                     │
│  lib/db/migrations.ts                                       │
│    const migration_v2 = { version: 2, up: (db) => {...} }  │
└─────────────────────────────────────────────────────────────┘
                             ↓
                       git commit & push
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: BUILD                                              │
│  ─────────────────────────────────────────────────────────  │
│  eas build / expo build                                     │
│  • Descarga código                                          │
│  • Empaqueta migrations.ts en bundle                        │
│  • Genera app-v1.1.apk                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
                    Play Store / App Store
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: INSTALACIÓN                                        │
│  ─────────────────────────────────────────────────────────  │
│  Usuario descarga app-v1.1.apk                              │
│  • Contiene migrations.ts con v2                            │
│  • Se instala en dispositivo                                │
└─────────────────────────────────────────────────────────────┘
                             ↓
                    Usuario abre app
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: EJECUCIÓN                                          │
│  ─────────────────────────────────────────────────────────  │
│  app/_layout.tsx:                                           │
│    runMigrations()                                          │
│      ├─ Lee currentVersion de BD local                      │
│      ├─ Obtiene [v1, v2] de migrations.ts (código)          │
│      ├─ Compara: 2 > 1                                      │
│      ├─ Ejecuta migration_v2.up(db)                         │
│      └─ Guarda en BD: INSERT INTO migrations (2, ...)       │
└─────────────────────────────────────────────────────────────┘
                             ↓
                   ✅ BD actualizada
```

---

## 📚 Resumen Final

| Pregunta                      | Respuesta                                   |
| ----------------------------- | ------------------------------------------- |
| ¿Dónde están las migraciones? | En `lib/db/migrations.ts` (código)          |
| ¿Cuándo se crean?             | Durante desarrollo (por el programador)     |
| ¿Cómo llegan al usuario?      | Empaquetadas en el APK/IPA                  |
| ¿Necesitan internet?          | No, funcionan 100% offline                  |
| ¿Cómo sabe cuáles aplicar?    | Compara versión en BD vs código             |
| ¿Se pueden perder?            | No, están en Git y en el bundle             |
| ¿Se sincronizan?              | No, cada dispositivo las ejecuta localmente |

---

## 🔗 Ver También

- **Guía completa**: `docs/MIGRATIONS_GUIDE.md`
- **Diagramas visuales**: `docs/MIGRATIONS_VISUAL.md`
- **Código fuente**: `lib/db/migrations.ts`

**Última actualización**: Febrero 2026
