/**
 * API Shared Utilities
 * Error extraction, response mapping, timing, and retry helpers.
 *
 * Centralises logic that was previously duplicated across auth.ts,
 * mobile.ts and assignments.ts.
 */

import type { User } from "@/types/user";
import type { UserResponse } from "./types";

// ── Error handling ────────────────────────────────────────────────────────────

/**
 * Extract a human-readable error message from any API error.
 *
 * Priority:
 *  1. New envelope format  → { message: "..." }
 *  2. FastAPI detail str   → { detail: "..." }
 *  3. FastAPI detail array → { detail: [{ msg: "..." }] }
 *  4. Error.message
 *  5. `fallback`
 */
export function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const firstMsg = data.detail[0]?.msg;
    if (typeof firstMsg === "string" && firstMsg.trim()) return firstMsg;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

// ── User mapping ──────────────────────────────────────────────────────────────

/**
 * Map a `UserResponse` (API shape) to the internal `User` type.
 * Used by getCurrentUser, updateProfile and uploadAvatar.
 */
export function mapUser(profile: UserResponse): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    role: (profile.role as string).toUpperCase() as User["role"],
    state: profile.is_active ? "ACTIVE" : "DISABLED",
    created_at: new Date(profile.created_at).getTime(),
    updated_at: profile.updated_at
      ? new Date(profile.updated_at).getTime()
      : Date.now(),
  };
}

// ── Timing + logging ──────────────────────────────────────────────────────────

/**
 * Execute an async operation and emit structured timing logs.
 *
 * @param label  Log prefix, e.g. `"GET /mobile/surveys"`
 * @param fn     The async operation to run
 * @param format Optional formatter for the success log (e.g. array length)
 *
 * @example
 * return timedCall(`GET /mobile/surveys${params}`, () =>
 *   apiClient.get<...>(`/mobile/surveys${params}`).then(r => r.data),
 *   (items) => `${items.length} items`
 * );
 */
export async function timedCall<T>(
  label: string,
  fn: () => Promise<T>,
  format?: (result: T) => string,
): Promise<T> {
  const t0 = Date.now();
  try {
    const result = await fn();
    const suffix = format ? ` → ${format(result)}` : "";
    console.log(`[API] ${label}${suffix} en ${Date.now() - t0}ms`);
    return result;
  } catch (err) {
    console.error(`[API] ${label} → ERROR en ${Date.now() - t0}ms`, err);
    throw err;
  }
}

// ── Retry ─────────────────────────────────────────────────────────────────────

/**
 * Retry an async fn up to `attempts` times, with `delayMs` between failures.
 *
 * @param fn       Receives the current attempt number (1-based)
 * @param attempts Maximum number of tries
 * @param delayMs  Milliseconds to wait between attempts
 *
 * @example
 * return withRetry(
 *   () => apiClient.get('/mobile/surveys').then(r => r.data),
 *   2,
 *   1200,
 * );
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  attempts: number,
  delayMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn(i);
    } catch (err) {
      lastError = err;
      if (i < attempts) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
