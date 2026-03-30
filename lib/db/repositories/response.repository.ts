/**
 * Response Repository
 *
 * Capa de acceso a datos para la tabla responses
 *
 * Operaciones principales:
 * - Guardar respuestas inmediatamente (offline-first)
 * - Recuperar respuestas y progreso
 * - Marcar como sincronizadas
 */

import type { Answer, SurveyResponse } from "@/types/survey-schema.types";
import { db } from "../database";

export interface ResponseRecord {
  id: number;
  response_id: string;
  survey_id: string;
  survey_version: string;
  status: "draft" | "completed" | "validated" | "rejected";
  answers_json: string; // JSON serializado
  brigadista_user_id: string;
  brigadista_name: string;
  brigadista_role: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  location_captured_at: string | null;
  device_platform: string;
  device_os_version: string;
  device_app_version: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  validation_status: "pending" | "validated" | "rejected";
  validated_by: string | null;
  validated_at: string | null;
  validation_notes: string | null;
  sync_status: "pending" | "syncing" | "synced" | "error";
  sync_attempts: number;
  last_sync_attempt_at: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
  offline_mode: boolean;
  immutable: boolean;
  integrity_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResponseParams {
  response_id: string;
  survey_id: string;
  survey_version: string;
  brigadista_user_id: string;
  brigadista_name: string;
  brigadista_role: string;
  device_platform: "android" | "ios" | "web";
  device_os_version: string;
  device_app_version: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface UpdateAnswersParams {
  response_id: string;
  answers: Record<string, Answer>;
  autoSave?: boolean;
}

export class ResponseRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  private isDatabaseLocked(error: unknown): boolean {
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    return /database is locked|database is busy|SQLITE_BUSY|finalizeAsync/i.test(
      message,
    );
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(task: () => Promise<T>): Promise<T> {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await task();
      } catch (error) {
        const shouldRetry = this.isDatabaseLocked(error) && attempt < maxAttempts;
        if (!shouldRetry) {
          throw error;
        }

        const delayMs = Math.min(80 * Math.pow(2, attempt - 1), 800);
        await this.sleep(delayMs);
      }
    }

    throw new Error("Unexpected retry termination in ResponseRepository");
  }

  private enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    const run = this.writeQueue.then(task, task);
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async getConnection(): Promise<ReturnType<typeof db.getConnection>> {
    await db.initialize();
    return db.getConnection();
  }

