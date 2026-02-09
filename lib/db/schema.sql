-- ============================================================================
-- SCHEMA DE BASE DE DATOS SQLITE - APP MÓVIL BRIGADA
-- ============================================================================
-- 
-- Descripción: Schema completo para app móvil offline-first
-- Features: 
--   - Encuestas dinámicas versionadas
--   - Respuestas con metadata completa
--   - Sincronización bidireccional
--   - Archivos locales (fotos, INE, firmas)
--   - Auditoría completa
--
-- Convenciones:
--   - Todas las tablas tienen id (INTEGER PRIMARY KEY AUTOINCREMENT)
--   - Timestamps en formato ISO 8601 (TEXT)
--   - JSON almacenado como TEXT
--   - Estados con CHECK constraints
--   - Índices para queries frecuentes
--
-- ============================================================================

-- ============================================================================
-- TABLA: surveys
-- Descripción: Catálogo de encuestas disponibles (schemas JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identificación
  survey_id TEXT NOT NULL UNIQUE,              -- UUID del schema (ej: "censo-2026-v1")
  version TEXT NOT NULL,                       -- Versión semántica (ej: "1.0.0")
  title TEXT NOT NULL,                         -- Título de la encuesta
  description TEXT,                            -- Descripción opcional
  category TEXT NOT NULL,                      -- Categoría (censo, salud, etc.)
  
  -- Schema JSON completo
  schema_json TEXT NOT NULL,                   -- SurveySchema completo en JSON
  
  -- Metadata
  author TEXT NOT NULL,                        -- Autor/creador
  estimated_duration INTEGER NOT NULL,         -- Duración estimada (minutos)
  tags TEXT,                                   -- Tags JSON array
  
  -- Estado
  is_active BOOLEAN DEFAULT 1,                 -- ¿Está activa para usar?
  is_published BOOLEAN DEFAULT 0,              -- ¿Está publicada?
  
  -- Sincronización
  sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('pending', 'syncing', 'synced', 'error')),
  last_synced_at TEXT,                         -- Última sincronización
  remote_updated_at TEXT,                      -- Última actualización en servidor
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Constraints
  UNIQUE(survey_id, version)                   -- Combinación única
);

-- Índices para surveys
CREATE INDEX IF NOT EXISTS idx_surveys_survey_id ON surveys(survey_id);
CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_sync_status ON surveys(sync_status);


-- ============================================================================
-- TABLA: survey_versions
-- Descripción: Historial de versiones de encuestas (para auditoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS survey_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  survey_id TEXT NOT NULL,                     -- ID de la encuesta
  version TEXT NOT NULL,                       -- Versión
  schema_json TEXT NOT NULL,                   -- Schema completo
  change_summary TEXT,                         -- Resumen de cambios
  
  -- Metadata
  created_by TEXT NOT NULL,                    -- Quién creó esta versión
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Constraints
  UNIQUE(survey_id, version),
  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_survey_versions_survey_id ON survey_versions(survey_id);


-- ============================================================================
-- TABLA: responses
-- Descripción: Respuestas completas a encuestas
-- ============================================================================
CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identificación
  response_id TEXT NOT NULL UNIQUE,            -- UUID único (inmutable)
  survey_id TEXT NOT NULL,                     -- ID de la encuesta
  survey_version TEXT NOT NULL,                -- Versión exacta usada
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'completed', 'validated', 'rejected')),
  
  -- Respuestas (JSON)
  answers_json TEXT NOT NULL DEFAULT '{}',     -- Record<string, Answer>
  
  -- Metadata del brigadista
  brigadista_user_id TEXT NOT NULL,            -- ID del usuario
  brigadista_name TEXT NOT NULL,               -- Nombre del brigadista
  brigadista_role TEXT NOT NULL,               -- Rol (brigadista, coordinador)
  
  -- Geolocalización
  latitude REAL,                               -- Latitud capturada
  longitude REAL,                              -- Longitud capturada
  accuracy REAL,                               -- Precisión GPS (metros)
  location_captured_at TEXT,                   -- Timestamp GPS
  
  -- Dispositivo
  device_platform TEXT NOT NULL,               -- android, ios, web
  device_os_version TEXT NOT NULL,             -- Versión del SO
  device_app_version TEXT NOT NULL,            -- Versión de la app
  
  -- Tiempos
  started_at TEXT NOT NULL,                    -- Inicio de la encuesta
  completed_at TEXT,                           -- Completado
  duration_seconds INTEGER,                    -- Duración total
  
  -- Validación
  validation_status TEXT DEFAULT 'pending' CHECK(validation_status IN ('pending', 'validated', 'rejected')),
  validated_by TEXT,                           -- User ID del validador
  validated_at TEXT,                           -- Fecha de validación
  validation_notes TEXT,                       -- Notas de validación
  
  -- Sincronización
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending', 'syncing', 'synced', 'error')),
  sync_attempts INTEGER DEFAULT 0,             -- Intentos de sincronización
  last_sync_attempt_at TEXT,                   -- Último intento
  last_synced_at TEXT,                         -- Última sincronización exitosa
  sync_error TEXT,                             -- Error de sincronización
  
  -- Modo offline
  offline_mode BOOLEAN DEFAULT 1,              -- Creada offline
  
  -- Inmutabilidad
  immutable BOOLEAN DEFAULT 0,                 -- true = no editable
  integrity_hash TEXT,                         -- SHA-256 para verificación
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Constraints
  FOREIGN KEY (survey_id) REFERENCES surveys(survey_id) ON DELETE RESTRICT
);

