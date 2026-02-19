/**
 * Admin API Service
 * Read-only endpoints used by the mobile admin view.
 * All write operations are handled by the web CMS.
 */

import { apiClient } from "./client";

// ---------------------------------------------------------------------------
// Stats

export interface AdminStats {
  totalUsers: number;
  activeSurveys: number;
  completedAssignments: number;
  totalResponses: number;
  pendingAssignments: number;
  activeBrigadistas: number;
  responseRate: number;
  totalAssignments: number;
}

/** GET /admin/stats */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}

// ---------------------------------------------------------------------------
// Surveys

export interface AdminSurvey {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  versions: unknown[];
}

/** GET /admin/surveys */
export async function getAdminSurveys(): Promise<AdminSurvey[]> {
  const { data } = await apiClient.get<AdminSurvey[]>("/admin/surveys");
  return data;
}

// ---------------------------------------------------------------------------
// Users

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string; // "admin" | "brigadista" | "encargado" (lowercase from backend)
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

/** GET /users */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await apiClient.get<AdminUser[]>("/users");
  return data;
}
