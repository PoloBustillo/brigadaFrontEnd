/**
 * Sync Repository
 *
 * Gestión de la cola de sincronización
 */

import { db } from "../database";

export interface SyncQueueRecord {
  id: number;
  queue_id: string;
  operation_type:
    | "create_response"
    | "update_response"
    | "upload_file"
    | "download_survey"
    | "validate_response";
  entity_type: "response" | "file" | "survey";
  entity_id: string;
  payload_json: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  priority: number;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  completed_at: string | null;
}

export interface AddToQueueParams {
  queue_id: string;
  operation_type: SyncQueueRecord["operation_type"];
  entity_type: SyncQueueRecord["entity_type"];
  entity_id: string;
  payload: any;
  priority?: number;
}

export class SyncRepository {
  /**
   * Añadir operación a la cola de sincronización
   */
  async addToQueue(params: AddToQueueParams): Promise<void> {
    const connection = db.getConnection();

    const payloadJson = JSON.stringify(params.payload);

    // Evitar duplicados activos para la misma entidad/operación.
    // Si ya existe un item pending/processing/failed, se reactiva y actualiza.
    const existing = await connection.getFirstAsync<{
      queue_id: string;
      status: SyncQueueRecord["status"];
    }>(
      `SELECT queue_id, status
       FROM sync_queue
       WHERE operation_type = ?
         AND entity_type = ?
         AND entity_id = ?
         AND status IN ('pending', 'processing', 'failed')
       ORDER BY created_at DESC
       LIMIT 1`,
      [params.operation_type, params.entity_type, params.entity_id],
    );

    if (existing) {
      await connection.runAsync(
        `UPDATE sync_queue
         SET payload_json = ?,
             priority = ?,
             status = 'pending',
             next_retry_at = NULL,
             last_error = NULL,
             updated_at = datetime('now')
         WHERE queue_id = ?`,
        [payloadJson, params.priority ?? 5, existing.queue_id],
      );

      console.log("♻️ Reused existing sync queue item:", existing.queue_id);
      return;
    }

    await connection.runAsync(
      `INSERT INTO sync_queue (
        queue_id, operation_type, entity_type, entity_id,
        payload_json, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        params.queue_id,
        params.operation_type,
        params.entity_type,
        params.entity_id,
        payloadJson,
        params.priority ?? 5,
        "pending",
      ],
    );

    console.log("📝 Added to sync queue:", params.queue_id);
  }

  /**
   * Obtener operaciones pendientes (ordenadas por prioridad)
   */
  async getPendingOperations(limit: number = 10): Promise<SyncQueueRecord[]> {
    const connection = db.getConnection();

    const result = await connection.getAllAsync<SyncQueueRecord>(
      `SELECT * FROM sync_queue 
       WHERE status = 'pending'
         AND (
           next_retry_at IS NULL
           OR datetime(next_retry_at) <= datetime('now')
         )
       ORDER BY priority ASC, created_at ASC 
       LIMIT ?`,
      [limit],
    );

    return result;
  }

  /**
   * Marcar operación como completada
   */
  async markAsCompleted(queueId: string): Promise<void> {
    const connection = db.getConnection();

    await connection.runAsync(
      `UPDATE sync_queue 
       SET status = 'completed',
           processed_at = datetime('now'),
           completed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE queue_id = ?`,
      [queueId],
    );

    console.log("✅ Sync operation completed:", queueId);
  }

  /**
   * Marcar operación como fallida
   */
  async markAsFailed(
    queueId: string,
    error: string,
    scheduleRetry: boolean = true,
  ): Promise<void> {
    const connection = db.getConnection();

    // Calcular próximo intento (exponential backoff)
    const record = await this.getOperation(queueId);
    if (!record) return;

    const nextRetryDelay = Math.pow(2, record.retry_count) * 60; // Minutos
    const nextRetryAt = scheduleRetry
      ? new Date(Date.now() + nextRetryDelay * 60 * 1000).toISOString()
      : null;

    const newStatus =
      record.retry_count >= record.max_retries ? "failed" : "pending";

    await connection.runAsync(
      `UPDATE sync_queue 
       SET status = ?,
           retry_count = retry_count + 1,
           last_error = ?,
           next_retry_at = ?,
           processed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE queue_id = ?`,
      [newStatus, error, nextRetryAt, queueId],
    );

    console.log(
      `❌ Sync operation failed (retry ${record.retry_count + 1}/${record.max_retries}):`,
      queueId,
    );
  }

  /**
   * Obtener una operación específica
   */
  async getOperation(queueId: string): Promise<SyncQueueRecord | null> {
    const connection = db.getConnection();

    const result = await connection.getFirstAsync<SyncQueueRecord>(
      `SELECT * FROM sync_queue WHERE queue_id = ?`,
      [queueId],
    );

    return result ?? null;
  }

  /**
   * Limpiar operaciones completadas antiguas
   */
  async cleanupCompleted(daysOld: number = 7): Promise<number> {
    const connection = db.getConnection();

    const result = await connection.runAsync(
      `DELETE FROM sync_queue 
       WHERE status = 'completed' 
       AND completed_at < datetime('now', '-' || ? || ' days')`,
      [daysOld],
    );

    console.log(`🧹 Cleaned up ${result.changes} old sync operations`);

    return result.changes;
  }

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const connection = db.getConnection();

    const result = await connection.getFirstAsync<{
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    }>(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM sync_queue`,
    );

    return (
      result ?? {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }
    );
  }

  /**
   * Reintentar operaciones fallidas
   */
  async retryFailed(): Promise<number> {
    const connection = db.getConnection();

    const result = await connection.runAsync(
      `UPDATE sync_queue 
       SET status = 'pending',
           retry_count = 0,
           last_error = NULL,
           next_retry_at = NULL,
           updated_at = datetime('now')
       WHERE status = 'failed'`,
    );

    console.log(`🔄 Retrying ${result.changes} failed operations`);

    return result.changes;
  }
}

export const syncRepository = new SyncRepository();
