/**
 * Map and team location data API helpers
 * Encargado can view their brigade members' last survey responses with locations
 */

import { apiClient } from "./client";
import { timedCall } from "./utils";

export interface TeamResponse {
  id: number;
  user_id: number;
  brigadista_name: string;
  survey_title: string;
  survey_id: number | null;
  version_id: number;
  client_id: string;
  completed_at: string; // ISO datetime
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  answer_count: number;
}

export interface TeamResponsesPage {
  items: TeamResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

/**
 * Get survey responses from team members (for map visualization)
 * Groups by brigadista to show their last location
 */
export async function getTeamResponses(
  skip: number = 0,
  limit: number = 50,
): Promise<TeamResponsesPage> {
  return timedCall("getTeamResponses", async () => {
    const response = await apiClient.get<TeamResponsesPage>(
      "/assignments/my-team-responses",
      { params: { skip, limit } },
    );
    return response.data;
  });
}

/**
 * Process team responses to get latest location per brigadista
 * Returns map of user_id -> last response with location
 */
export function getLatestLocationsPerBrigadista(responses: TeamResponse[]): Map<
  number,
  {
    brigadista_name: string;
    location: { latitude: number; longitude: number; accuracy?: number };
    completed_at: string;
    survey_id: number | null;
    survey_title: string;
  }
> {
  const locationMap = new Map();

  // Sort by completed_at descending to ensure we get the latest
  const sorted = [...responses].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );

  for (const response of sorted) {
    if (
      response.location?.latitude !== undefined &&
      response.location?.longitude !== undefined &&
      !locationMap.has(response.user_id)
    ) {
      locationMap.set(response.user_id, {
        brigadista_name: response.brigadista_name,
        location: {
          latitude: response.location.latitude,
          longitude: response.location.longitude,
          accuracy: response.location.accuracy,
        },
        completed_at: response.completed_at,
        survey_id: response.survey_id,
        survey_title: response.survey_title,
      });
    }
  }

  return locationMap;
}

/**
 * Calculate freshness indicator in minutes
 */
export function calculateFreshness(completedAt: string): string {
  const now = new Date();
  const completed = new Date(completedAt);
  const diffMs = now.getTime() - completed.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins === 1) return "Hace 1 minuto";
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffMins < 120) return "Hace 1 hora";
  const hours = Math.round(diffMins / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.round(diffMins / 1440);
  return `Hace ${days} días`;
}
