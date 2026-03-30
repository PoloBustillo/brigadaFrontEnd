import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import type { User } from "@/types/user";

interface PermissionSnapshot {
  user_id: number;
  role: User["role"];
  role_template: string | null;
  permissions: string[];
  updated_at: string;
}

const buildCacheKey = (userId: number): string =>
  `auth_permissions_snapshot:user:${userId}`;

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized = new Set<string>();
  for (const permission of raw) {
    if (typeof permission !== "string") {
      continue;
    }

    const trimmed = permission.trim();
    if (!trimmed) {
      continue;
    }

    normalized.add(trimmed);
  }

  return Array.from(normalized).sort();
}

export async function saveUserPermissionSnapshot(
  user: Pick<User, "id" | "role" | "role_template" | "permissions">,
): Promise<void> {
  const permissions = normalizePermissions(user.permissions);
  if (permissions.length === 0) {
    return;
  }

  const snapshot: PermissionSnapshot = {
    user_id: user.id,
    role: user.role,
    role_template: user.role_template ?? null,
    permissions,
    updated_at: new Date().toISOString(),
  };

  await cacheRepository.set(buildCacheKey(user.id), snapshot);
}

export async function getUserPermissionSnapshot(
  userId: number,
): Promise<string[] | null> {
  const snapshot = await cacheRepository.get<PermissionSnapshot>(
    buildCacheKey(userId),
    true,
  );

  if (!snapshot) {
    return null;
  }

  const permissions = normalizePermissions(snapshot.permissions);
  return permissions.length > 0 ? permissions : null;
}

export async function clearUserPermissionSnapshot(
  userId: number | null | undefined,
): Promise<void> {
  if (!userId || !Number.isInteger(userId)) {
    return;
  }

  await cacheRepository.delete(buildCacheKey(userId));
}
