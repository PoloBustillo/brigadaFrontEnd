/**
 * Mobile API — Brigadista endpoints
 * Base: GET/POST /mobile/*
 */
import { apiClient } from "./client";

const ASSIGNED_SURVEYS_TIMEOUT_MS = 60000;
const ASSIGNED_SURVEYS_RETRY_ATTEMPTS = 2;
const ASSIGNED_SURVEYS_RETRY_DELAY_MS = 1200;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

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
 */
export async function getAssignedSurveys(
  statusFilter?: "active" | "inactive",
): Promise<AssignedSurveyResponse[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : "";
  let lastError: unknown = null;
  const t0 = Date.now();

  for (let attempt = 1; attempt <= ASSIGNED_SURVEYS_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data } = await apiClient.get<AssignedSurveyResponse[]>(
        `/mobile/surveys${params}`,
        { timeout: ASSIGNED_SURVEYS_TIMEOUT_MS },
      );
      console.log(`[API] GET /mobile/surveys → ${data.length} items en ${Date.now() - t0}ms (intento ${attempt})`, data);
      return data;
    } catch (error) {
      lastError = error;
      console.warn(`[API] GET /mobile/surveys → intento ${attempt} fallido en ${Date.now() - t0}ms`, error);

      if (attempt === ASSIGNED_SURVEYS_RETRY_ATTEMPTS) {
        break;
      }

      await sleep(ASSIGNED_SURVEYS_RETRY_DELAY_MS);
    }
  }

  console.error(`[API] GET /mobile/surveys → todos los intentos fallaron en ${Date.now() - t0}ms`);
  throw lastError;
}

/**
 * GET /mobile/surveys/:surveyId/latest
 * Returns the latest published version of a specific survey.
 */
export async function getLatestSurveyVersion(
  surveyId: number,
): Promise<SurveyVersionResponse> {
  const t0 = Date.now();
  try {
    const { data } = await apiClient.get<SurveyVersionResponse>(
      `/mobile/surveys/${surveyId}/latest`,
    );
    console.log(`[API] GET /mobile/surveys/${surveyId}/latest → OK en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] GET /mobile/surveys/${surveyId}/latest → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
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
  const t0 = Date.now();
  try {
    const { data } = await apiClient.post<BatchResponseResult>(
      "/mobile/responses/batch",
      { responses: [response] },
    );
    console.log(`[API] POST /mobile/responses/batch → OK en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] POST /mobile/responses/batch → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}

/**
 * GET /mobile/responses/me
 * Returns the current user's submitted responses.
 */
export async function getMyResponses(
  skip = 0,
  limit = 100,
): Promise<SurveyResponseDetail[]> {
  const t0 = Date.now();
  try {
    const { data } = await apiClient.get<SurveyResponseDetail[]>(
      `/mobile/responses/me?skip=${skip}&limit=${limit}`,
    );
    console.log(`[API] GET /mobile/responses/me → ${data.length} items en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] GET /mobile/responses/me → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}
