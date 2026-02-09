/**
 * 🗄️ CLIENTE DE BASE DE DATOS SQLite
 *
 * Exporta todos los repositorios y la función de inicialización
 */

// Exportar repositorios
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

/**
 * Inicializar la base de datos
 *
 * Llamar esta función al inicio de la app
 */
export async function initializeDatabase(): Promise<void> {
  const { db } = await import("./database");
  await db.initialize();
}

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