-- Índices para responses
CREATE INDEX IF NOT EXISTS idx_responses_response_id ON responses(response_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_sync_status ON responses(sync_status);
CREATE INDEX IF NOT EXISTS idx_responses_brigadista ON responses(brigadista_user_id);
CREATE INDEX IF NOT EXISTS idx_responses_validation_status ON responses(validation_status);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);


-- ============================================================================
-- TABLA: local_files
-- Descripción: Archivos locales (fotos, INE, firmas) asociados a respuestas
-- ============================================================================
CREATE TABLE IF NOT EXISTS local_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identificación
  file_id TEXT NOT NULL UNIQUE,                -- UUID del archivo
  response_id TEXT NOT NULL,                   -- ID de la respuesta
  question_id TEXT NOT NULL,                   -- ID de la pregunta
  
  -- Tipo de archivo
  file_type TEXT NOT NULL CHECK(file_type IN ('photo', 'signature', 'ine_front', 'ine_back', 'file')),
  mime_type TEXT NOT NULL,                     -- Tipo MIME
  
  -- Ubicación local
  local_uri TEXT NOT NULL,                     -- URI local del archivo
  local_path TEXT,                             -- Path absoluto (opcional)
  file_size INTEGER NOT NULL,                  -- Tamaño en bytes
  filename TEXT NOT NULL,                      -- Nombre del archivo
  
  -- Thumbnail/preview
  thumbnail_uri TEXT,                          -- URI del thumbnail
  thumbnail_size INTEGER,                      -- Tamaño del thumbnail
  
  -- Metadata
  caption TEXT,                                -- Descripción/caption
  quality REAL,                                -- Calidad de imagen (0-1)
  width INTEGER,                               -- Ancho en pixels
  height INTEGER,                              -- Alto en pixels
  
  -- OCR Data (para INE)
  ocr_data_json TEXT,                          -- IneOcrData en JSON
  ocr_confidence REAL,                         -- Confianza del OCR (0-1)
  ocr_processed_at TEXT,                       -- Timestamp procesamiento OCR
  
  -- Sincronización
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending', 'uploading', 'synced', 'error')),
  remote_url TEXT,                             -- URL después de subir
  upload_progress REAL DEFAULT 0,              -- Progreso de subida (0-1)
  last_sync_attempt_at TEXT,                   -- Último intento
  sync_error TEXT,                             -- Error de sincronización
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Constraints
  FOREIGN KEY (response_id) REFERENCES responses(response_id) ON DELETE CASCADE
);

-- Índices para local_files
CREATE INDEX IF NOT EXISTS idx_local_files_file_id ON local_files(file_id);
CREATE INDEX IF NOT EXISTS idx_local_files_response_id ON local_files(response_id);
CREATE INDEX IF NOT EXISTS idx_local_files_question_id ON local_files(question_id);
CREATE INDEX IF NOT EXISTS idx_local_files_file_type ON local_files(file_type);
CREATE INDEX IF NOT EXISTS idx_local_files_sync_status ON local_files(sync_status);


