/**
 * 📝 REPOSITORIO DE ENCUESTAS
 *
 * Gestión de respuestas de encuestas y guardado inmediato de preguntas
 * Sigue el patrón Repository para abstracción de datos
 */

import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "../db";
import type { SurveySchemaDefinition } from "../db/schema";
import { questionAnswers, surveyResponses, surveySchemas } from "../db/schema";
import { calculateProgress, generateId } from "../utils";

// ============================================================================
// TIPOS
// ============================================================================

export type SurveyResponseStatus =
  | "in_progress"
  | "completed"
  | "synced"
  | "error";

export type CreateSurveyResponseInput = {
  schemaId: string;
  schemaVersion: number;
  collectedBy: string;
  // Geolocalización
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  // Información del encuestado (opcional al inicio)
  respondentName?: string;
  respondentPhone?: string;
  respondentEmail?: string;
  // Metadata del dispositivo
  deviceInfo?: {
    model?: string;
    os?: string;
    appVersion?: string;
  };
};

export type UpdateSurveyMetadataInput = {
  respondentName?: string;
  respondentPhone?: string;
  respondentEmail?: string;
  notes?: string;
  tags?: string[];
  address?: string;
};

export type ValidateSurveyInput = {
  responseId: string;
  validatedBy: string;
  isValidated: boolean;
};

export type SaveQuestionAnswerInput = {
  responseId: string;
  questionId: string;
  questionPath: string;
  questionType:
    | "text"
    | "number"
    | "date"
    | "select"
    | "multi_select"
    | "boolean"
    | "photo"
    | "signature"
    | "ine";
  value: any;
  fileUri?: string;
  fileName?: string;
};

export type SurveyResponseWithProgress = {
  id: string;
  schemaId: string;
  schemaName: string;
  schemaVersion: number;
  status: SurveyResponseStatus;
  progress: number;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
};

// ============================================================================
// REPOSITORIO
// ============================================================================

export class SurveyRepository {
  /**
   * Crea una nueva instancia de encuesta
   * Se llama cuando el brigadista inicia una nueva encuesta
   */
  static async createResponse(
    input: CreateSurveyResponseInput,
  ): Promise<string> {
    const db = getDatabase();
    const responseId = generateId();
    const now = new Date();

    await db.insert(surveyResponses).values({
      id: responseId,
      schemaId: input.schemaId,
      schemaVersion: input.schemaVersion,
      collectedBy: input.collectedBy,
      status: "in_progress",
      progress: 0.0,
      startedAt: now,
      // Geolocalización
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      locationCapturedAt: input.latitude ? now : null,
      // Información del encuestado
      respondentName: input.respondentName || null,
      respondentPhone: input.respondentPhone || null,
      respondentEmail: input.respondentEmail || null,
      // Metadata del dispositivo
      deviceInfo: input.deviceInfo ? input.deviceInfo : null,
    });

    console.log(`✅ Created survey response: ${responseId}`);
    return responseId;
  }

  /**
   * Guarda la respuesta a una pregunta individual
   * SE LLAMA INMEDIATAMENTE al responder cada pregunta
   */
  static async saveQuestionAnswer(
    input: SaveQuestionAnswerInput,
  ): Promise<void> {
    const db = getDatabase();
    const answerId = generateId();

    // Verificar si ya existe una respuesta para esta pregunta (por si acaso)
    const existing = await db
      .select()
      .from(questionAnswers)
      .where(
        and(
          eq(questionAnswers.responseId, input.responseId),
          eq(questionAnswers.questionId, input.questionId),
        ),
      )
      .get();

    if (existing) {
      // Actualizar respuesta existente (edge case)
      await db
        .update(questionAnswers)
        .set({
          value: JSON.stringify(input.value),
          fileUri: input.fileUri,
          fileName: input.fileName,
          answeredAt: new Date(),
        })
        .where(eq(questionAnswers.id, existing.id));

      console.log(`📝 Updated answer for question: ${input.questionId}`);
    } else {
      // Insertar nueva respuesta
      await db.insert(questionAnswers).values({
        id: answerId,
        responseId: input.responseId,
        questionId: input.questionId,
        questionPath: input.questionPath,
        questionType: input.questionType,
        value: JSON.stringify(input.value),
        fileUri: input.fileUri,
        fileName: input.fileName,
        fileSynced: false,
      });

      console.log(`✅ Saved answer for question: ${input.questionId}`);
    }

    // Actualizar progreso de la encuesta
    await this.updateProgress(input.responseId);
  }