  /**
   * Crear una nueva respuesta (draft)
   * Se guarda inmediatamente en SQLite
   */
  async createResponse(params: CreateResponseParams): Promise<string> {
    const connection = await this.getConnection();

    const now = new Date().toISOString();

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(
          `INSERT INTO responses (
            response_id, survey_id, survey_version,
            status, answers_json,
            brigadista_user_id, brigadista_name, brigadista_role,
            latitude, longitude, accuracy, location_captured_at,
            device_platform, device_os_version, device_app_version,
            started_at, sync_status, offline_mode
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            params.response_id,
            params.survey_id,
            params.survey_version,
            "draft",
            "{}",
            params.brigadista_user_id,
            params.brigadista_name,
            params.brigadista_role,
            params.latitude ?? null,
            params.longitude ?? null,
            params.accuracy ?? null,
            params.latitude ? now : null,
            params.device_platform,
            params.device_os_version,
            params.device_app_version,
            now,
            "pending",
            true,
          ],
        ),
      ),
    );

    console.log("✅ Response created:", params.response_id);

    return params.response_id;
  }

  /**
   * Actualizar respuestas (guardado automático)
   * Se ejecuta cada vez que el usuario responde una pregunta
   */
  async updateAnswers(params: UpdateAnswersParams): Promise<void> {
    const connection = await this.getConnection();

    const answersJson = JSON.stringify(params.answers);

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(
          `UPDATE responses 
           SET answers_json = ?,
               updated_at = datetime('now')
           WHERE response_id = ?`,
          [answersJson, params.response_id],
        ),
      ),
    );

    if (params.autoSave !== false) {
      console.log("💾 Answers auto-saved:", params.response_id);
    }
  }

  /**
   * Marcar respuesta como completada
   */
  async completeResponse(responseId: string): Promise<void> {
    const connection = await this.getConnection();

    // Obtener tiempo de inicio
    const response = await this.getResponseById(responseId);
    if (!response) throw new Error("Response not found");

    const startedAt = new Date(response.started_at);
    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - startedAt.getTime()) / 1000,
    );

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(
          `UPDATE responses 
           SET status = 'completed',
               completed_at = datetime('now'),
               duration_seconds = ?,
               updated_at = datetime('now')
           WHERE response_id = ?`,
          [durationSeconds, responseId],
        ),
      ),
    );

    console.log("✅ Response completed:", responseId);
  }

  /**
   * Obtener una respuesta por ID
   */
  async getResponseById(responseId: string): Promise<ResponseRecord | null> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getFirstAsync<ResponseRecord>(
        `SELECT * FROM responses WHERE response_id = ?`,
        [responseId],
      ),
    );

    return result ?? null;
  }

  /**
   * Obtener respuestas parseadas con metadata
   */
  async getResponseWithAnswers(
    responseId: string,
  ): Promise<SurveyResponse | null> {
    const record = await this.getResponseById(responseId);

    if (!record) return null;

    try {
      const answers = JSON.parse(record.answers_json) as Record<string, Answer>;

      return {
        id: record.response_id,
        surveyId: record.survey_id,
        surveyVersion: record.survey_version,
        status: record.status,
        answers,
        metadata: {
          started_at: record.started_at,
          completed_at: record.completed_at ?? "",
          duration_seconds: record.duration_seconds ?? 0,
          device_info: {
            platform: record.device_platform as "android" | "ios" | "web",
            os_version: record.device_os_version,
            app_version: record.device_app_version,
          },
          geolocation: record.latitude
            ? {
                latitude: record.latitude,
                longitude: record.longitude!,
                accuracy: record.accuracy!,
                captured_at: record.location_captured_at!,
              }
            : undefined,
          brigadista: {
            user_id: record.brigadista_user_id,
            name: record.brigadista_name,
            role: record.brigadista_role,
          },
          sync_status: record.sync_status,
          offline_mode: Boolean(record.offline_mode),
          validation_status: record.validation_status,
          validated_by: record.validated_by,
          validated_at: record.validated_at,
        },
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        completedAt: record.completed_at,
        validatedAt: record.validated_at,
        immutable: Boolean(record.immutable),
        integrityHash: record.integrity_hash ?? undefined,
      };
    } catch (error) {
      console.error("Error parsing response answers:", error);
      return null;
    }
  }

  /**
   * Obtener todas las respuestas de un usuario
   */
  async getResponsesByUser(userId: string): Promise<ResponseRecord[]> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getAllAsync<ResponseRecord>(
        `SELECT * FROM responses 
         WHERE brigadista_user_id = ? 
         ORDER BY created_at DESC`,
        [userId],
      ),
    );

    return result;
  }

  /**
   * Obtener respuestas de una encuesta específica
   */
  async getResponsesBySurvey(
    surveyId: string,
    version?: string,
  ): Promise<ResponseRecord[]> {
    const connection = await this.getConnection();

    if (version) {
      const result = await this.withRetry(() =>
        connection.getAllAsync<ResponseRecord>(
          `SELECT * FROM responses 
           WHERE survey_id = ? AND survey_version = ? 
           ORDER BY created_at DESC`,
          [surveyId, version],
        ),
      );
      return result;
    } else {
      const result = await this.withRetry(() =>
        connection.getAllAsync<ResponseRecord>(
          `SELECT * FROM responses 
           WHERE survey_id = ? 
           ORDER BY created_at DESC`,
          [surveyId],
        ),
      );
      return result;
    }
  }

  /**
   * Obtener respuestas pendientes de sincronizar
   */
  async getPendingSyncResponses(): Promise<ResponseRecord[]> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getAllAsync<ResponseRecord>(
        `SELECT * FROM responses 
         WHERE sync_status = 'pending' 
         ORDER BY created_at ASC`,
      ),
    );

    return result;
  }

  /**
   * Marcar respuesta como sincronizada
   */
  async markAsSynced(responseId: string): Promise<void> {
    const connection = await this.getConnection();

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(
          `UPDATE responses 
           SET sync_status = 'synced',
               last_synced_at = datetime('now'),
               updated_at = datetime('now')
           WHERE response_id = ?`,
          [responseId],
        ),
      ),
    );

    console.log("✅ Response synced:", responseId);
  }

  /**
   * Marcar respuesta con error de sincronización
   */
  async markSyncError(responseId: string, error: string): Promise<void> {
    const connection = await this.getConnection();

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(
          `UPDATE responses 
           SET sync_status = 'error',
               sync_error = ?,
               sync_attempts = sync_attempts + 1,
               last_sync_attempt_at = datetime('now'),
               updated_at = datetime('now')
           WHERE response_id = ?`,
          [error, responseId],
        ),
      ),
    );

    console.log("❌ Response sync error:", responseId, error);
  }

  /**
   * Obtener progreso de una respuesta
   */
  async getResponseProgress(responseId: string): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    percentComplete: number;
    status: string;
  } | null> {
    const response = await this.getResponseById(responseId);

    if (!response) return null;

    try {
      const answers = JSON.parse(response.answers_json) as Record<
        string,
        Answer
      >;

      const answeredCount = Object.keys(answers).length;

      // TODO: Obtener totalQuestions del schema de la encuesta
      // Por ahora, retornar valores básicos
      const totalQuestions = 10; // Placeholder

      return {
        totalQuestions,
        answeredQuestions: answeredCount,
        percentComplete: (answeredCount / totalQuestions) * 100,
        status: response.status,
      };
    } catch (error) {
      console.error("Error calculating progress:", error);
      return null;
    }
  }

  /**
   * Obtener respuestas en borrador (draft)
   */
  async getDraftResponses(userId: string): Promise<ResponseRecord[]> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getAllAsync<ResponseRecord>(
        `SELECT * FROM responses 
         WHERE brigadista_user_id = ? 
         AND status = 'draft' 
         ORDER BY updated_at DESC`,
        [userId],
      ),
    );

    return result;
  }

  /**
   * Obtener respuestas completadas
   */
  async getCompletedResponses(userId: string): Promise<ResponseRecord[]> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getAllAsync<ResponseRecord>(
        `SELECT * FROM responses 
         WHERE brigadista_user_id = ? 
         AND status = 'completed' 
         ORDER BY completed_at DESC`,
        [userId],
      ),
    );

    return result;
  }

  /**
   * Eliminar una respuesta (solo si es draft y no sincronizada)
   */
  async deleteResponse(responseId: string): Promise<boolean> {
    const connection = await this.getConnection();

    const response = await this.getResponseById(responseId);

    if (!response) return false;

    // Solo permitir eliminar drafts no sincronizados
    if (response.status !== "draft" || response.sync_status === "synced") {
      console.warn("Cannot delete: Response is completed or synced");
      return false;
    }

    await this.enqueueWrite(() =>
      this.withRetry(() =>
        connection.runAsync(`DELETE FROM responses WHERE response_id = ?`, [
          responseId,
        ]),
      ),
    );

    console.log("🗑️ Response deleted:", responseId);
    return true;
  }

  /**
   * Contar respuestas por estado
   */
  async getResponseStats(userId: string): Promise<{
    total: number;
    draft: number;
    completed: number;
    validated: number;
    pending_sync: number;
  }> {
    const connection = await this.getConnection();

    const result = await this.withRetry(() =>
      connection.getFirstAsync<{
        total: number;
        draft: number;
        completed: number;
        validated: number;
        pending_sync: number;
      }>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
          SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending_sync
         FROM responses 
         WHERE brigadista_user_id = ?`,
        [userId],
      ),
    );

    return (
      result ?? {
        total: 0,
        draft: 0,
        completed: 0,
        validated: 0,
        pending_sync: 0,
      }
    );
  }
}

export const responseRepository = new ResponseRepository();