-- ============================================================================
-- TABLA: sync_queue
-- Descripción: Cola de sincronización para operaciones pendientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identificación
  queue_id TEXT NOT NULL UNIQUE,               -- UUID de la operación
  
  -- Tipo de operación
  operation_type TEXT NOT NULL CHECK(operation_type IN (
    'create_response', 
    'update_response', 
    'upload_file', 
    'download_survey',
    'validate_response'
  )),
  
  -- Referencia
  entity_type TEXT NOT NULL CHECK(entity_type IN ('response', 'file', 'survey')),
  entity_id TEXT NOT NULL,                     -- ID de la entidad
  
  -- Payload
  payload_json TEXT NOT NULL,                  -- Datos de la operación
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,                  -- Prioridad (1=alta, 10=baja)
  
  -- Reintentos
  retry_count INTEGER DEFAULT 0,               -- Intentos realizados
  max_retries INTEGER DEFAULT 3,               -- Máximo de reintentos
  next_retry_at TEXT,                          -- Próximo intento
  last_error TEXT,                             -- Último error
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,                           -- Fecha de procesamiento
  completed_at TEXT                            -- Fecha de completado
);

-- Índices para sync_queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_next_retry ON sync_queue(next_retry_at);


-- ============================================================================
-- TABLA: app_settings
-- Descripción: Configuración local de la app
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  key TEXT NOT NULL UNIQUE,                    -- Clave única
  value TEXT,                                  -- Valor (JSON si es complejo)
  value_type TEXT NOT NULL CHECK(value_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,                            -- Descripción del setting
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings por defecto
INSERT OR IGNORE INTO app_settings (key, value, value_type, description) VALUES
  ('last_sync_timestamp', NULL, 'string', 'Timestamp de última sincronización completa'),
  ('offline_mode_enabled', 'true', 'boolean', 'Modo offline habilitado'),
  ('auto_sync_enabled', 'true', 'boolean', 'Sincronización automática'),
  ('sync_wifi_only', 'true', 'boolean', 'Solo sincronizar con WiFi'),
  ('current_user_id', NULL, 'string', 'ID del usuario actual'),
  ('current_user_name', NULL, 'string', 'Nombre del usuario actual'),
  ('current_user_role', NULL, 'string', 'Rol del usuario actual'),
  ('app_version', NULL, 'string', 'Versión de la app'),
  ('db_version', '1.0.0', 'string', 'Versión del schema de BD');


-- ============================================================================
-- TABLA: audit_log
-- Descripción: Log de auditoría de todas las operaciones importantes
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Acción
  action TEXT NOT NULL,                        -- create, update, delete, sync, etc.
  entity_type TEXT NOT NULL,                   -- response, file, survey, etc.
  entity_id TEXT NOT NULL,                     -- ID de la entidad
  
  -- Usuario
  user_id TEXT NOT NULL,                       -- ID del usuario
  user_name TEXT NOT NULL,                     -- Nombre del usuario
  
  -- Cambios
  old_value_json TEXT,                         -- Valor anterior (JSON)
  new_value_json TEXT,                         -- Valor nuevo (JSON)
  changes_summary TEXT,                        -- Resumen de cambios
  
  -- Metadata
  device_info TEXT,                            -- Info del dispositivo
  ip_address TEXT,                             -- IP (si disponible)
  
  -- Auditoría
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);


-- ============================================================================
-- TRIGGERS - ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- ============================================================================

-- Trigger para surveys
CREATE TRIGGER IF NOT EXISTS update_surveys_timestamp 
AFTER UPDATE ON surveys
FOR EACH ROW
BEGIN
  UPDATE surveys SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para responses
CREATE TRIGGER IF NOT EXISTS update_responses_timestamp 
AFTER UPDATE ON responses
FOR EACH ROW
BEGIN
  UPDATE responses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para local_files
CREATE TRIGGER IF NOT EXISTS update_local_files_timestamp 
AFTER UPDATE ON local_files
FOR EACH ROW
BEGIN
  UPDATE local_files SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para sync_queue
CREATE TRIGGER IF NOT EXISTS update_sync_queue_timestamp 
AFTER UPDATE ON sync_queue
FOR EACH ROW
BEGIN
  UPDATE sync_queue SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para app_settings
CREATE TRIGGER IF NOT EXISTS update_app_settings_timestamp 
AFTER UPDATE ON app_settings
FOR EACH ROW
BEGIN
  UPDATE app_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;


-- ============================================================================
-- TRIGGERS - AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Auditar creación de respuestas
CREATE TRIGGER IF NOT EXISTS audit_response_create
AFTER INSERT ON responses
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, user_id, user_name, new_value_json, changes_summary)
  VALUES (
    'create',
    'response',
    NEW.response_id,
    NEW.brigadista_user_id,
    NEW.brigadista_name,
    json_object(
      'survey_id', NEW.survey_id,
      'survey_version', NEW.survey_version,
      'status', NEW.status
    ),
    'Respuesta creada'
  );
