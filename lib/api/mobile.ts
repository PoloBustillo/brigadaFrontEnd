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
  survey_type: "normal" | "gestion" | "extra";
  starts_at: string | null;
  ends_at: string | null;
  assignment_status: "active" | "inactive";
  management_status:
    | "pendiente"
    | "en_tramite"
    | "resuelto"
    | "problema"
    | null;
  assigned_location: string | null;
  latest_version: SurveyVersionResponse;
  assigned_at: string;
}

// ─── My responses types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface QuestionAnswerDetail {
  id: number;
  question_id: number;
  answer_value: any;
  media_url: string | null;
  answered_at: string;
  answer_meta?: Record<string, any> | null;
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
  capture_meta?: Record<string, any> | null;
  answers?: QuestionAnswerDetail[];
}

export interface ScoreConfigSummary {
  id: number;
  name: string;
  status: string;
  effective_from: string | null;
}

export interface ScoreBySurveyDetail {
  survey_id: number;
  version_id: number | null;
  score_survey: number;
  responses_count: number;
  component_breakdown?: Record<string, unknown> | null;
}

export interface ScoreSnapshotDetail {
  id: number;
  window_start: string;
  window_end: string;
  score_global: number;
  sample_size: number;
  reliability_flag: string;
  component_scores?: {
    activity?: number;
    sync?: number;
    quality?: number;
    total_responses?: number;
    coverage?: number;
    [key: string]: unknown;
  } | null;
  action_items?: Array<{
    type?: string;
    severity?: "low" | "medium" | "high" | string;
    message?: string;
    [key: string]: unknown;
  }> | null;
  created_at: string;
  config_version: ScoreConfigSummary | null;
  by_survey: ScoreBySurveyDetail[];
}

export interface LatestUserScoreResponse {
  user_id: number;
  snapshot: ScoreSnapshotDetail | null;
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

/**
 * GET /mobile/surveys/{surveyId}/latest
 * Returns the latest published version for a survey.
 */
export async function getLatestSurveyVersion(
  surveyId: number,
): Promise<SurveyVersionResponse | null> {
  try {
    const response = await apiClient.get<SurveyVersionResponse>(
      `/mobile/surveys/${surveyId}/latest`,
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export interface QuestionAnswerCreate {
  question_id: number;
  answer_value: any;
  answered_at: string; // ISO 8601
  media_url?: string;
  answer_meta?: Record<string, any>;
}

export interface SurveyResponseCreate {
  client_id: string;
  version_id: number;
  started_at?: string;
  completed_at: string;
  location?: Record<string, any>;
  device_info?: Record<string, any>;
  capture_meta?: Record<string, any>;
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
 * Submit one or more completed responses.
 * Accepts a single response (legacy) or an array for true batch.
 */
export async function submitBatchResponses(
  responses: SurveyResponseCreate | SurveyResponseCreate[],
): Promise<BatchResponseResult> {
  const batch = Array.isArray(responses) ? responses : [responses];
  return timedCall(`POST /mobile/responses/batch (${batch.length})`, () =>
    apiClient
      .post<BatchResponseResult>("/mobile/responses/batch", {
        responses: batch,
      })
      .then((r) => r.data),
  );
}

/**
 * GET /mobile/responses/me
 * Returns the current user's submitted responses (paginated).
 */
export async function getMyResponses(
  skip = 0,
  limit = 20,
): Promise<PaginatedResponse<SurveyResponseDetail>> {
  return timedCall(
    `GET /mobile/responses/me`,
    () =>
      apiClient
        .get<PaginatedResponse<SurveyResponseDetail>>(`/mobile/responses/me`, {
          params: { skip, limit },
        })
        .then((r) => r.data),
    (res) => `${res.items.length}/${res.total} items`,
  );
}

/**
 * GET /mobile/score/latest
 * Returns the latest brigadista score snapshot for the authenticated user.
 */
export async function getMyLatestScore(): Promise<LatestUserScoreResponse> {
  return timedCall(
    "GET /mobile/score/latest",
    () =>
      apiClient
        .get<LatestUserScoreResponse>("/mobile/score/latest")
        .then((r) => r.data),
    (res) =>
      res.snapshot
        ? `score=${Math.round(res.snapshot.score_global)}`
        : "no snapshot",
  );
}
