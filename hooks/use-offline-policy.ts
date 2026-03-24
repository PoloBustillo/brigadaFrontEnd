/**
 * useOfflinePolicy - Check offline access permissions
 *
 * Hook that checks if current user can perform an action while offline
 * based on their role and pre-defined policies.
 */

import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import {
  canPerformOfflineAction,
  getPolicySummary,
  OFFLINE_POLICIES,
  type OfflineAccessPolicy,
  type UserRole,
} from "@/lib/services/offline-access-policy";

interface UseOfflinePolicyResult {
  isOnline: boolean;
  role: UserRole | null;
  policy: OfflineAccessPolicy | null;
  policySummary: string;
  can: (action: keyof OfflineAccessPolicy) => boolean;
  getReason: (action: keyof OfflineAccessPolicy) => string | undefined;
  isBlockedByRole: (action: keyof OfflineAccessPolicy) => boolean;
}

export function useOfflinePolicy(): UseOfflinePolicyResult {
  const { user } = useAuth();
  const { isOnline } = useSync();

  const role = (user?.role as UserRole) || null;
  const policy = role ? OFFLINE_POLICIES[role] : null;

  const can = (action: keyof OfflineAccessPolicy): boolean => {
    if (isOnline) return true; // Always allowed online

    const check = canPerformOfflineAction(role as UserRole, action);
    return check.allowed;
  };

  const getReason = (action: keyof OfflineAccessPolicy): string | undefined => {
    if (isOnline) return undefined;

    const check = canPerformOfflineAction(role as UserRole, action);
    return check.reason;
  };

  const isBlockedByRole = (action: keyof OfflineAccessPolicy): boolean => {
    if (isOnline) return false;

    const check = canPerformOfflineAction(role as UserRole, action);
    return !check.allowed;
  };

  const policySummary = role ? getPolicySummary(role) : "";

  return {
    isOnline,
    role,
    policy,
    policySummary,
    can,
    getReason,
    isBlockedByRole,
  };
}
