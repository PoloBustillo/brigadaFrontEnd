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
  statusFilter?: "active" | "inactive",
): Promise<AssignedSurveyResponse[]> {
  const params = statusFilter ? `?status_filter=${statusFilter}` : "";
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= ASSIGNED_SURVEYS_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data } = await apiClient.get<AssignedSurveyResponse[]>(
        `/mobile/surveys${params}`,
        { timeout: ASSIGNED_SURVEYS_TIMEOUT_MS },
      );
      return data;
    } catch (error) {
      lastError = error;

      if (attempt === ASSIGNED_SURVEYS_RETRY_ATTEMPTS) {
        break;
      }

      await sleep(ASSIGNED_SURVEYS_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

/**
 * GET /mobile/surveys/:surveyId/latest
 * Returns the latest published version of a specific survey.
 */
export async function getLatestSurveyVersion(
  surveyId: number,
): Promise<SurveyVersionResponse> {
  const { data } = await apiClient.get<SurveyVersionResponse>(
    `/mobile/surveys/${surveyId}/latest`,
  );
  return data;
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
  results: {
    client_id: string;
    status: string;
    response_id?: number;
    errors: string[];
  }[];
}

/**
 * POST /mobile/responses/batch
 * Submit one completed response (wrapped in a batch of 1).
 */
export async function submitBatchResponses(
  response: SurveyResponseCreate,
): Promise<BatchResponseResult> {
  const { data } = await apiClient.post<BatchResponseResult>(
    "/mobile/responses/batch",
    { responses: [response] },
  );
  return data;
}

/**
 * GET /mobile/responses/me
 * Returns the current user's submitted responses.
 */
export async function getMyResponses(
  skip = 0,
  limit = 100,
): Promise<SurveyResponseDetail[]> {
  const { data } = await apiClient.get<SurveyResponseDetail[]>(
    `/mobile/responses/me?skip=${skip}&limit=${limit}`,
  );
  return data;
}
