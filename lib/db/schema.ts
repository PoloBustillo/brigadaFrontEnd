/**
 * Database Schema - Brigada Digital
 * Scripts SQL para crear y migrar la base de datos SQLite
 */

import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ==================== VERSION CONTROL ====================

export const CURRENT_DB_VERSION = 2;
export const DB_NAME = "brigada_digital.db";

// ==================== CREATE TABLES ====================

/**
 * Tabla: users
 * Almacena usuarios del sistema con roles y estados
 */
export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ENCARGADO', 'BRIGADISTA')),
    state TEXT NOT NULL CHECK(state IN ('INVITED', 'PENDING', 'ACTIVE', 'DISABLED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT,
    created_by TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );
`;

/**
 * Tabla: invitations
 * Códigos de activación con expiración de 7 días
 */
export const CREATE_INVITATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ENCARGADO', 'BRIGADISTA')),
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'ACTIVATED', 'EXPIRED', 'REVOKED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    activated_at TEXT,
    activated_by TEXT,
    created_by TEXT NOT NULL,
    FOREIGN KEY (activated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );
`;

/**
 * Tabla: whitelist
 * Lista de usuarios autorizados (sincronizada del servidor)
 */
export const CREATE_WHITELIST_TABLE = `
  CREATE TABLE IF NOT EXISTS whitelist (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ENCARGADO', 'BRIGADISTA')),
    is_active INTEGER NOT NULL DEFAULT 1,
    last_sync_at TEXT NOT NULL,
    synced_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

/**
 * Tabla: audit_logs
 * Registro de auditoría de acciones del sistema
 */
export const CREATE_AUDIT_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_to_server INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`;

// ==================== ASSIGNMENT TABLES ====================

/**
 * Tabla: survey_assignments
 * Asignación explícita de encuestas a Encargados
 * Un Encargado SOLO ve encuestas que le fueron asignadas
 */
export const CREATE_SURVEY_ASSIGNMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS survey_assignments (
    id TEXT PRIMARY KEY NOT NULL,
    survey_schema_id TEXT NOT NULL,
    encargado_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (encargado_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(survey_schema_id, encargado_id)
  );
`;

/**
 * Tabla: brigadista_assignments
 * Asignación de Brigadistas a encuestas específicas DENTRO del scope del Encargado
 * Un Brigadista SOLO puede llenar encuestas que le asignó su Encargado
 */
export const CREATE_BRIGADISTA_ASSIGNMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS brigadista_assignments (
    id TEXT PRIMARY KEY NOT NULL,
    survey_schema_id TEXT NOT NULL,
    brigadista_id TEXT NOT NULL,
    encargado_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    target_count INTEGER,
    notes TEXT,
    FOREIGN KEY (brigadista_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (encargado_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(survey_schema_id, brigadista_id)
  );
`;

/**
 * Tabla: team_memberships
 * Define qué Brigadistas pertenecen al equipo de un Encargado
 * Necesario para que Encargado pueda asignar encuestas
 */
export const CREATE_TEAM_MEMBERSHIPS_TABLE = `
  CREATE TABLE IF NOT EXISTS team_memberships (
    id TEXT PRIMARY KEY NOT NULL,
    encargado_id TEXT NOT NULL,
    brigadista_id TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    removed_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    role_description TEXT,
    FOREIGN KEY (encargado_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (brigadista_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(encargado_id, brigadista_id)
  );
`;

/**
 * Tabla: survey_responses
 * Instancias de encuestas completadas
 * UNA ENCUESTA = UNA PERSONA ENCUESTADA
 */
export const CREATE_SURVEY_RESPONSES_TABLE = `
  CREATE TABLE IF NOT EXISTS survey_responses (
    id TEXT PRIMARY KEY NOT NULL, // UUID generado localmente

    // Relación con schema
    schema_id TEXT NOT NULL REFERENCES survey_schemas(id),
    schema_version INTEGER NOT NULL,

    // Quién levantó la encuesta
    collected_by TEXT NOT NULL REFERENCES users(id),

    // Estado de la encuesta
    status TEXT NOT NULL DEFAULT 'in_progress',

    // Progreso (% de preguntas respondidas)
    progress REAL NOT NULL DEFAULT 0, // 0.0 a 1.0

    // ============ TIMESTAMPS ============
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    synced_at INTEGER,

    // Duración total en segundos (calculado al completar)
    duration INTEGER, // segundos entre startedAt y completedAt

    // ============ INFORMACIÓN DEL ENCUESTADO (OPCIONAL) ============
    // NOTA: Estos campos son redundantes si la encuesta captura esta info en preguntas.
    // Solo usar si necesitas acceso rápido sin parsear respuestas.
    respondent_name TEXT, // Nombre de la persona encuestada
    respondent_phone TEXT, // Teléfono de contacto
    respondent_email TEXT, // Email opcional

    // ============ GEOLOCALIZACIÓN ============
    latitude REAL,
    longitude REAL,
    accuracy REAL, // precisión en metros
    location_captured_at INTEGER,
    address TEXT, // Dirección legible (si hay geocoding)

    // ============ METADATA DEL DISPOSITIVO ============
    device_info TEXT { mode: "json" },

    // ============ NOTAS Y OBSERVACIONES ============
    notes TEXT, // Comentarios del brigadista
    tags TEXT { mode: "json" }, // ["urgente", "seguimiento"]

    // ============ VALIDACIÓN Y AUDITORÍA ============
    is_validated INTEGER DEFAULT 0,
    validated_by TEXT REFERENCES users(id),
    validated_at INTEGER,

    // ============ ERROR DE SINCRONIZACIÓN ============
    sync_error TEXT,
    sync_retries INTEGER NOT NULL DEFAULT 0
  );
`;

/**
 * Tabla: question_answers
 * Cada fila = una respuesta a una pregunta específica
 * Se guarda INMEDIATAMENTE al responder
 */
export const CREATE_QUESTION_ANSWERS_TABLE = `
  CREATE TABLE IF NOT EXISTS question_answers (
    id TEXT PRIMARY KEY NOT NULL, // UUID generado localmente

    // Relación con la encuesta
    response_id TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,

    // Identificador de la pregunta en el schema
    question_id TEXT NOT NULL, // Del JSON schema
    question_path TEXT NOT NULL, // e.g., "seccion1.pregunta2"

    // Tipo de pregunta (para parsing correcto)
    question_type TEXT NOT NULL,

    // Valor de la respuesta (JSON flexible)
    value TEXT NOT NULL,

    // Para archivos (fotos, firmas, INE)
    file_uri TEXT, // URI local del archivo
    file_name TEXT,
    file_synced INTEGER DEFAULT 0,

    // Metadata
    answered_at INTEGER NOT NULL DEFAULT (unixepoch()),
    synced_at INTEGER
  );
`;

/**
 * Tabla: attachments
 * Gestión de archivos binarios
 * Se almacenan en FileSystem y se referencian aquí
 */
export const CREATE_ATTACHMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL, // UUID generado localmente

    // Relación
    response_id TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, // Para qué pregunta es el archivo

    // Tipo de archivo
    type TEXT NOT NULL,

    // Ubicación local
    local_uri TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,

    // Hash para detección de duplicados
    sha256 TEXT,

    // OCR data (solo para INE)
    ocr_data TEXT { mode: "json" },
    ocr_confirmed INTEGER DEFAULT 0,

    // Estado de sincronización
    uploaded INTEGER NOT NULL DEFAULT 0,
    uploaded_at INTEGER,
    upload_url TEXT, // URL del servidor después de subir

    // Metadata
    captured_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`;

/**
 * Tabla: sync_queue
 * Cola para sincronización en background
 * Se procesa cuando hay conectividad
 */
export const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,

    // Tipo de operación
    operation TEXT NOT NULL,

    // Payload
    entity_type TEXT NOT NULL, // 'survey_response', 'attachment', etc.
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,

    // Estado
    status TEXT NOT NULL DEFAULT 'pending',

    // Prioridad (mayor = más prioritario)
    priority INTEGER NOT NULL DEFAULT 0,

    // Reintentos
    retries INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    // Error
    error TEXT,
    last_error TEXT,

    // Timestamps
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    processed_at INTEGER,
    completed_at INTEGER,

    // Backoff exponencial
    next_retry_at INTEGER
  );
`;

/**
 * Tabla: sync_metadata
 * Última sincronización exitosa de cada recurso
 */
export const CREATE_SYNC_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    id TEXT PRIMARY KEY NOT NULL,
    resource_type TEXT NOT NULL, // 'survey_schemas', 'users', etc.
    last_sync_at INTEGER NOT NULL,
    last_sync_hash TEXT, // Para detectar cambios
    status TEXT NOT NULL,
    error TEXT
  );
`;

// ==================== DRIZZLE ORM SCHEMAS ====================

/**
 * Tabla de usuarios - Definición Drizzle ORM
 * (para compatibilidad con código existente)
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["ADMIN", "ENCARGADO", "BRIGADISTA"] }).notNull(),
  state: text("state", {
    enum: ["INVITED", "PENDING", "ACTIVE", "DISABLED"],
  }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastLoginAt: text("last_login_at"),
  createdBy: text("created_by"),
});

// ============================================================================
// SCHEMAS DE ENCUESTAS (DEFINICIONES)
// ============================================================================

/**
 * Definiciones de encuestas - Versionadas y descargadas del servidor
 * Cada versión es inmutable una vez publicada
 */
export const surveySchemas = sqliteTable("survey_schemas", {
  id: text("id").primaryKey(), // UUID del servidor
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").notNull(), // v1, v2, v3...
  status: text("status", { enum: ["draft", "active", "archived"] })
    .notNull()
    .default("draft"),

  // Schema JSON completo
  schema: text("schema", { mode: "json" })
    .notNull()
    .$type<SurveySchemaDefinition>(),

  // Metadata
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  archivedAt: integer("archived_at", { mode: "timestamp" }),

  // Sincronización
  syncedAt: integer("synced_at", { mode: "timestamp" }),
});

// ============================================================================
// RESPUESTAS DE ENCUESTAS
// ============================================================================

/**
 * Instancias de encuestas completadas
 * UNA ENCUESTA = UNA PERSONA ENCUESTADA
 */
export const surveyResponses = sqliteTable("survey_responses", {
  id: text("id").primaryKey(), // UUID generado localmente

  // Relación con schema
  schemaId: text("schema_id")
    .notNull()
    .references(() => surveySchemas.id),
  schemaVersion: integer("schema_version").notNull(),

  // Quién levantó la encuesta
  collectedBy: text("collected_by")
    .notNull()
    .references(() => users.id),

  // Estado de la encuesta
  status: text("status", {
    enum: ["in_progress", "completed", "synced", "error"],
  })
    .notNull()
    .default("in_progress"),

  // Progreso (% de preguntas respondidas)
  progress: real("progress").notNull().default(0), // 0.0 a 1.0

  // ============ TIMESTAMPS ============
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  syncedAt: integer("synced_at", { mode: "timestamp" }),

  // Duración total en segundos (calculado al completar)
  duration: integer("duration"), // segundos entre startedAt y completedAt

  // ============ INFORMACIÓN DEL ENCUESTADO (OPCIONAL) ============
  // NOTA: Estos campos son redundantes si la encuesta captura esta info en preguntas.
  // Solo usar si necesitas acceso rápido sin parsear respuestas.
  respondentName: text("respondent_name"), // Nombre de la persona encuestada
  respondentPhone: text("respondent_phone"), // Teléfono de contacto
  respondentEmail: text("respondent_email"), // Email opcional

  // ============ GEOLOCALIZACIÓN ============
  latitude: real("latitude"),
  longitude: real("longitude"),
  accuracy: real("accuracy"), // precisión en metros
  locationCapturedAt: integer("location_captured_at", { mode: "timestamp" }),
  address: text("address"), // Dirección legible (si hay geocoding)

  // ============ METADATA DEL DISPOSITIVO ============
  deviceInfo: text("device_info", { mode: "json" }).$type<{
    model?: string; // "iPhone 14 Pro", "Samsung Galaxy S21"
    os?: string; // "iOS 17.2", "Android 14"
    appVersion?: string; // "1.2.3"
  }>(),

  // ============ NOTAS Y OBSERVACIONES ============
  notes: text("notes"), // Comentarios del brigadista
  tags: text("tags", { mode: "json" }).$type<string[]>(), // ["urgente", "seguimiento"]

  // ============ VALIDACIÓN Y AUDITORÍA ============
  isValidated: integer("is_validated", { mode: "boolean" }).default(false),
  validatedBy: text("validated_by").references(() => users.id),
  validatedAt: integer("validated_at", { mode: "timestamp" }),

  // ============ ERROR DE SINCRONIZACIÓN ============
  syncError: text("sync_error"),
  syncRetries: integer("sync_retries").notNull().default(0),
});

// ============================================================================
// RESPUESTAS INDIVIDUALES (PREGUNTA POR PREGUNTA)
// ============================================================================

/**
 * Cada fila = una respuesta a una pregunta específica
 * Se guarda INMEDIATAMENTE al responder
 */
export const questionAnswers = sqliteTable("question_answers", {
  id: text("id").primaryKey(), // UUID generado localmente

  // Relación con la encuesta
  responseId: text("response_id")
    .notNull()
    .references(() => surveyResponses.id, { onDelete: "cascade" }),

  // Identificador de la pregunta en el schema
  questionId: text("question_id").notNull(), // Del JSON schema
  questionPath: text("question_path").notNull(), // e.g., "seccion1.pregunta2"

  // Tipo de pregunta (para parsing correcto)
  questionType: text("question_type", {
    enum: [
      "text",
      "number",
      "date",
      "select",
      "multi_select",
      "boolean",
      "photo",
      "signature",
      "ine",
    ],
  }).notNull(),

  // Valor de la respuesta (JSON flexible)
  value: text("value", { mode: "json" }).notNull(),

  // Para archivos (fotos, firmas, INE)
  fileUri: text("file_uri"), // URI local del archivo
  fileName: text("file_name"),
  fileSynced: integer("file_synced", { mode: "boolean" }).default(false),

  // Metadata
  answeredAt: integer("answered_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  syncedAt: integer("synced_at", { mode: "timestamp" }),
});

// ============================================================================
// ARCHIVOS ADJUNTOS (FOTOS, INE, FIRMAS)
// ============================================================================

/**
 * Gestión de archivos binarios
 * Se almacenan en FileSystem y se referencian aquí
 */
export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(), // UUID generado localmente

  // Relación
  responseId: text("response_id")
    .notNull()
    .references(() => surveyResponses.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),

  // Tipo de archivo
  type: text("type", {
    enum: ["photo", "signature", "ine_front", "ine_back"],
  }).notNull(),

  // Ubicación local
  localUri: text("local_uri").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),

  // Hash para detección de duplicados
  sha256: text("sha256"),

  // OCR data (solo para INE)
  ocrData: text("ocr_data", { mode: "json" }).$type<INEOCRData | null>(),
  ocrConfirmed: integer("ocr_confirmed", { mode: "boolean" }).default(false),

  // Estado de sincronización
  uploaded: integer("uploaded", { mode: "boolean" }).notNull().default(false),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }),
  uploadUrl: text("upload_url"), // URL del servidor después de subir

  // Metadata
  capturedAt: integer("captured_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// COLA DE SINCRONIZACIÓN
// ============================================================================

/**
 * Cola para sincronización en background
 * Se procesa cuando hay conectividad
 */
export const syncQueue = sqliteTable("sync_queue", {
  id: text("id").primaryKey(),

  // Tipo de operación
  operation: text("operation", {
    enum: ["create_response", "upload_file", "update_status"],
  }).notNull(),

  // Payload
  entityType: text("entity_type").notNull(), // 'survey_response', 'attachment', etc.
  entityId: text("entity_id").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),

  // Estado
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),

  // Prioridad (mayor = más prioritario)
  priority: integer("priority").notNull().default(0),

  // Reintentos
  retries: integer("retries").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),

  // Error
  error: text("error"),
  lastError: text("last_error"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),

  // Backoff exponencial
  nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
});

// ============================================================================
// METADATA DE SINCRONIZACIÓN
// ============================================================================

/**
 * Última sincronización exitosa de cada recurso
 */
export const syncMetadata = sqliteTable("sync_metadata", {
  id: text("id").primaryKey(),
  resourceType: text("resource_type").notNull(), // 'survey_schemas', 'users', etc.
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }).notNull(),
  lastSyncHash: text("last_sync_hash"), // Para detectar cambios
  status: text("status", { enum: ["success", "error"] }).notNull(),
  error: text("error"),
});

// ============================================================================
// TYPES AUXILIARES
// ============================================================================

/**
 * Definición de schema de encuesta
 */
export type SurveySchemaDefinition = {
  version: number;
  title: string;
  description?: string;
  sections: {
    id: string;
    title: string;
    description?: string;
    order: number;
    questions: SurveyQuestion[];
  }[];
};

export type SurveyQuestion = {
  id: string;
  type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "multi_select"
    | "boolean"
    | "photo"
    | "signature"
    | "ine";
  label: string;
  description?: string;
  required: boolean;
  order: number;
  validation?: Record<string, any>;
  options?: { label: string; value: string }[];
  conditional?: {
    questionId: string;
    operator: "equals" | "not_equals" | "contains";
    value: any;
  };
};

/**
 * Datos extraídos del INE por OCR
 */
export type INEOCRData = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  claveElector: string;
  curp: string;
  fechaNacimiento: string;
  sexo: "H" | "M";
  vigencia: string;
  seccion: string;
  confidence: number; // 0.0 a 1.0
};

// ============================================================================
// INDICES PARA OPTIMIZACIÓN
// ============================================================================

// Los índices se crean en las migraciones, pero aquí los documentamos:
//
// CREATE INDEX idx_survey_responses_collected_by ON survey_responses(collected_by);
// CREATE INDEX idx_survey_responses_status ON survey_responses(status);
// CREATE INDEX idx_survey_responses_synced ON survey_responses(synced_at);
// CREATE INDEX idx_question_answers_response_id ON question_answers(response_id);
// CREATE INDEX idx_attachments_response_id ON attachments(response_id);
// CREATE INDEX idx_attachments_uploaded ON attachments(uploaded);
// CREATE INDEX idx_sync_queue_status_priority ON sync_queue(status, priority DESC);

// ==================== INDEXES PARA AUTENTICACIÓN ====================

/**
 * Índices para optimizar consultas frecuentes en tablas de auth
 */
export const CREATE_AUTH_INDEXES = [
  // Users - búsqueda por email y estado
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
  `CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);`,

  // Invitations - búsqueda por código y estado
  `CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);`,

  // Whitelist - búsqueda por usuario y email
  `CREATE INDEX IF NOT EXISTS idx_whitelist_user_id ON whitelist(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_whitelist_email ON whitelist(email);`,
  `CREATE INDEX IF NOT EXISTS idx_whitelist_is_active ON whitelist(is_active);`,

  // Audit Logs - búsqueda por usuario, acción y fecha
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_synced ON audit_logs(synced_to_server);`,
];

