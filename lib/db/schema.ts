/**
 * 📊 SCHEMA DE BASE DE DATOS - OFFLINE FIRST
 *
 * Principios:
 * 1. Todo se guarda localmente primero
 * 2. IDs generados localmente (UUIDs)
 * 3. Timestamps para sincronización
 * 4. Estados claros de sincronización
 * 5. Soft deletes para auditabilidad
 */

import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ============================================================================
// USUARIOS Y AUTENTICACIÓN
// ============================================================================

/**
 * Tabla de usuarios - Sincronizada desde backend
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID del servidor
  role: text("role", { enum: ["admin", "encargado", "brigadista"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  // Metadata de sincronización
  syncedAt: integer("synced_at", { mode: "timestamp" }),
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
