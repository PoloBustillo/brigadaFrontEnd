# 🗄️ Schema de Base de Datos SQLite

> **Documentación completa del schema de base de datos para la app móvil**

## 📋 Índice

- [Visión General](#visión-general)
- [Tablas Principales](#tablas-principales)
- [Relaciones](#relaciones)
- [Índices y Optimización](#índices-y-optimización)
- [Triggers](#triggers)
- [Vistas](#vistas)
- [Queries Comunes](#queries-comunes)
- [Migración y Versionado](#migración-y-versionado)

---

## 🎯 Visión General

### Características del Schema

- ✅ **Offline-First**: Diseñado para funcionar 100% sin conexión
- ✅ **Sincronización Bidireccional**: Cola de sincronización con reintentos
- ✅ **Versionado de Encuestas**: Soporte completo para múltiples versiones
- ✅ **Archivos Locales**: Gestión de fotos, INE, firmas con OCR
- ✅ **Auditoría Completa**: Triggers automáticos para logging
- ✅ **Integridad Referencial**: Foreign keys y constraints
- ✅ **Timestamps Automáticos**: Triggers para updated_at

### Convenciones

| Convención     | Descripción                                          |
| -------------- | ---------------------------------------------------- |
| **IDs**        | `INTEGER PRIMARY KEY AUTOINCREMENT`                  |
| **UUIDs**      | Columnas `*_id` de tipo `TEXT NOT NULL UNIQUE`       |
| **Timestamps** | ISO 8601 format (`TEXT`, ej: `2026-02-09T10:30:00Z`) |
| **JSON**       | Almacenado como `TEXT`                               |
| **Enums**      | `CHECK` constraints con valores permitidos           |
| **Booleans**   | `BOOLEAN` (0/1)                                      |

---

## 📊 Tablas Principales

### 1. 📋 `surveys`

**Propósito**: Catálogo de encuestas disponibles con sus schemas JSON completos.

```sql
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id TEXT NOT NULL UNIQUE,              -- UUID del schema
  version TEXT NOT NULL,                       -- Versión semántica
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  schema_json TEXT NOT NULL,                   -- SurveySchema completo
  author TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL,
  tags TEXT,                                   -- JSON array
  is_active BOOLEAN DEFAULT 1,
  is_published BOOLEAN DEFAULT 0,
  sync_status TEXT DEFAULT 'synced',
  last_synced_at TEXT,
  remote_updated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(survey_id, version)
);
```

**Campos Clave**:

- `survey_id` + `version`: Combinación única para cada versión de encuesta
- `schema_json`: Schema completo en formato `SurveySchema` (JSON)
- `is_active`: Solo las encuestas activas se muestran en la app
- `sync_status`: Estado de sincronización con servidor

**Índices**:

- `idx_surveys_survey_id`
- `idx_surveys_category`
- `idx_surveys_is_active`
- `idx_surveys_sync_status`

---

### 2. 📝 `responses`

**Propósito**: Respuestas completas a encuestas con metadata y estado de sincronización.

```sql
CREATE TABLE responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id TEXT NOT NULL UNIQUE,            -- UUID inmutable
  survey_id TEXT NOT NULL,
  survey_version TEXT NOT NULL,                -- Versión exacta usada
  status TEXT NOT NULL DEFAULT 'draft',        -- draft|completed|validated|rejected
  answers_json TEXT NOT NULL DEFAULT '{}',     -- Record<string, Answer>

  -- Brigadista
  brigadista_user_id TEXT NOT NULL,
  brigadista_name TEXT NOT NULL,
  brigadista_role TEXT NOT NULL,

  -- Geolocalización
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  location_captured_at TEXT,

  -- Dispositivo
  device_platform TEXT NOT NULL,               -- android|ios|web
  device_os_version TEXT NOT NULL,
  device_app_version TEXT NOT NULL,

  -- Tiempos
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_seconds INTEGER,

  -- Validación
  validation_status TEXT DEFAULT 'pending',
  validated_by TEXT,
  validated_at TEXT,
  validation_notes TEXT,

  -- Sincronización
  sync_status TEXT DEFAULT 'pending',
  sync_attempts INTEGER DEFAULT 0,
  last_sync_attempt_at TEXT,
  last_synced_at TEXT,
  sync_error TEXT,

  -- Inmutabilidad
  offline_mode BOOLEAN DEFAULT 1,
  immutable BOOLEAN DEFAULT 0,
  integrity_hash TEXT,                         -- SHA-256

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id)
);
```

**Estados de Respuesta** (`status`):

- `draft`: Respuesta en progreso (puede editarse)
- `completed`: Respuesta completada (lista para validar)
- `validated`: Validada por coordinador
- `rejected`: Rechazada por coordinador

**Estados de Sincronización** (`sync_status`):

- `pending`: Pendiente de sincronizar
- `syncing`: Sincronización en progreso
- `synced`: Sincronizada correctamente
- `error`: Error en sincronización

**Estados de Validación** (`validation_status`):

- `pending`: Pendiente de validación
- `validated`: Validada ✅
- `rejected`: Rechazada ❌

**Índices**:

- `idx_responses_response_id`
- `idx_responses_survey_id`
- `idx_responses_status`
- `idx_responses_sync_status`
- `idx_responses_brigadista`
- `idx_responses_validation_status`
- `idx_responses_created_at`

---

### 3. 📁 `local_files`

**Propósito**: Archivos locales (fotos, INE, firmas) asociados a respuestas.

```sql
CREATE TABLE local_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL UNIQUE,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,

  -- Tipo de archivo
  file_type TEXT NOT NULL,                     -- photo|signature|ine_front|ine_back|file
  mime_type TEXT NOT NULL,

  -- Ubicación local
  local_uri TEXT NOT NULL,
  local_path TEXT,
  file_size INTEGER NOT NULL,
  filename TEXT NOT NULL,

  -- Thumbnail
  thumbnail_uri TEXT,
  thumbnail_size INTEGER,

  -- Metadata
  caption TEXT,
  quality REAL,
  width INTEGER,
  height INTEGER,

  -- OCR Data (para INE)
  ocr_data_json TEXT,                          -- IneOcrData
  ocr_confidence REAL,
  ocr_processed_at TEXT,

  -- Sincronización
  sync_status TEXT DEFAULT 'pending',
  remote_url TEXT,
  upload_progress REAL DEFAULT 0,
  last_sync_attempt_at TEXT,
  sync_error TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (response_id) REFERENCES responses(response_id) ON DELETE CASCADE
);
```

**Tipos de Archivo** (`file_type`):

- `photo`: Foto general
- `signature`: Firma digital
- `ine_front`: INE frontal
- `ine_back`: INE reverso
- `file`: Archivo genérico

**OCR Data**:

- `ocr_data_json`: Datos extraídos del INE (JSON)
- `ocr_confidence`: Nivel de confianza (0-1)
- `ocr_processed_at`: Timestamp de procesamiento

**Índices**:

- `idx_local_files_file_id`
- `idx_local_files_response_id`
- `idx_local_files_question_id`
- `idx_local_files_file_type`
- `idx_local_files_sync_status`

---

### 4. 🔄 `sync_queue`

**Propósito**: Cola de sincronización para operaciones pendientes con reintentos.

```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id TEXT NOT NULL UNIQUE,

  -- Tipo de operación
  operation_type TEXT NOT NULL,                -- create_response|upload_file|etc.

  -- Referencia
  entity_type TEXT NOT NULL,                   -- response|file|survey
  entity_id TEXT NOT NULL,

  -- Payload
  payload_json TEXT NOT NULL,

  -- Estado
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,                  -- 1=alta, 10=baja

  -- Reintentos
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TEXT,
  last_error TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  processed_at TEXT,
  completed_at TEXT
);
```

**Tipos de Operación** (`operation_type`):

- `create_response`: Crear respuesta en servidor
- `update_response`: Actualizar respuesta existente
- `upload_file`: Subir archivo al servidor
- `download_survey`: Descargar encuesta
- `validate_response`: Validar respuesta

**Prioridades**:

- `1-3`: Alta prioridad (respuestas completadas)
- `4-6`: Prioridad media (archivos)
- `7-10`: Baja prioridad (descargas)

**Índices**:

- `idx_sync_queue_status`
- `idx_sync_queue_priority`
- `idx_sync_queue_entity`
- `idx_sync_queue_next_retry`

---

### 5. 📜 `survey_versions`

**Propósito**: Historial de versiones de encuestas para auditoría.

```sql
CREATE TABLE survey_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id TEXT NOT NULL,
  version TEXT NOT NULL,
  schema_json TEXT NOT NULL,
  change_summary TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(survey_id, version),
  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id)
);
```

---

### 6. ⚙️ `app_settings`

**Propósito**: Configuración local de la app.

```sql
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_type TEXT NOT NULL,                    -- string|number|boolean|json
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**Settings por Defecto**:

- `last_sync_timestamp`: Última sincronización completa
- `offline_mode_enabled`: Modo offline habilitado
- `auto_sync_enabled`: Sincronización automática
- `sync_wifi_only`: Solo sincronizar con WiFi
- `current_user_id`: ID del usuario actual
- `current_user_name`: Nombre del usuario
- `current_user_role`: Rol del usuario
- `app_version`: Versión de la app
- `db_version`: Versión del schema de BD

---

### 7. 📝 `audit_log`

**Propósito**: Log de auditoría de todas las operaciones importantes.

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,                        -- create|update|delete|sync
  entity_type TEXT NOT NULL,                   -- response|file|survey
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  old_value_json TEXT,
  new_value_json TEXT,
  changes_summary TEXT,
  device_info TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);
```

**Acciones Auditadas**:

- `create`: Creación de entidad
- `update`: Actualización de entidad
- `delete`: Eliminación de entidad
- `sync`: Sincronización con servidor
- `sync_file`: Subida de archivo
- `validate`: Validación de respuesta

---

## 🔗 Relaciones

```
surveys (1) ←──→ (N) responses
   │
   └──→ (N) survey_versions

responses (1) ←──→ (N) local_files

responses (1) ←──→ (N) sync_queue (indirecta)

local_files (1) ←──→ (N) sync_queue (indirecta)
```

### Foreign Keys

1. **responses.survey_id** → **surveys.survey_id**
   - `ON DELETE RESTRICT` (no se puede borrar encuesta con respuestas)

2. **local_files.response_id** → **responses.response_id**
   - `ON DELETE CASCADE` (borrar archivos al borrar respuesta)

3. **survey_versions.survey_id** → **surveys.survey_id**
   - `ON DELETE CASCADE` (borrar versiones al borrar encuesta)

---

## ⚡ Índices y Optimización

### Estrategia de Indexación

1. **Índices en Primary Keys**: Automáticos
2. **Índices en Foreign Keys**: Para joins rápidos
3. **Índices en Estados**: Para filtros frecuentes
4. **Índices Compuestos**: Para queries complejas

### Índices Creados

| Tabla         | Índice                        | Columnas             | Uso                   |
| ------------- | ----------------------------- | -------------------- | --------------------- |
| `surveys`     | `idx_surveys_survey_id`       | `survey_id`          | Búsqueda por ID       |
| `surveys`     | `idx_surveys_category`        | `category`           | Filtro por categoría  |
| `surveys`     | `idx_surveys_is_active`       | `is_active`          | Encuestas activas     |
| `responses`   | `idx_responses_status`        | `status`             | Filtro por estado     |
| `responses`   | `idx_responses_sync_status`   | `sync_status`        | Pendientes de sync    |
| `responses`   | `idx_responses_brigadista`    | `brigadista_user_id` | Por usuario           |
| `responses`   | `idx_responses_created_at`    | `created_at DESC`    | Ordenación temporal   |
| `local_files` | `idx_local_files_response_id` | `response_id`        | Archivos de respuesta |
| `local_files` | `idx_local_files_sync_status` | `sync_status`        | Pendientes de subir   |
| `sync_queue`  | `idx_sync_queue_priority`     | `priority`           | Cola prioritaria      |
| `audit_log`   | `idx_audit_log_created_at`    | `created_at DESC`    | Log reciente          |

---

## 🔔 Triggers

### 1. Actualización Automática de Timestamps

```sql
CREATE TRIGGER update_responses_timestamp
AFTER UPDATE ON responses
FOR EACH ROW
BEGIN
  UPDATE responses SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

**Tablas con Trigger de Timestamp**:

- `surveys`
- `responses`
- `local_files`
- `sync_queue`
- `app_settings`

### 2. Auditoría Automática

#### Trigger: Creación de Respuestas

```sql
CREATE TRIGGER audit_response_create
AFTER INSERT ON responses
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, user_id, user_name, ...)
  VALUES ('create', 'response', NEW.response_id, ...);
END;
```

#### Trigger: Actualización de Respuestas

```sql
CREATE TRIGGER audit_response_update
AFTER UPDATE ON responses
FOR EACH ROW
WHEN OLD.answers_json != NEW.answers_json OR OLD.status != NEW.status
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, ...);
END;
```

#### Trigger: Sincronización de Archivos

```sql
CREATE TRIGGER audit_file_synced
AFTER UPDATE OF sync_status ON local_files
FOR EACH ROW
WHEN NEW.sync_status = 'synced' AND OLD.sync_status != 'synced'
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, ...);
END;
```

---

## 📊 Vistas

### 1. `v_responses_with_surveys`

Vista completa de respuestas con información de encuesta.

```sql
CREATE VIEW v_responses_with_surveys AS
SELECT
  r.id,
  r.response_id,
  r.status,
  r.sync_status,
  r.validation_status,
  r.brigadista_name,
  r.created_at,
  r.completed_at,
  r.duration_seconds,
  s.survey_id,
  s.version AS survey_version,
  s.title AS survey_title,
  s.category AS survey_category,
  r.latitude,
  r.longitude,
  (SELECT COUNT(*) FROM local_files WHERE response_id = r.response_id) AS files_count,
  (SELECT COUNT(*) FROM local_files WHERE response_id = r.response_id AND sync_status != 'synced') AS pending_files_count
FROM responses r
INNER JOIN surveys s ON r.survey_id = s.survey_id AND r.survey_version = s.version;
```

**Uso**:

```sql
SELECT * FROM v_responses_with_surveys WHERE status = 'completed';
```

### 2. `v_sync_status`

Estado de sincronización general.

```sql
CREATE VIEW v_sync_status AS
SELECT
  'responses' AS entity_type,
  COUNT(*) AS total,
  SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN sync_status = 'syncing' THEN 1 ELSE 0 END) AS syncing,
  SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) AS synced,
  SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) AS error
FROM responses
UNION ALL
SELECT 'files' AS entity_type, ...
FROM local_files;
```

**Uso**:

```sql
SELECT * FROM v_sync_status;
```

### 3. `v_brigadista_stats`

Estadísticas por brigadista.

```sql
CREATE VIEW v_brigadista_stats AS
SELECT
  brigadista_user_id,
  brigadista_name,
  COUNT(*) AS total_responses,
  SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) AS validated_count,
  AVG(duration_seconds) AS avg_duration_seconds,
  MIN(created_at) AS first_response_at,
  MAX(created_at) AS last_response_at
FROM responses
GROUP BY brigadista_user_id, brigadista_name;
```

---

## 🔍 Queries Comunes

### 1. Respuestas Pendientes de Sincronizar

```sql
SELECT * FROM responses
WHERE sync_status = 'pending'
ORDER BY created_at;
```

### 2. Archivos Pendientes de Subir

```sql
SELECT * FROM local_files
WHERE sync_status = 'pending'
ORDER BY created_at;
```

### 3. Respuestas de Hoy

```sql
SELECT * FROM v_responses_with_surveys
WHERE date(created_at) = date('now', 'localtime');
```

### 4. Estado General de Sincronización

```sql
SELECT * FROM v_sync_status;
```

### 5. Respuestas con INE

```sql
SELECT r.*, f.*
FROM responses r
INNER JOIN local_files f ON r.response_id = f.response_id
WHERE f.file_type IN ('ine_front', 'ine_back');
```

### 6. Cola de Sincronización Prioritaria

```sql
SELECT * FROM sync_queue
WHERE status = 'pending'
ORDER BY priority ASC, created_at ASC
LIMIT 10;
```

### 7. Auditoría de una Respuesta

```sql
SELECT * FROM audit_log
WHERE entity_type = 'response' AND entity_id = :response_id
ORDER BY created_at DESC;
```

### 8. Respuestas que Requieren Validación

```sql
SELECT * FROM v_responses_with_surveys
WHERE validation_status = 'pending' AND status = 'completed'
ORDER BY completed_at ASC;
```

### 9. Respuestas con Errores de Sincronización

```sql
SELECT * FROM responses
WHERE sync_status = 'error'
ORDER BY last_sync_attempt_at DESC;
```

### 10. Archivos por Tipo

```sql
SELECT
  file_type,
  COUNT(*) AS count,
  SUM(file_size) AS total_size_bytes,
  AVG(ocr_confidence) AS avg_ocr_confidence
FROM local_files
GROUP BY file_type;
```

---

## 🔄 Migración y Versionado

### Estrategia de Versiones

El schema usa versionado semántico en `app_settings.db_version`:

```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     └── Cambios menores (índices, optimización)
  |     └──────── Nuevas columnas opcionales
  └────────────── Cambios breaking (eliminar columnas, cambiar tipos)
```

### Ejemplo de Migración

#### Migración 1.0.0 → 1.1.0

```sql
-- Añadir columna opcional a responses
ALTER TABLE responses ADD COLUMN supervisor_notes TEXT;

-- Actualizar versión
UPDATE app_settings SET value = '1.1.0' WHERE key = 'db_version';
```

#### Migración 1.1.0 → 2.0.0 (Breaking)

```sql
-- Backup de datos
CREATE TABLE responses_backup AS SELECT * FROM responses;

-- Recrear tabla con cambios
DROP TABLE responses;
CREATE TABLE responses (...);

-- Migrar datos
INSERT INTO responses SELECT ... FROM responses_backup;

-- Actualizar versión
UPDATE app_settings SET value = '2.0.0' WHERE key = 'db_version';
```

---

## 📝 Notas de Implementación

### Con Drizzle ORM

```typescript
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const expoDb = openDatabaseSync("brigada.db");
const db = drizzle(expoDb);

// Ejecutar schema
const schema = await fetch("/lib/db/schema.sql").then((r) => r.text());
expoDb.execSync(schema);
```

### Inicialización

1. Crear base de datos
2. Ejecutar `schema.sql`
3. Verificar `db_version` en `app_settings`
4. Cargar encuestas iniciales

### Mantenimiento

- **Vacuum**: Ejecutar periódicamente para optimizar
- **Analyze**: Actualizar estadísticas de índices
- **Backup**: Exportar BD antes de migraciones

---

## 🎯 Mejores Prácticas

1. ✅ **Siempre usar transacciones** para operaciones múltiples
2. ✅ **Validar JSON** antes de insertar en columnas `*_json`
3. ✅ **Usar prepared statements** para prevenir SQL injection
4. ✅ **Índices selectivos** solo en columnas con queries frecuentes
5. ✅ **Cleanup periódico** de `audit_log` (mantener últimos 90 días)
6. ✅ **Backup antes de migraciones**
7. ✅ **Testing de constraints** en desarrollo

---

## 📚 Referencias

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - Formato de encuestas
- [survey-schema.types.ts](../types/survey-schema.types.ts) - Tipos TypeScript

---

**Última actualización**: Febrero 2026  
**Versión del Schema**: 1.0.0