// ==================== ASSIGNMENT INDEXES ====================

/**
 * Índices para tablas de asignaciones
 */
export const CREATE_ASSIGNMENT_INDEXES = [
  // Survey Assignments - búsqueda por encargado y encuesta
  `CREATE INDEX IF NOT EXISTS idx_survey_assignments_encargado ON survey_assignments(encargado_id);`,
  `CREATE INDEX IF NOT EXISTS idx_survey_assignments_survey ON survey_assignments(survey_schema_id);`,
  `CREATE INDEX IF NOT EXISTS idx_survey_assignments_active ON survey_assignments(is_active);`,

  // Brigadista Assignments - búsqueda por brigadista, encargado y encuesta
  `CREATE INDEX IF NOT EXISTS idx_brigadista_assignments_brigadista ON brigadista_assignments(brigadista_id);`,
  `CREATE INDEX IF NOT EXISTS idx_brigadista_assignments_encargado ON brigadista_assignments(encargado_id);`,
  `CREATE INDEX IF NOT EXISTS idx_brigadista_assignments_survey ON brigadista_assignments(survey_schema_id);`,
  `CREATE INDEX IF NOT EXISTS idx_brigadista_assignments_active ON brigadista_assignments(is_active);`,

  // Team Memberships - búsqueda por encargado y brigadista
  `CREATE INDEX IF NOT EXISTS idx_team_memberships_encargado ON team_memberships(encargado_id);`,
  `CREATE INDEX IF NOT EXISTS idx_team_memberships_brigadista ON team_memberships(brigadista_id);`,
  `CREATE INDEX IF NOT EXISTS idx_team_memberships_active ON team_memberships(is_active);`,
];

