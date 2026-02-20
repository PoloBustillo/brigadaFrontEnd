/**
 * Database Connection Manager
 *
 * Singleton para gestionar la conexión a SQLite con Expo SQLite.
 * Manages the "brigada.db" database that stores:
 * - surveys        → cached survey schemas
 * - responses      → offline-first survey responses
 * - local_files    → captured files (photos, INE, signatures) + Cloudinary sync
 * - sync_queue     → background sync queue with exponential backoff
 */

import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

// ── Table creation SQL ────────────────────────────────────────────────────────

const CREATE_SURVEYS_TABLE = `
  CREATE TABLE IF NOT EXISTS surveys (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id     TEXT    NOT NULL,
    version       TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    description   TEXT,
    category      TEXT    NOT NULL DEFAULT 'general',
    schema_json   TEXT    NOT NULL,
    author        TEXT    NOT NULL DEFAULT '',
    estimated_duration INTEGER NOT NULL DEFAULT 0,
    tags          TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    is_published  INTEGER NOT NULL DEFAULT 0,
    sync_status   TEXT    NOT NULL DEFAULT 'pending',
    last_synced_at TEXT,
    remote_updated_at TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(survey_id, version)
  );
`;

const CREATE_RESPONSES_TABLE = `
  CREATE TABLE IF NOT EXISTS responses (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id           TEXT    NOT NULL UNIQUE,
    survey_id             TEXT    NOT NULL,
    survey_version        TEXT    NOT NULL,
    status                TEXT    NOT NULL DEFAULT 'draft',  -- draft | completed | validated | rejected
    answers_json          TEXT    NOT NULL DEFAULT '{}',
    brigadista_user_id    TEXT    NOT NULL,
    brigadista_name       TEXT    NOT NULL DEFAULT '',
    brigadista_role       TEXT    NOT NULL DEFAULT 'brigadista',
    latitude              REAL,
    longitude             REAL,
    accuracy              REAL,
    location_captured_at  TEXT,
    device_platform       TEXT    NOT NULL DEFAULT '',
    device_os_version     TEXT    NOT NULL DEFAULT '',
    device_app_version    TEXT    NOT NULL DEFAULT '',
    started_at            TEXT    NOT NULL DEFAULT (datetime('now')),
    completed_at          TEXT,
    duration_seconds      INTEGER,
    validation_status     TEXT    NOT NULL DEFAULT 'pending',
    validated_by          TEXT,
    validated_at          TEXT,
    validation_notes      TEXT,
    sync_status           TEXT    NOT NULL DEFAULT 'pending',  -- pending | syncing | synced | error
    sync_attempts         INTEGER NOT NULL DEFAULT 0,
    last_sync_attempt_at  TEXT,
    last_synced_at        TEXT,
    sync_error            TEXT,
    offline_mode          INTEGER NOT NULL DEFAULT 1,
    immutable             INTEGER NOT NULL DEFAULT 0,
    integrity_hash        TEXT,
    created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_LOCAL_FILES_TABLE = `
  CREATE TABLE IF NOT EXISTS local_files (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id               TEXT    NOT NULL UNIQUE,
    response_id           TEXT    NOT NULL,
    file_type             TEXT    NOT NULL,  -- photo | signature | ine_front | ine_back | file
    question_id           TEXT    NOT NULL,
    local_path            TEXT,
    file_name             TEXT    NOT NULL,
    file_size             INTEGER NOT NULL DEFAULT 0,
    mime_type             TEXT    NOT NULL DEFAULT 'application/octet-stream',
    cloudinary_public_id  TEXT,
    cloudinary_version    INTEGER,
    remote_url            TEXT,
    ine_ocr_data          TEXT,
    sync_status           TEXT    NOT NULL DEFAULT 'pending',  -- pending | uploading | uploaded | error
    uploaded_at           TEXT,
    thumbnail_path        TEXT,
    created_at            TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id      TEXT    NOT NULL UNIQUE,
    operation_type TEXT   NOT NULL,
    entity_type   TEXT    NOT NULL,
    entity_id     TEXT    NOT NULL,
    payload_json  TEXT    NOT NULL DEFAULT '{}',
    status        TEXT    NOT NULL DEFAULT 'pending',
    priority      INTEGER NOT NULL DEFAULT 5,
    retry_count   INTEGER NOT NULL DEFAULT 0,
    max_retries   INTEGER NOT NULL DEFAULT 5,
    next_retry_at TEXT,
    last_error    TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    processed_at  TEXT,
    completed_at  TEXT
  );
