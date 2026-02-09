/**
 * 🔄 SISTEMA DE MIGRACIONES
 *
 * Gestiona las versiones del schema de la base de datos SQLite
 */

import { openDatabaseSync } from "expo-sqlite";

const DB_NAME = "brigada.db";

/**
 * Ejecuta todas las migraciones pendientes
 */
export async function runMigrations(): Promise<void> {
  const db = openDatabaseSync(DB_NAME);

  try {
    // Crear tabla de migraciones si no existe
    db.execSync(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Obtener versión actual
    const currentVersion = getCurrentVersion(db);
    console.log(`📊 Versión actual de BD: ${currentVersion}`);

    // Aplicar migraciones pendientes
    const migrations = getAllMigrations();
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(
          `⬆️  Aplicando migración v${migration.version}: ${migration.name}`,
        );
        await migration.up(db);
        recordMigration(db, migration.version, migration.name);
        console.log(`✅ Migración v${migration.version} aplicada`);
      }
    }

    console.log("✨ Todas las migraciones aplicadas correctamente");
  } catch (error) {
    console.error("❌ Error en migraciones:", error);
    throw error;
  }
}

/**
 * Obtiene la versión actual de la base de datos
 */
function getCurrentVersion(db: any): number {
  try {
    const result = db.getFirstSync(
      "SELECT MAX(version) as version FROM migrations",
    ) as { version: number } | null;
    return result?.version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Registra una migración aplicada
 */
function recordMigration(db: any, version: number, name: string): void {
  db.runSync("INSERT INTO migrations (version, name) VALUES (?, ?)", [
    version,
    name,
  ]);
}

/**
 * Define todas las migraciones disponibles
 */
function getAllMigrations(): Migration[] {
  return [migration_v1_initial_schema, migration_v2_add_survey_metadata];
}

// ============================================================================
// MIGRACIONES
// ============================================================================

interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void> | void;
}

/**
 * v1: Schema inicial
 */
const migration_v1_initial_schema: Migration = {
  version: 1,
  name: "initial_schema",
  up: (db) => {
    // Tabla de usuarios
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('admin', 'encargado', 'brigadista')),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        synced_at INTEGER
      );
    `);

    // Tabla de schemas de encuestas
    db.execSync(`
      CREATE TABLE IF NOT EXISTS survey_schemas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'archived')),
        schema TEXT NOT NULL,
        created_by TEXT REFERENCES users(id),
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        published_at INTEGER,
        archived_at INTEGER,
        synced_at INTEGER
      );
    `);

    // Tabla de respuestas de encuestas (VERSION INICIAL - v1)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        schema_id TEXT NOT NULL REFERENCES survey_schemas(id),
        schema_version INTEGER NOT NULL,
        collected_by TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'synced', 'error')),
        progress REAL NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL DEFAULT (unixepoch()),
        completed_at INTEGER,
        synced_at INTEGER,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        sync_error TEXT,
        sync_retries INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Tabla de respuestas individuales
    db.execSync(`
      CREATE TABLE IF NOT EXISTS question_answers (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL,
        question_path TEXT NOT NULL,
        question_type TEXT NOT NULL CHECK(question_type IN ('text', 'number', 'date', 'select', 'multi_select', 'boolean', 'photo', 'signature', 'ine')),
        value TEXT NOT NULL,
        file_uri TEXT,
        file_name TEXT,
        file_synced INTEGER DEFAULT 0,
        answered_at INTEGER NOT NULL DEFAULT (unixepoch()),
        synced_at INTEGER
      );
    `);

    // Tabla de attachments
    db.execSync(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('photo', 'signature', 'ine_front', 'ine_back')),
        file_uri TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        sha256 TEXT,
        width INTEGER,
        height INTEGER,
        ocr_data TEXT,
        is_compressed INTEGER NOT NULL DEFAULT 0,
        captured_at INTEGER NOT NULL DEFAULT (unixepoch()),
        synced INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        upload_url TEXT,
        upload_error TEXT
      );
    `);

    // Tabla de cola de sincronización
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('survey_response', 'attachment')),
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
        payload TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 5,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        last_error TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        processed_at INTEGER,
        next_retry_at INTEGER
      );
    `);

    // Tabla de metadata de sincronización
    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        last_synced_at INTEGER NOT NULL,
        server_version INTEGER,
        etag TEXT,
        UNIQUE(entity_type, entity_id)
      );
    `);

    // Índices para optimizar queries
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON survey_responses(status);
      CREATE INDEX IF NOT EXISTS idx_survey_responses_collected_by ON survey_responses(collected_by);
      CREATE INDEX IF NOT EXISTS idx_question_answers_response_id ON question_answers(response_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_response_id ON attachments(response_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, priority DESC);
    `);

    console.log("✅ Schema inicial v1 creado");
  },
};

/**
 * v2: Agregar metadata adicional a survey_responses
 * - duration (duración total)
 * - respondentName, respondentPhone, respondentEmail (info del encuestado)
 * - locationCapturedAt, address (geo mejorada)
 * - deviceInfo (metadata del dispositivo)
 * - notes, tags (observaciones)
 * - isValidated, validatedBy, validatedAt (auditoría)
 */
const migration_v2_add_survey_metadata: Migration = {
  version: 2,
  name: "add_survey_metadata",
  up: (db) => {
    console.log("⬆️  Agregando metadata adicional a survey_responses...");

    // Agregar columnas de duración
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN duration INTEGER;
    `);

    // Información del encuestado
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN respondent_name TEXT;
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN respondent_phone TEXT;
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN respondent_email TEXT;
    `);

    // Geolocalización mejorada
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN location_captured_at INTEGER;
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN address TEXT;
    `);

    // Metadata del dispositivo
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN device_info TEXT;
    `);

    // Notas y observaciones
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN notes TEXT;
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN tags TEXT;
    `);

    // Validación y auditoría
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN is_validated INTEGER DEFAULT 0;
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN validated_by TEXT REFERENCES users(id);
    `);
    db.execSync(`
      ALTER TABLE survey_responses ADD COLUMN validated_at INTEGER;
    `);

    console.log("✅ Metadata adicional agregada a survey_responses");
  },
};
