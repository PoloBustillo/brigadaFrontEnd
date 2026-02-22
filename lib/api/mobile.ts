/**
 * Mobile API — Brigadista endpoints
 * Base: GET/POST /mobile/*
 */
import { apiClient } from "./client";
import { timedCall, withRetry } from "./utils";

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

export interface QuestionAnswerDetail {
  id: number;
  question_id: number;
  answer_value: any;
  media_url: string | null;
  answered_at: string;
}

export interface SurveyResponseDetail {
  id: number;
  user_id: number;
  version_id: number;
  client_id: string;
  location: Record<string, any> | null;
  started_at: string | null;
  completed_at: string;
  synced_at: string;
  device_info: Record<string, any> | null;
  answers: QuestionAnswerDetail[];
}

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * GET /mobile/surveys
 * Returns all surveys assigned to the current brigadista (with latest published version).
 * Retries once after 1.2 s on failure.
 */
export async function getAssignedSurveys(
  statusFilter?: "active" | "inactive",
): Promise<AssignedSurveyResponse[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : "";
  return timedCall(
    `GET /mobile/surveys${params}`,
    () =>
      withRetry(
        () =>
          apiClient
            .get<AssignedSurveyResponse[]>(`/mobile/surveys${params}`, {
              timeout: 60000,
            })
            .then((r) => r.data),
        2,
        1200,
      ),
    (items) => `${items.length} items`,
  );
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export interface QuestionAnswerCreate {
  question_id: number;
  answer_value: any;
  answered_at: string; // ISO 8601
  media_url?: string;
}

export interface SurveyResponseCreate {
  client_id: string;
  version_id: number;
  started_at?: string;
  completed_at: string;
  location?: Record<string, any>;
  device_info?: Record<string, any>;
  answers: QuestionAnswerCreate[];
}

export interface BatchResponseResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  results: {
    client_id: string;
    status: string;
    response_id?: number;
    message?: string;
    errors: string[];
    warnings: string[];
  }[];
}

/**
 * POST /mobile/responses/batch
 * Submit one completed response (wrapped in a batch of 1).
 */
export async function submitBatchResponses(
  response: SurveyResponseCreate,
): Promise<BatchResponseResult> {
  return timedCall(
    "POST /mobile/responses/batch",
    () =>
      apiClient
        .post<BatchResponseResult>("/mobile/responses/batch", {
          responses: [response],
        })
        .then((r) => r.data),
  );
}

/**
 * GET /mobile/responses/me
 * Returns the current user's submitted responses.
 */
export async function getMyResponses(
  skip = 0,
  limit = 100,
): Promise<SurveyResponseDetail[]> {
  return timedCall(
    `GET /mobile/responses/me`,
    () =>
      apiClient
        .get<SurveyResponseDetail[]>(`/mobile/responses/me`, {
          params: { skip, limit },
        })
        .then((r) => r.data),
    (items) => `${items.length} items`,
  );
}