  /**
   * Actualiza el progreso de una encuesta
   * Calcula automáticamente basado en preguntas respondidas
   */
  private static async updateProgress(responseId: string): Promise<void> {
    const db = getDatabase();

    // Obtener la encuesta y su schema
    const response = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.id, responseId))
      .get();

    if (!response) {
      throw new Error(`Survey response not found: ${responseId}`);
    }

    // Obtener el schema para contar preguntas totales
    const schema = await db
      .select()
      .from(surveySchemas)
      .where(eq(surveySchemas.id, response.schemaId))
      .get();

    if (!schema) {
      throw new Error(`Survey schema not found: ${response.schemaId}`);
    }

    const schemaData = schema.schema as SurveySchemaDefinition;
    const totalQuestions = schemaData.sections.reduce(
      (acc, section) => acc + section.questions.length,
      0,
    );

    // Contar preguntas respondidas
    const answeredCount = await db
      .select()
      .from(questionAnswers)
      .where(eq(questionAnswers.responseId, responseId))
      .all();

    const progress = calculateProgress(totalQuestions, answeredCount.length);

    // Actualizar progreso
    await db
      .update(surveyResponses)
      .set({ progress })
      .where(eq(surveyResponses.id, responseId));

    console.log(
      `📊 Progress updated: ${(progress * 100).toFixed(1)}% (${answeredCount.length}/${totalQuestions})`,
    );
  }

  /**
   * Marca una encuesta como completada
   * Calcula automáticamente la duración
   */
  static async completeResponse(responseId: string): Promise<void> {
    const db = getDatabase();

    // Obtener la encuesta para calcular duración
    const response = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.id, responseId))
      .get();

    if (!response) {
      throw new Error(`Survey response not found: ${responseId}`);
    }

    const completedAt = new Date();
    const startedAt = new Date(response.startedAt);
    const duration = Math.floor(
      (completedAt.getTime() - startedAt.getTime()) / 1000,
    ); // en segundos

    await db
      .update(surveyResponses)
      .set({
        status: "completed",
        completedAt,
        duration,
        progress: 1.0,
      })
      .where(eq(surveyResponses.id, responseId));

    console.log(
      `✅ Survey response completed: ${responseId} (duration: ${duration}s)`,
    );
  }

  /**
   * Actualiza metadata de la encuesta (info del encuestado, notas, etc.)
   */
  static async updateMetadata(
    responseId: string,
    input: UpdateSurveyMetadataInput,
  ): Promise<void> {
    const db = getDatabase();

    await db
      .update(surveyResponses)
      .set({
        respondentName: input.respondentName,
        respondentPhone: input.respondentPhone,
        respondentEmail: input.respondentEmail,
        notes: input.notes,
        tags: input.tags ? input.tags : null,
        address: input.address,
      })
      .where(eq(surveyResponses.id, responseId));

    console.log(`📝 Metadata updated for response: ${responseId}`);
  }

  /**
   * Valida o invalida una encuesta (usado por encargados)
   */
  static async validateResponse(input: ValidateSurveyInput): Promise<void> {
    const db = getDatabase();

    await db
      .update(surveyResponses)
      .set({
        isValidated: input.isValidated,
        validatedBy: input.validatedBy,
        validatedAt: new Date(),
      })
      .where(eq(surveyResponses.id, input.responseId));

    console.log(
      `${input.isValidated ? "✅" : "❌"} Response ${input.responseId} validated by ${input.validatedBy}`,
    );
  }

  /**
   * Obtiene una encuesta por ID con todas sus respuestas
   */
  static async getResponseById(responseId: string) {
    const db = getDatabase();

    const response = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.id, responseId))
      .get();

    if (!response) {
      return null;
    }

    // Obtener todas las respuestas
    const answers = await db
      .select()
      .from(questionAnswers)
      .where(eq(questionAnswers.responseId, responseId))
      .all();

    return {
      ...response,
      answers: answers.map((a) => ({
        ...a,
        value: JSON.parse(a.value as string),
      })),
    };
  }

  /**
   * Lista encuestas del usuario actual
   */
  static async listResponses(userId: string, status?: SurveyResponseStatus) {
    const db = getDatabase();

    const conditions = status
      ? and(
          eq(surveyResponses.collectedBy, userId),
          eq(surveyResponses.status, status),
        )
      : eq(surveyResponses.collectedBy, userId);

    const results = await db
      .select({
        response: surveyResponses,
        schema: surveySchemas,
      })
      .from(surveyResponses)
      .innerJoin(surveySchemas, eq(surveyResponses.schemaId, surveySchemas.id))
      .where(conditions)
      .orderBy(desc(surveyResponses.startedAt))
      .all();

    return results.map((r) => ({
      id: r.response.id,
      schemaId: r.response.schemaId,
      schemaName: r.schema.name,
      schemaVersion: r.response.schemaVersion,
      status: r.response.status as SurveyResponseStatus,
      progress: r.response.progress || 0,
      startedAt: new Date(r.response.startedAt),
      completedAt: r.response.completedAt
        ? new Date(r.response.completedAt)
        : null,
    }));
  }

  /**
   * Cuenta encuestas pendientes de sincronizar
   */
  static async countPendingSync(): Promise<number> {
    const db = getDatabase();

    const result = await db
      .select()
      .from(surveyResponses)
      .where(eq(surveyResponses.status, "completed"))
      .all();

    return result.length;
  }

  /**
   * Obtiene respuestas de una pregunta específica
   */
  static async getQuestionAnswer(responseId: string, questionId: string) {
    const db = getDatabase();

    const answer = await db
      .select()
      .from(questionAnswers)
      .where(
        and(
          eq(questionAnswers.responseId, responseId),
          eq(questionAnswers.questionId, questionId),
        ),
      )
      .get();

    if (!answer) {
      return null;
    }

    return {
      ...answer,
      value: JSON.parse(answer.value as string),
    };
  }
}
