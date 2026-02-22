/**
 * Assignments API — Encargado endpoints
 * Backend: /assignments/by-me  /assignments/my-team  /assignments/my-team-responses
 */

import { apiClient } from "./client";
import type { SurveyMini, UserMini } from "./types";
import { timedCall } from "./utils";

// Re-export for consumers that import from this file
export type { SurveyMini, UserMini } from "./types";

// ---------------------------------------------------------------------------
// Types

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
  return timedCall(
    "GET /assignments/by-me",
    () => apiClient.get<AssignmentDetail[]>("/assignments/by-me", { params }).then((r) => r.data),
    (items) => `${items.length} items`,
  );
}

/** GET /assignments/my-team — unique brigadistas assigned by current encargado */
export async function getMyTeam(): Promise<TeamMember[]> {
  return timedCall(
    "GET /assignments/my-team",
    () => apiClient.get<TeamMember[]>("/assignments/my-team").then((r) => r.data),
    (items) => `${items.length} items`,
  );
}

/** GET /assignments/my-team-responses — responses from team members */
export async function getTeamResponses(
  skip = 0,
  limit = 100,
): Promise<TeamResponse[]> {
  return timedCall(
    "GET /assignments/my-team-responses",
    () =>
      apiClient
        .get<TeamResponse[]>("/assignments/my-team-responses", { params: { skip, limit } })
        .then((r) => r.data),
    (items) => `${items.length} items`,
  );
}

/**
 * Fetches ALL team responses by paginating until the server returns fewer items
 * than the requested page size (signals last page).
 */
export async function getAllTeamResponses(pageSize = 500): Promise<TeamResponse[]> {
  const all: TeamResponse[] = [];
  let skip = 0;
  const t0 = Date.now();
  while (true) {
    const page = await getTeamResponses(skip, pageSize);
    all.push(...page);
    if (page.length < pageSize) break; // last page
    skip += page.length;
  }
  console.log(`[API] getAllTeamResponses → ${all.length} total en ${Date.now() - t0}ms`);
  return all;
}
