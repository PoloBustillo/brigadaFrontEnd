/**
 * 🗄️ CLIENTE DE BASE DE DATOS SQLite - Brigada Digital
 *
 * Inicialización y gestión de base de datos local con SQLite
 */

import * as SQLite from "expo-sqlite";
import {
  ALL_AUTH_TABLES,
  ALL_AUTH_TRIGGERS,
  CREATE_ASSIGNMENT_INDEXES,
  CREATE_AUTH_INDEXES,
  CURRENT_DB_VERSION,
  DB_NAME,
  EXPIRE_OLD_INVITATIONS,
  GET_DB_VERSION,
  SEED_DEFAULT_ADMIN,
  SET_DB_VERSION,
} from "./schema";
import type { DatabaseStats } from "./types";

// ==================== INSTANCIA GLOBAL ====================

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Obtener instancia de la base de datos
 * Inicializa automáticamente si no existe
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  console.log("✅ Base de datos abierta:", DB_NAME);

  return dbInstance;
}

// ==================== INICIALIZACIÓN Y MIGRACIONES ====================

/**
 * Inicializar la base de datos
 * Crea tablas, índices y ejecuta migraciones necesarias
 *
 * Llamar esta función al inicio de la app
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🚀 Inicializando base de datos...");
    const db = await getDatabase();

    // Obtener versión actual
    const result = await db.getFirstAsync<{ user_version: number }>(
      GET_DB_VERSION,
    );
    const currentVersion = result?.user_version || 0;

    console.log(`📊 Versión actual de BD: ${currentVersion}`);

    // Si es primera vez o versión antigua, ejecutar migraciones
    if (currentVersion < CURRENT_DB_VERSION) {
      await runMigrations(db, currentVersion);
    } else {
      console.log("✅ Base de datos actualizada");
    }

    // Expirar invitaciones viejas
    await expireOldInvitations(db);

    console.log("✅ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    throw error;
  }
}

/**
 * Ejecutar migraciones necesarias
 */
