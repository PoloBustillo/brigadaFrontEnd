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
  private initializationPromise: Promise<void> | null = null;

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

    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    this.initializationPromise = this.initializeInternal();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private isDatabaseLockedError(error: unknown): boolean {
    if (!error) return false;
    const message =
      error instanceof Error ? error.message : String(error);
    return /database is locked|database is busy|SQLITE_BUSY/i.test(message);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withDbLockRetry<T>(
    operation: () => Promise<T>,
    label: string,
    maxAttempts: number = 4,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt += 1;
        const shouldRetry =
          this.isDatabaseLockedError(error) && attempt < maxAttempts;

        if (!shouldRetry) {
          throw error;
        }

        const delayMs = Math.min(150 * Math.pow(2, attempt - 1), 1200);
        console.warn(
          `⏳ SQLite busy during ${label} (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`,
        );
        await this.sleep(delayMs);
      }
    }
  }

  private async applyPragmaBestEffort(sql: string, label: string): Promise<void> {
    try {
      await this.withDbLockRetry(() => this.db!.execAsync(sql), label);
    } catch (error) {
      if (this.isDatabaseLockedError(error)) {
        console.warn(
          `⚠️ Skipping ${label} due to transient SQLite lock. Initialization will continue.`,
        );
        return;
      }
      throw error;
    }
  }

  private async initializeInternal(): Promise<void> {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        // Abrir base de datos
        this.db = await SQLite.openDatabaseAsync("brigada.db");

        // Reduce lock contention for concurrent async readers/writers.
        await this.applyPragmaBestEffort(
          "PRAGMA journal_mode = WAL;",
          "PRAGMA journal_mode",
        );
        await this.applyPragmaBestEffort(
          "PRAGMA synchronous = NORMAL;",
          "PRAGMA synchronous",
        );
        await this.applyPragmaBestEffort(
          "PRAGMA busy_timeout = 5000;",
          "PRAGMA busy_timeout",
        );

        // Inicializar Drizzle ORM
        this.drizzleDb = drizzle(this.db);

        // Ejecutar schema
        await this.executeSchema();

        console.log("✅ Database (brigada.db) initialized successfully");
        return;
      } catch (error) {
        const shouldRetry =
          this.isDatabaseLockedError(error) && attempt < maxAttempts;

        try {
          await this.db?.closeAsync();
        } catch {
          // Ignore close errors while recovering from initialization failures.
        }

        this.db = null;
        this.drizzleDb = null;

        if (!shouldRetry) {
          console.error("❌ Database (brigada.db) initialization failed:", error);
          throw error;
        }

        const delayMs = Math.min(200 * Math.pow(2, attempt - 1), 1500);
        console.warn(
          `⏳ Retrying brigada.db initialization (attempt ${attempt + 1}/${maxAttempts}) in ${delayMs}ms...`,
        );
        await this.sleep(delayMs);
      }
    }
  }

  /**
   * Ejecutar el schema SQL — crea tablas e índices si no existen
   */
  private async executeSchema(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const versionResult = await this.withDbLockRetry(
      () =>
        this.db!.getFirstAsync<{
          user_version: number;
        }>("PRAGMA user_version;"),
      "read user_version",
    );
    const currentVersion = versionResult?.user_version ?? 0;

    if (currentVersion >= APP_DB_VERSION) {
      console.log(`✅ brigada.db already at v${currentVersion}`);
      return;
    }

    console.log(
      `🔄 Migrating brigada.db from v${currentVersion} → v${APP_DB_VERSION}`,
    );

    await this.withDbLockRetry(
      () => this.db!.execAsync("BEGIN TRANSACTION;"),
      "BEGIN TRANSACTION",
    );

    try {
      // Create all tables
      await this.withDbLockRetry(
        () => this.db!.execAsync(CREATE_SURVEYS_TABLE),
        "create surveys table",
      );
      await this.withDbLockRetry(
        () => this.db!.execAsync(CREATE_RESPONSES_TABLE),
        "create responses table",
      );
      await this.withDbLockRetry(
        () => this.db!.execAsync(CREATE_LOCAL_FILES_TABLE),
        "create local_files table",
      );
      await this.withDbLockRetry(
        () => this.db!.execAsync(CREATE_SYNC_QUEUE_TABLE),
        "create sync_queue table",
      );
      await this.withDbLockRetry(
        () => this.db!.execAsync(CREATE_KV_CACHE_TABLE),
        "create kv_cache table",
      );

      // Create indexes
      for (const idx of CREATE_INDEXES) {
        await this.withDbLockRetry(
          () => this.db!.execAsync(idx),
          "create index",
        );
      }

      await this.withDbLockRetry(
        () => this.db!.execAsync(`PRAGMA user_version = ${APP_DB_VERSION};`),
        "set user_version",
      );
      await this.withDbLockRetry(
        () => this.db!.execAsync("COMMIT;"),
        "COMMIT",
      );

      console.log(`✅ brigada.db migrated to v${APP_DB_VERSION}`);
    } catch (error) {
      await this.withDbLockRetry(
        () => this.db!.execAsync("ROLLBACK;"),
        "ROLLBACK",
      );
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
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.drizzleDb = null;
    }
  }
}

export const db = DatabaseManager.getInstance();
export { DatabaseManager };
