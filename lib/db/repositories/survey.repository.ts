/**
 * Survey Repository
 *
 * Capa de acceso a datos para la tabla surveys
 */

import type { SurveySchemaJSON } from "@/types";
import { db } from "../database";

export interface SurveyRecord {
  id: number;
  survey_id: string;
  version: string;
  title: string;
  description: string | null;
  category: string;
  schema_json: string; // JSON serializado
  author: string;
  estimated_duration: number;
  tags: string | null; // JSON array
  is_active: boolean;
  is_published: boolean;
  sync_status: "pending" | "syncing" | "synced" | "error";
  last_synced_at: string | null;
  remote_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export class SurveyRepository {
  /**
   * Obtener todas las encuestas activas
   */
  async getActiveSurveys(): Promise<SurveyRecord[]> {
    const connection = db.getConnection();

    const result = await connection.getAllAsync<SurveyRecord>(
      `SELECT * FROM surveys 
       WHERE is_active = 1 
       ORDER BY created_at DESC`,
    );

    return result;
  }

  /**
   * Obtener una encuesta por ID y versión
   */
  async getSurveyByIdAndVersion(
    surveyId: string,
    version: string,
  ): Promise<SurveyRecord | null> {
    const connection = db.getConnection();

    const result = await connection.getFirstAsync<SurveyRecord>(
      `SELECT * FROM surveys 
       WHERE survey_id = ? AND version = ?`,
      [surveyId, version],
    );

    return result ?? null;
  }

  /**
   * Obtener el schema JSON parseado de una encuesta
   */
  async getSurveySchema(
    surveyId: string,
    version: string,
  ): Promise<SurveySchemaJSON | null> {
    const survey = await this.getSurveyByIdAndVersion(surveyId, version);

    if (!survey) return null;

    try {
      return JSON.parse(survey.schema_json) as SurveySchemaJSON;
    } catch (error) {
      console.error("Error parsing survey schema:", error);
      return null;
    }
  }

  /**
   * Guardar o actualizar una encuesta
   */
  async upsertSurvey(survey: {
    survey_id: string;
    version: string;
    title: string;
    description?: string;
    category: string;
    schema_json: SurveySchemaJSON;
    author: string;
    estimated_duration: number;
    tags?: string[];
    is_active?: boolean;
    is_published?: boolean;
  }): Promise<void> {
    const connection = db.getConnection();

    const tagsJson = survey.tags ? JSON.stringify(survey.tags) : null;
    const schemaJson = JSON.stringify(survey.schema_json);

    await connection.runAsync(
      `INSERT INTO surveys (
        survey_id, version, title, description, category,
        schema_json, author, estimated_duration, tags,
        is_active, is_published, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(survey_id, version) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        schema_json = excluded.schema_json,
        updated_at = datetime('now')`,
      [
        survey.survey_id,
        survey.version,
        survey.title,
        survey.description ?? null,
        survey.category,
        schemaJson,
        survey.author,
        survey.estimated_duration,
        tagsJson,
        survey.is_active ?? true,
        survey.is_published ?? false,
        "synced",
      ],
    );
  }

  /**
   * Obtener encuestas por categoría
   */
  async getSurveysByCategory(category: string): Promise<SurveyRecord[]> {
    const connection = db.getConnection();

    const result = await connection.getAllAsync<SurveyRecord>(
      `SELECT * FROM surveys 
       WHERE category = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [category],
    );

    return result;
  }

  /**
   * Buscar encuestas por título o tags
   */
  async searchSurveys(query: string): Promise<SurveyRecord[]> {
    const connection = db.getConnection();

    const searchPattern = `%${query}%`;

    const result = await connection.getAllAsync<SurveyRecord>(
      `SELECT * FROM surveys 
       WHERE is_active = 1 
       AND (
         title LIKE ? 
         OR description LIKE ? 
         OR tags LIKE ?
       )
       ORDER BY created_at DESC`,
      [searchPattern, searchPattern, searchPattern],
    );

    return result;
  }

  /**
   * Marcar encuesta como sincronizada
   */
  async markAsSynced(surveyId: string, version: string): Promise<void> {
    const connection = db.getConnection();

    await connection.runAsync(
      `UPDATE surveys 
       SET sync_status = 'synced', 
           last_synced_at = datetime('now')
       WHERE survey_id = ? AND version = ?`,
      [surveyId, version],
    );
  }

  /**
   * Desactivar una encuesta
   */
  async deactivateSurvey(surveyId: string, version: string): Promise<void> {
    const connection = db.getConnection();

    await connection.runAsync(
      `UPDATE surveys 
       SET is_active = 0, 
           updated_at = datetime('now')
       WHERE survey_id = ? AND version = ?`,
      [surveyId, version],
    );
  }
}

export const surveyRepository = new SurveyRepository();