async function runMigrations(
  db: SQLite.SQLiteDatabase,
  fromVersion: number,
): Promise<void> {
  console.log(
    `🔄 Ejecutando migraciones desde versión ${fromVersion} a ${CURRENT_DB_VERSION}`,
  );

  try {
    await db.execAsync("BEGIN TRANSACTION;");

    // Migración versión 0 -> 1: Crear tablas iniciales
    if (fromVersion < 1) {
      console.log("📦 Creando tablas de autenticación...");

      // Crear tablas
      for (const tableSQL of ALL_AUTH_TABLES) {
        await db.execAsync(tableSQL);
      }

      // Crear índices
      for (const indexSQL of CREATE_AUTH_INDEXES) {
        await db.execAsync(indexSQL);
      }

      // Crear índices de asignaciones
      for (const indexSQL of CREATE_ASSIGNMENT_INDEXES) {
        await db.execAsync(indexSQL);
      }

      // Crear triggers
      for (const triggerSQL of ALL_AUTH_TRIGGERS) {
        await db.execAsync(triggerSQL);
      }

      // Seed: Admin por defecto
      await db.execAsync(SEED_DEFAULT_ADMIN);

      console.log("✅ Tablas de autenticación creadas");
    }

    // Migración versión 1 -> 2: Agregar tablas de asignaciones
    if (fromVersion < 2) {
      console.log("📦 Creando tablas de asignaciones...");

      // Las nuevas tablas ya están incluidas en ALL_AUTH_TABLES
      // Solo necesitamos los nuevos índices si no se crearon en v1
      for (const indexSQL of CREATE_ASSIGNMENT_INDEXES) {
        await db.execAsync(indexSQL);
      }

      console.log("✅ Tablas de asignaciones creadas");
    }

    // Migración versión 2 -> 3: remover hardcodeos de rol + permisos efectivos
    if (fromVersion < 3) {
      console.log("📦 Migrando auth legacy a permisos efectivos...");

      await db.execAsync("PRAGMA foreign_keys=OFF;");

      // users: remover CHECK de rol y agregar columnas para permisos efectivos
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users_v3 (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'BRIGADISTA',
          role_template TEXT,
          permissions_json TEXT NOT NULL DEFAULT '[]',
          state TEXT NOT NULL CHECK(state IN ('INVITED', 'PENDING', 'ACTIVE', 'DISABLED')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_login_at TEXT,
          created_by TEXT,
          FOREIGN KEY (created_by) REFERENCES users_v3(id) ON DELETE SET NULL
        );
      `);

      await db.execAsync(`
        INSERT INTO users_v3 (
          id,
          email,
          password_hash,
          full_name,
          phone,
          role,
          state,
          created_at,
          updated_at,
          last_login_at,
          created_by,
          role_template,
          permissions_json
        )
        SELECT
          id,
          email,
          password_hash,
          full_name,
          phone,
          role,
          state,
          created_at,
          updated_at,
          last_login_at,
          created_by,
          NULL,
          '[]'
        FROM users;
      `);

      await db.execAsync(`DROP TABLE users;`);
      await db.execAsync(`ALTER TABLE users_v3 RENAME TO users;`);

      // invitations: remover CHECK de rol para permitir plantillas/roles backend flexibles
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS invitations_v3 (
          id TEXT PRIMARY KEY NOT NULL,
          code TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('PENDING', 'ACTIVATED', 'EXPIRED', 'REVOKED')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL,
          activated_at TEXT,
          activated_by TEXT,
          created_by TEXT NOT NULL,
          FOREIGN KEY (activated_by) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await db.execAsync(`
        INSERT INTO invitations_v3 (
          id,
          code,
          email,
          role,
          status,
          created_at,
          expires_at,
          activated_at,
          activated_by,
          created_by
        )
        SELECT
          id,
          code,
          email,
          role,
          status,
          created_at,
          expires_at,
          activated_at,
          activated_by,
          created_by
        FROM invitations;
      `);

      await db.execAsync(`DROP TABLE invitations;`);
      await db.execAsync(`ALTER TABLE invitations_v3 RENAME TO invitations;`);

      // whitelist: remover CHECK de rol para no depender de roles hardcodeados
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS whitelist_v3 (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_sync_at TEXT NOT NULL,
          synced_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await db.execAsync(`
        INSERT INTO whitelist_v3 (
          id,
          user_id,
          email,
          role,
          is_active,
          last_sync_at,
          synced_at
        )
        SELECT
          id,
          user_id,
          email,
          role,
          is_active,
          last_sync_at,
          synced_at
        FROM whitelist;
      `);

      await db.execAsync(`DROP TABLE whitelist;`);
      await db.execAsync(`ALTER TABLE whitelist_v3 RENAME TO whitelist;`);

      // Re-crear índices/triggers dependientes de tablas recreadas
      for (const indexSQL of CREATE_AUTH_INDEXES) {
        await db.execAsync(indexSQL);
      }
      for (const triggerSQL of ALL_AUTH_TRIGGERS) {
        await db.execAsync(triggerSQL);
      }

      await db.execAsync("PRAGMA foreign_keys=ON;");
      console.log("✅ Auth legacy migrado a estrategia por permisos");
    }

    // Actualizar versión
    await db.execAsync(SET_DB_VERSION(CURRENT_DB_VERSION));

    await db.execAsync("COMMIT;");
    console.log(
      `✅ Migraciones completadas. Versión actual: ${CURRENT_DB_VERSION}`,
    );
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    console.error("❌ Error en migraciones:", error);
    throw error;
  }
}

/**
 * Expirar invitaciones antiguas
 * Se ejecuta en cada inicialización
 */
async function expireOldInvitations(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const result = await db.runAsync(EXPIRE_OLD_INVITATIONS);
    if (result.changes > 0) {
      console.log(`🔒 ${result.changes} invitaciones expiradas`);
    }
  } catch (error) {
    console.error("❌ Error expirando invitaciones:", error);
  }
}

// ==================== UTILIDADES ====================

/**
 * Obtener estadísticas de la base de datos
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const db = await getDatabase();

  const [
    usersResult,
    activeUsersResult,
    invitationsResult,
    whitelistResult,
    logsResult,
  ] = await Promise.all([
    db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM users`),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE state = 'ACTIVE'`,
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM invitations WHERE status = 'PENDING'`,
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM whitelist`,
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE synced_to_server = 0`,
    ),
  ]);

  return {
    totalUsers: usersResult?.count || 0,
    activeUsers: activeUsersResult?.count || 0,
    pendingInvitations: invitationsResult?.count || 0,
    whitelistEntries: whitelistResult?.count || 0,
    unsyncedLogs: logsResult?.count || 0,
  };
}