`;

const CREATE_KV_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS kv_cache (
    cache_key   TEXT PRIMARY KEY,
    cache_value TEXT NOT NULL,
    expires_at  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id);`,
  `CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(brigadista_user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);`,
  `CREATE INDEX IF NOT EXISTS idx_responses_sync ON responses(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_local_files_response ON local_files(response_id);`,
  `CREATE INDEX IF NOT EXISTS idx_local_files_sync ON local_files(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, priority ASC);`,
];

// ── DB version (separate from the auth DB) ────────────────────────────────────
const APP_DB_VERSION = 2;

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private drizzleDb: ReturnType<typeof drizzle> | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Inicializar la base de datos
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return; // Ya inicializada
    }

    try {
      // Abrir base de datos
      this.db = await SQLite.openDatabaseAsync("brigada.db");

      // Inicializar Drizzle ORM
      this.drizzleDb = drizzle(this.db);

      // Ejecutar schema
      await this.executeSchema();

      console.log("✅ Database (brigada.db) initialized successfully");
    } catch (error) {
      console.error("❌ Database (brigada.db) initialization failed:", error);
      throw error;
    }
  }

  /**
   * Ejecutar el schema SQL — crea tablas e índices si no existen
   */
  private async executeSchema(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const versionResult = await this.db.getFirstAsync<{
      user_version: number;
    }>("PRAGMA user_version;");
    const currentVersion = versionResult?.user_version ?? 0;

    if (currentVersion >= APP_DB_VERSION) {
      console.log(`✅ brigada.db already at v${currentVersion}`);
      return;
    }

    console.log(
      `🔄 Migrating brigada.db from v${currentVersion} → v${APP_DB_VERSION}`,
    );

    await this.db.execAsync("BEGIN TRANSACTION;");

    try {
      // Create all tables
      await this.db.execAsync(CREATE_SURVEYS_TABLE);
      await this.db.execAsync(CREATE_RESPONSES_TABLE);
      await this.db.execAsync(CREATE_LOCAL_FILES_TABLE);
      await this.db.execAsync(CREATE_SYNC_QUEUE_TABLE);
      await this.db.execAsync(CREATE_KV_CACHE_TABLE);

      // Create indexes
      for (const idx of CREATE_INDEXES) {
        await this.db.execAsync(idx);
      }

      await this.db.execAsync(`PRAGMA user_version = ${APP_DB_VERSION};`);
      await this.db.execAsync("COMMIT;");

      console.log(`✅ brigada.db migrated to v${APP_DB_VERSION}`);
    } catch (error) {
      await this.db.execAsync("ROLLBACK;");
      throw error;
    }
  }

  /**
   * Obtener la conexión SQLite nativa
   */
  getConnection(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Obtener la instancia de Drizzle ORM
   */
  getDrizzle(): ReturnType<typeof drizzle> {
    if (!this.drizzleDb) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.drizzleDb;
  }

  /**
   * Ejecutar una transacción
   */
  async transaction<T>(
    callback: (tx: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T> {
    const db = this.getConnection();

    try {
      await db.execAsync("BEGIN TRANSACTION");
      const result = await callback(db);
      await db.execAsync("COMMIT");
      return result;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  }

  /**
   * Cerrar la base de datos
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.drizzleDb = null;
    }
  }
}

export const db = DatabaseManager.getInstance();
export { DatabaseManager };
