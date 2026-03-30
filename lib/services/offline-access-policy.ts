import type { User } from "@/types/user";

export interface OfflineAccessPolicy {
  canViewSurveys: boolean;
  canFillSurveys: boolean;
  canViewResponses: boolean;
  canCreateResponse: boolean;
  canEditResponse: boolean;
  canUploadDocuments: boolean;
  canSync: boolean;
  canAccessReports: boolean;
  allowedEndpoints: string[];
}

type UserLike = Pick<User, "permissions"> | null | undefined;

type ActionPermissionMap = {
  [K in Exclude<keyof OfflineAccessPolicy, "allowedEndpoints">]: string[];
};

const ACTION_PERMISSION_MAP: ActionPermissionMap = {
  canViewSurveys: ["view_surveys"],
  canFillSurveys: ["submit_response"],
  canViewResponses: ["view_own_responses", "view_assigned_responses", "view_all_responses"],
  canCreateResponse: ["submit_response"],
  canEditResponse: ["submit_response"],
  canUploadDocuments: ["submit_response"],
  canSync: ["submit_response"],
  canAccessReports: ["view_assigned_responses", "view_all_responses"],
};

const ENDPOINT_REQUIREMENTS: { endpoint: string; anyOf: string[] }[] = [
  { endpoint: "/mobile/surveys", anyOf: ["view_surveys"] },
  { endpoint: "/mobile/responses/batch", anyOf: ["submit_response"] },
  { endpoint: "/mobile/documents/upload", anyOf: ["submit_response"] },
  { endpoint: "/mobile/documents/confirm", anyOf: ["submit_response"] },
  {
    endpoint: "/mobile/responses",
    anyOf: ["view_own_responses", "view_assigned_responses", "view_all_responses"],
  },
];

function getEffectivePermissions(user: UserLike): string[] {
  if (!user?.permissions || !Array.isArray(user.permissions)) {
    return [];
  }

  const deduped = new Set<string>();
  for (const permission of user.permissions) {
    if (typeof permission !== "string") continue;
    const normalized = permission.trim();
    if (!normalized) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped);
}

function hasAnyPermission(
  effectivePermissions: string[],
  requiredPermissions: string[],
): boolean {
  if (requiredPermissions.length === 0) return true;
  return requiredPermissions.some((permission) =>
    effectivePermissions.includes(permission),
  );
}

function buildAllowedEndpoints(effectivePermissions: string[]): string[] {
  return ENDPOINT_REQUIREMENTS.filter((item) =>
    hasAnyPermission(effectivePermissions, item.anyOf),
  ).map((item) => item.endpoint);
}

export function resolveOfflinePolicyForUser(user: UserLike): OfflineAccessPolicy {
  const effectivePermissions = getEffectivePermissions(user);

  return {
    canViewSurveys: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canViewSurveys,
    ),
    canFillSurveys: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canFillSurveys,
    ),
    canViewResponses: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canViewResponses,
    ),
    canCreateResponse: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canCreateResponse,
    ),
    canEditResponse: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canEditResponse,
    ),
    canUploadDocuments: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canUploadDocuments,
    ),
    canSync: hasAnyPermission(effectivePermissions, ACTION_PERMISSION_MAP.canSync),
    canAccessReports: hasAnyPermission(
      effectivePermissions,
      ACTION_PERMISSION_MAP.canAccessReports,
    ),
    allowedEndpoints: buildAllowedEndpoints(effectivePermissions),
  };
}

export function canPerformOfflineActionForUser(
  user: UserLike,
  action: keyof OfflineAccessPolicy,
): { allowed: boolean; reason?: string } {
  const policy = resolveOfflinePolicyForUser(user);
  const allowed = policy[action];

  if (allowed) {
    return { allowed: true };
  }

  const actionLabels: Record<keyof OfflineAccessPolicy, string> = {
    canViewSurveys: "View surveys",
    canFillSurveys: "Fill surveys",
    canViewResponses: "View responses",
    canCreateResponse: "Create responses",
    canEditResponse: "Edit responses",
    canUploadDocuments: "Upload documents",
    canSync: "Sync data",
    canAccessReports: "Access reports",
    allowedEndpoints: "Use API",
  };

  return {
    allowed: false,
    reason: `${actionLabels[action]} requires additional permissions while offline`,
  };
}

export function getPolicySummaryForUser(user: UserLike): string {
  const policy = resolveOfflinePolicyForUser(user);

  if (policy.canFillSurveys && policy.canViewResponses) {
    return "Puedes trabajar encuestas y respuestas offline";
  }

  if (policy.canViewSurveys || policy.canViewResponses) {
    return "Acceso offline limitado por permisos";
  }

  return "Sin permisos efectivos para operar offline";
}