/**
 * Cerrar la conexión a la base de datos
 * Útil para testing o limpieza
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    console.log("🔒 Base de datos cerrada");
  }
}

/**
 * Eliminar completamente la base de datos
 * ADVERTENCIA: Solo usar en desarrollo
 */
export async function resetDatabase(): Promise<void> {
  if (__DEV__) {
    await closeDatabase();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    console.log("🗑️ Base de datos eliminada");
  } else {
    console.warn("⚠️ resetDatabase solo disponible en desarrollo");
  }
}

// Exportar repositorios existentes
export { DatabaseManager, db } from "./database";

export {
  surveyRepository,
  SurveyRepository,
  type SurveyRecord,
} from "./repositories/survey.repository";

export {
  responseRepository,
  ResponseRepository,
  type CreateResponseParams,
  type ResponseRecord,
  type UpdateAnswersParams,
} from "./repositories/response.repository";

export {
  syncRepository,
  SyncRepository,
  type AddToQueueParams,
  type SyncQueueRecord,
} from "./repositories/sync.repository";

export {
  fileRepository,
  FileRepository,
  type CreateFileParams,
  type FileRecord,
} from "./repositories/file.repository";

// Exportar tipos
export * from "./types";

/**
 * Ejemplo de uso:
 *
 * ```typescript
 * import {
 *   initializeDatabase,
 *   surveyRepository,
 *   responseRepository,
 *   syncRepository,
 *   fileRepository
 * } from '@/lib/db';
 *
 * // 1. Inicializar al inicio de la app
 * await initializeDatabase();
 *
 * // 2. Obtener encuestas activas
 * const surveys = await surveyRepository.getActiveSurveys();
 *
 * // 3. Crear una respuesta (guardado inmediato)
 * const responseId = await responseRepository.createResponse({
 *   response_id: 'uuid-1234',
 *   survey_id: 'censo-2026',
 *   survey_version: '1.0.0',
 *   brigadista_user_id: 'user-123',
 *   brigadista_name: 'Juan Pérez',
 *   brigadista_role: 'brigadista',
 *   device_platform: 'android',
 *   device_os_version: '13',
 *   device_app_version: '1.0.0'
 * });
 *
 * // 4. Actualizar respuestas (auto-save)
 * await responseRepository.updateAnswers({
 *   response_id: responseId,
 *   answers: {
 *     'q1-nombre': {
 *       questionId: 'q1-nombre',
 *       questionType: QuestionType.TEXT,
 *       value: 'Juan Pérez',
 *       answeredAt: new Date().toISOString()
 *     }
 *   }
 * });
 *
 * // 5. Guardar archivo (foto INE)
 * const fileId = await fileRepository.createFile({
 *   file_id: 'file-uuid-1234',
 *   response_id: responseId,
 *   file_type: 'ine_front',
 *   question_id: 'q3-ine',
 *   local_path: 'file:///data/ine_front.jpg',
 *   file_name: 'ine_front.jpg',
 *   mime_type: 'image/jpeg',
 *   ine_ocr_data: { claveElector: 'ABC123', nombre: 'JUAN PEREZ' }
 * });
 *
 * // 6. Completar respuesta
 * await responseRepository.completeResponse(responseId);
 *
 * // 7. Añadir a cola de sincronización
 * await syncRepository.addToQueue({
 *   queue_id: 'sync-uuid-1234',
 *   operation_type: 'create_response',
 *   entity_type: 'response',
 *   entity_id: responseId,
 *   payload: { response_id: responseId },
 *   priority: 1 // Alta prioridad
 * });
 *
 * // 8. Marcar como sincronizada
 * await responseRepository.markAsSynced(responseId);
 * await fileRepository.markAsUploaded(fileId, 'https://api.example.com/files/123');
 * await syncRepository.markAsCompleted('sync-uuid-1234');
 * ```
 */
