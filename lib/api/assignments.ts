/**
 * Assignments API — Encargado endpoints
 * Backend: /assignments/by-me  /assignments/my-team  /assignments/my-team-responses
 */

import { apiClient } from "./client";

// ---------------------------------------------------------------------------
// Types

export interface UserMini {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface SurveyMini {
  id: number;
  title: string;
}

/** Matches AssignmentDetailResponse */
export interface AssignmentDetail {
  id: number;
  user_id: number;
  user: UserMini;
  survey_id: number;
  survey: SurveyMini;
  assigned_by: number | null;
  assigned_by_user: UserMini | null;
  status: "active" | "inactive";
  location: string | null;
  notes: string | null;
  response_count: number;
  created_at: string;
  updated_at: string | null;
}

/** Matches GET /assignments/my-team */
export type TeamMember = UserMini;

/** Matches GET /assignments/my-team-responses */
export interface TeamResponse {
  id: number;
  user_id: number;
  brigadista_name: string;
  survey_title: string;
  survey_id: number | null;
  version_id: number;
  client_id: string;
  completed_at: string | null;
  location: object | null;
  answer_count: number;
}

// ---------------------------------------------------------------------------
// API calls

/** GET /assignments/by-me — assignments created by the current encargado */
export async function getMyCreatedAssignments(
  status?: "active" | "inactive",
): Promise<AssignmentDetail[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const t0 = Date.now();
  try {
    const { data } = await apiClient.get<AssignmentDetail[]>(
      "/assignments/by-me",
      { params },
    );
    console.log(`[API] GET /assignments/by-me → ${data.length} items en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] GET /assignments/by-me → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}

/** GET /assignments/my-team — unique brigadistas assigned by current encargado */
export async function getMyTeam(): Promise<TeamMember[]> {
  const t0 = Date.now();
  try {
    const { data } = await apiClient.get<TeamMember[]>("/assignments/my-team");
    console.log(`[API] GET /assignments/my-team → ${data.length} items en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] GET /assignments/my-team → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}

/** GET /assignments/my-team-responses — responses from team members */
export async function getTeamResponses(
  skip = 0,
  limit = 100,
): Promise<TeamResponse[]> {
  const t0 = Date.now();
  try {
    const { data } = await apiClient.get<TeamResponse[]>(
      "/assignments/my-team-responses",
      { params: { skip, limit } },
    );
    console.log(`[API] GET /assignments/my-team-responses → ${data.length} items en ${Date.now() - t0}ms`, data);
    return data;
  } catch (err) {
    console.error(`[API] GET /assignments/my-team-responses → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}