END;

-- Auditar actualización de respuestas
CREATE TRIGGER IF NOT EXISTS audit_response_update
AFTER UPDATE ON responses
FOR EACH ROW
WHEN OLD.answers_json != NEW.answers_json OR OLD.status != NEW.status
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, user_id, user_name, old_value_json, new_value_json, changes_summary)
  VALUES (
    'update',
    'response',
    NEW.response_id,
    NEW.brigadista_user_id,
    NEW.brigadista_name,
    json_object('status', OLD.status),
    json_object('status', NEW.status),
    CASE 
      WHEN OLD.status != NEW.status THEN 'Estado cambiado: ' || OLD.status || ' → ' || NEW.status
      ELSE 'Respuestas actualizadas'
    END
  );
END;

-- Auditar subida de archivos
CREATE TRIGGER IF NOT EXISTS audit_file_synced
AFTER UPDATE OF sync_status ON local_files
FOR EACH ROW
WHEN NEW.sync_status = 'synced' AND OLD.sync_status != 'synced'
BEGIN
  INSERT INTO audit_log (action, entity_type, entity_id, user_id, user_name, changes_summary)
  SELECT 
    'sync_file',
    'file',
    NEW.file_id,
    r.brigadista_user_id,
    r.brigadista_name,
    'Archivo sincronizado: ' || NEW.filename
  FROM responses r
  WHERE r.response_id = NEW.response_id;
END;


-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Respuestas con información de encuesta
CREATE VIEW IF NOT EXISTS v_responses_with_surveys AS
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

-- Vista: Estado de sincronización general
CREATE VIEW IF NOT EXISTS v_sync_status AS
SELECT 
  'responses' AS entity_type,
  COUNT(*) AS total,
  SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN sync_status = 'syncing' THEN 1 ELSE 0 END) AS syncing,
  SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) AS synced,
  SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) AS error
FROM responses
UNION ALL
SELECT 
  'files' AS entity_type,
  COUNT(*) AS total,
  SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN sync_status = 'uploading' THEN 1 ELSE 0 END) AS syncing,
  SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) AS synced,
  SUM(CASE WHEN sync_status = 'error' THEN 1 ELSE 0 END) AS error
FROM local_files;

-- Vista: Estadísticas por brigadista
CREATE VIEW IF NOT EXISTS v_brigadista_stats AS
SELECT 
  brigadista_user_id,
  brigadista_name,
  COUNT(*) AS total_responses,
  SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) AS validated_count,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
  AVG(duration_seconds) AS avg_duration_seconds,
  MIN(created_at) AS first_response_at,
  MAX(created_at) AS last_response_at
FROM responses
GROUP BY brigadista_user_id, brigadista_name;


-- ============================================================================
-- QUERIES ÚTILES DE EJEMPLO
-- ============================================================================

-- Query 1: Respuestas pendientes de sincronizar
-- SELECT * FROM responses WHERE sync_status = 'pending' ORDER BY created_at;

-- Query 2: Archivos pendientes de subir
-- SELECT * FROM local_files WHERE sync_status = 'pending' ORDER BY created_at;

-- Query 3: Respuestas de hoy
-- SELECT * FROM v_responses_with_surveys 
-- WHERE date(created_at) = date('now', 'localtime');

-- Query 4: Estado general de sincronización
-- SELECT * FROM v_sync_status;

-- Query 5: Respuestas con archivos INE
-- SELECT r.*, f.* 
-- FROM responses r
-- INNER JOIN local_files f ON r.response_id = f.response_id
-- WHERE f.file_type IN ('ine_front', 'ine_back');

-- Query 6: Cola de sincronización prioritaria
-- SELECT * FROM sync_queue 
-- WHERE status = 'pending' 
-- ORDER BY priority ASC, created_at ASC 
-- LIMIT 10;

-- Query 7: Auditoría de una respuesta específica
-- SELECT * FROM audit_log 
-- WHERE entity_type = 'response' AND entity_id = :response_id 
-- ORDER BY created_at DESC;

-- Query 8: Respuestas que requieren validación
-- SELECT * FROM v_responses_with_surveys 
-- WHERE validation_status = 'pending' AND status = 'completed'
-- ORDER BY completed_at ASC;


-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
