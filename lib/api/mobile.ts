/**
 * Mobile API — Brigadista endpoints
 * Base: GET/POST /mobile/*
 */
import { apiClient } from "./client";

// ─── Response types ──────────────────────────────────────────────────────────

export interface AnswerOptionResponse {
  id: number;
  option_text: string;
  order: number;
}

export interface QuestionResponse {
  id: number;
  version_id: number;
  question_text: string;
  question_type: string;
  order: number;
  is_required: boolean;
  validation_rules: Record<string, unknown> | null;
  options: AnswerOptionResponse[];
}

export interface SurveyVersionResponse {
  id: number;
  version_number: number;
  is_published: boolean;
  change_summary: string | null;
  created_at: string;
  questions: QuestionResponse[];
}

export interface AssignedSurveyResponse {
  assignment_id: number;
  survey_id: number;
  survey_title: string;
  survey_description: string | null;
  assignment_status: "active" | "inactive";
  assigned_location: string | null;
  latest_version: SurveyVersionResponse;
  assigned_at: string;
}

// ─── My responses types ───────────────────────────────────────────────────────

export interface SurveyResponseDetail {
  id: number;
  assignment_id: number;
  survey_id: number;
  is_complete: boolean;
  submitted_at: string | null;
  created_at: string;
  answers: unknown[];
}

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * GET /mobile/surveys
 * Returns all surveys assigned to the current brigadista (with latest published version).
 */
export async function getAssignedSurveys(
  statusFilter?: "active" | "inactive"
): Promise<AssignedSurveyResponse[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : "";
  const { data } = await apiClient.get<AssignedSurveyResponse[]>(`/mobile/surveys${params}`);
  return data;
}

/**
 * GET /mobile/surveys/:surveyId/latest
 * Returns the latest published version of a specific survey.
 */
export async function getLatestSurveyVersion(
  surveyId: number
): Promise<SurveyVersionResponse> {
  const { data } = await apiClient.get<SurveyVersionResponse>(`/mobile/surveys/${surveyId}/latest`);
  return data;
}

/**
 * GET /mobile/responses/me
 * Returns the current user's submitted responses.
 */
export async function getMyResponses(
  skip = 0,
  limit = 100
): Promise<SurveyResponseDetail[]> {
  const { data } = await apiClient.get<SurveyResponseDetail[]>(
    `/mobile/responses/me?skip=${skip}&limit=${limit}`
  );
  return data;
}