// ==================== TRIGGERS ====================

/**
 * Trigger: Actualizar updated_at en users
 */
export const CREATE_USERS_UPDATED_TRIGGER = `
  CREATE TRIGGER IF NOT EXISTS users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
`;

/**
 * Query: Auto-expirar invitaciones antiguas
 * (Se ejecutará manualmente via función helper)
 */
export const EXPIRE_OLD_INVITATIONS = `
  UPDATE invitations 
  SET status = 'EXPIRED' 
  WHERE status = 'PENDING' 
    AND datetime(expires_at) < datetime('now');
`;

// ==================== SEED DATA ====================

/**
 * Datos iniciales: Admin por defecto
 * Password: "admin123" (debe cambiarse en producción)
 * Hash bcrypt generado con cost=10
 */
export const SEED_DEFAULT_ADMIN = `
  INSERT OR IGNORE INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    state,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@brigada.digital',
    '$2b$10$rBV2G9h0Hs6uIXa8Nw0GjOxEYX8yq1xFQ2Zp0wYvZxHqE6K8L9E8K',
    'Administrador Sistema',
    'ADMIN',
    'ACTIVE',
    datetime('now'),
    datetime('now')
  );
`;

// ==================== DROP TABLES ====================

/**
 * Scripts para eliminar tablas (útil para desarrollo)
 * ADVERTENCIA: Esto eliminará todos los datos
 */
