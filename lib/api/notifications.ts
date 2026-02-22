/**
 * Notifications API — Mobile endpoints
 * Base: /mobile/notifications
 */
import { apiClient } from "./client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/**
 * GET /mobile/notifications
 */
export async function getNotifications(
  options: { skip?: number; limit?: number; unreadOnly?: boolean } = {},
): Promise<NotificationListResponse> {
  const params: Record<string, string | number | boolean> = {};
  if (options.skip !== undefined) params.skip = options.skip;
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.unreadOnly) params.unread_only = true;

  const { data } = await apiClient.get<NotificationListResponse>(
    "/mobile/notifications",
    { params },
  );
  return data;
}

/**
 * GET /mobile/notifications/unread-count
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    "/mobile/notifications/unread-count",
  );
  return data.count;
}

/**
 * PATCH /mobile/notifications/:id/read
 */
export async function markNotificationRead(
  notificationId: number,
): Promise<NotificationItem> {
  const { data } = await apiClient.patch<NotificationItem>(
    `/mobile/notifications/${notificationId}/read`,
  );
  return data;
}

/**
 * PATCH /mobile/notifications/read-all
 */
export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.patch<{ updated: number }>(
    "/mobile/notifications/read-all",
  );
  return data;
}
