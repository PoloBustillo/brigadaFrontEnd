import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import {
  canPerformOfflineActionForUser,
  getPolicySummaryForUser,
  resolveOfflinePolicyForUser,
  type OfflineAccessPolicy,
} from "@/lib/services/offline-access-policy";

interface UseOfflinePolicyResult {
  isOnline: boolean;
  role: string | null;
  policy: OfflineAccessPolicy | null;
  policySummary: string;
  can: (action: keyof OfflineAccessPolicy) => boolean;
  getReason: (action: keyof OfflineAccessPolicy) => string | undefined;
  isBlockedByRole: (action: keyof OfflineAccessPolicy) => boolean;
}

export function useOfflinePolicy(): UseOfflinePolicyResult {
  const { user } = useAuth();
  const { isOnline } = useSync();

  const role = user?.role ?? null;
  const policy = user ? resolveOfflinePolicyForUser(user) : null;

  const can = (action: keyof OfflineAccessPolicy): boolean => {
    if (isOnline) return true;
    return canPerformOfflineActionForUser(user, action).allowed;
  };

  const getReason = (action: keyof OfflineAccessPolicy): string | undefined => {
    if (isOnline) return undefined;
    return canPerformOfflineActionForUser(user, action).reason;
  };

  const isBlockedByRole = (action: keyof OfflineAccessPolicy): boolean => {
    if (isOnline) return false;
    return !canPerformOfflineActionForUser(user, action).allowed;
  };

  const policySummary = user ? getPolicySummaryForUser(user) : "";

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