export const DROP_AUTH_TABLES = [
  `DROP TABLE IF EXISTS audit_logs;`,
  `DROP TABLE IF EXISTS whitelist;`,
  `DROP TABLE IF EXISTS invitations;`,
  `DROP TABLE IF EXISTS users;`,
];

// ==================== MIGRATION HELPERS ====================

/**
 * Array con todas las tablas de auth a crear en orden
 */
export const ALL_AUTH_TABLES = [
  CREATE_USERS_TABLE,
  CREATE_INVITATIONS_TABLE,
  CREATE_WHITELIST_TABLE,
  CREATE_AUDIT_LOGS_TABLE,
  CREATE_SURVEY_ASSIGNMENTS_TABLE,
  CREATE_BRIGADISTA_ASSIGNMENTS_TABLE,
  CREATE_TEAM_MEMBERSHIPS_TABLE,
];

/**
 * Array con todos los triggers de auth
 */
export const ALL_AUTH_TRIGGERS = [CREATE_USERS_UPDATED_TRIGGER];

/**
 * Función helper para obtener la versión de la BD
 */
export const GET_DB_VERSION = `PRAGMA user_version;`;

/**
 * Función helper para establecer la versión de la BD
 */
export const SET_DB_VERSION = (version: number) =>
  `PRAGMA user_version = ${version};`;
