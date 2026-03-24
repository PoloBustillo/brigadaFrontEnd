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

export interface AssignmentUpdatePayload {
  status?: "active" | "inactive";
  location?: string | null;
  notes?: string | null;
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
    () =>
      apiClient
        .get<AssignmentDetail[]>("/assignments/by-me", { params })
        .then((r) => r.data),
    (items) => `${items.length} items`,
  );
}

/** PATCH /assignments/{id} — update assignment status/location/notes */
export async function updateAssignment(
  assignmentId: number,
  payload: AssignmentUpdatePayload,
): Promise<AssignmentDetail> {
  return timedCall(
    `PATCH /assignments/${assignmentId}`,
    () =>
      apiClient
        .patch<AssignmentDetail>(`/assignments/${assignmentId}`, payload)
        .then((r) => r.data),
    (item) => `assignment ${item.id}`,
  );
}

/** GET /assignments/my-team — unique brigadistas assigned by current encargado */
export async function getMyTeam(): Promise<TeamMember[]> {
  return timedCall(
    "GET /assignments/my-team",
    () =>
      apiClient.get<TeamMember[]>("/assignments/my-team").then((r) => r.data),
    (items) => `${items.length} items`,
  );
}

export interface PaginatedTeamResponse {
  items: TeamResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

/** GET /assignments/my-team-responses — responses from team members (paginated) */
export async function getTeamResponses(
  skip = 0,
  limit = 20,
): Promise<PaginatedTeamResponse> {
  return timedCall(
    "GET /assignments/my-team-responses",
    () =>
      apiClient
        .get<PaginatedTeamResponse>("/assignments/my-team-responses", {
          params: { skip, limit },
        })
        .then((r) => r.data),
    (res) => `${res.items.length}/${res.total} items`,
  );
}

/**
 * Fetches ALL team responses — used by the encargado dashboard stats.
 * Still paginates internally until the server is exhausted.
 */
export async function getAllTeamResponses(
  pageSize = 500,
): Promise<TeamResponse[]> {
  const all: TeamResponse[] = [];
  let skip = 0;
  const t0 = Date.now();
  while (true) {
    const page = await getTeamResponses(skip, pageSize);
    all.push(...page.items);
    if (!page.has_more) break;
    skip += page.items.length;
  }
  console.log(
    `[API] getAllTeamResponses → ${all.length} total en ${Date.now() - t0}ms`,
  );
  return all;
}

// ---------------------------------------------------------------------------
// Invite & Assignment Creation API

export interface AssignmentCreatePayload {
  user_id: number;
  survey_id: number;
  location?: string;
  notes?: string;
}

/**
 * POST /assignments — Create a new assignment
 * Assigns a survey to a brigadista (or encargado to another encargado)
 */
export async function createAssignment(
  payload: AssignmentCreatePayload,
): Promise<AssignmentResponse> {
  return timedCall(
    "POST /assignments",
    () =>
      apiClient
        .post<AssignmentResponse>("/assignments", payload)
        .then((r) => r.data),
    (item) => `assigned survey_id=${item.survey_id} to user_id=${item.user_id}`,
  );
}

/** Available brigadista for assignment */
export interface BrigadistaForAssignment extends UserMini {
  id: number;
  full_name: string;
  email: string;
}

/**
 * GET /users?role=brigadista — List available brigadistas
 * Only ENCARGADO can call this; returns brigadistas in their scope
 */
export async function getAvailableBrigadistas(
  search?: string,
  skip = 0,
  limit = 100,
): Promise<BrigadistaForAssignment[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const params: Record<string, any> = {
    role: "brigadista",
    skip,
    limit: safeLimit,
  };
  if (search) params.search = search;
  return timedCall(
    "GET /users?role=brigadista",
    () =>
      apiClient
        .get<BrigadistaForAssignment[]>("/users", { params })
        .then((r) => r.data),
    (items) => `${items.length} items`,
  );
}
// ---------------------------------------------------------------------------
// Invitation API

export interface WhitelistCreatePayload {
  identifier: string; // email
  identifier_type: string; // "email"
  full_name: string;
  phone?: string;
  assigned_role: string; // "brigadista"
  assigned_survey_id: number;
  notes?: string;
}

/**
 * POST /admin/whitelist — Invite a brigadista
 * ENCARGADO can only invite brigadistas to surveys they manage
 */
export async function inviteBrigadista(
  payload: WhitelistCreatePayload,
): Promise<any> {
  return timedCall(
    "POST /admin/whitelist",
    () => apiClient.post<any>("/admin/whitelist", payload).then((r) => r.data),
    () => `invited ${payload.full_name}`,
  );
}
