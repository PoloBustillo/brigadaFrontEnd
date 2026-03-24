/**
 * Offline Access Policy Manager
 *
 * Restricts functionality based on user role when offline
 * - BRIGADISTA: Can view and fill surveys, see cached responses
 * - ENCARGADO: Can view surveys and responses, limited actions
 * - ADMIN: Online-only access (except view cached data)
 * - AUDITOR: Online-only access (no offline mode)
 * - SUPERVISOR: Can view limited data when offline
 */

export type UserRole =
  | "BRIGADISTA"
  | "ENCARGADO"
  | "AUDITOR"
  | "SUPERVISOR"
  | "ADMIN";

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

export const OFFLINE_POLICIES: Record<UserRole, OfflineAccessPolicy> = {
  BRIGADISTA: {
    canViewSurveys: true,
    canFillSurveys: true,
    canViewResponses: true,
    canCreateResponse: true,
    canEditResponse: true,
    canUploadDocuments: true,
    canSync: true,
    canAccessReports: false,
    allowedEndpoints: [
      "/mobile/surveys",
      "/mobile/responses/batch",
      "/mobile/documents/upload",
      "/mobile/documents/confirm",
    ],
  },
  ENCARGADO: {
    canViewSurveys: true,
    canFillSurveys: true,
    canViewResponses: true,
    canCreateResponse: true,
    canEditResponse: false,
    canUploadDocuments: true,
    canSync: true,
    canAccessReports: true,
    allowedEndpoints: [
      "/mobile/surveys",
      "/mobile/responses",
      "/mobile/responses/batch",
      "/mobile/documents/upload",
      "/mobile/documents/confirm",
      "/mobile/v2/assignments",
    ],
  },
  SUPERVISOR: {
    canViewSurveys: true,
    canFillSurveys: false,
    canViewResponses: true,
    canCreateResponse: false,
    canEditResponse: false,
    canUploadDocuments: false,
    canSync: false,
    canAccessReports: true,
    allowedEndpoints: ["/mobile/surveys", "/mobile/responses"],
  },
  ADMIN: {
    canViewSurveys: false,
    canFillSurveys: false,
    canViewResponses: false,
    canCreateResponse: false,
    canEditResponse: false,
    canUploadDocuments: false,
    canSync: false,
    canAccessReports: false,
    allowedEndpoints: [],
  },
  AUDITOR: {
    canViewSurveys: false,
    canFillSurveys: false,
    canViewResponses: false,
    canCreateResponse: false,
    canEditResponse: false,
    canUploadDocuments: false,
    canSync: false,
    canAccessReports: false,
    allowedEndpoints: [],
  },
};

/**
 * Check if a role can perform an action offline.
 * Returns detailed reason if action is not allowed.
 */
export function canPerformOfflineAction(
  role: UserRole,
  action: keyof OfflineAccessPolicy,
): { allowed: boolean; reason?: string } {
  const policy = OFFLINE_POLICIES[role];

  if (!policy) {
    return { allowed: false, reason: `Unknown role: ${role}` };
  }

  const allowed = policy[action];

  if (!allowed) {
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
      reason: `${actionLabels[action]} not allowed for ${role} role while offline`,
    };
  }

  return { allowed: true };
}

/**
 * Get readable policy summary for UI display.
 */
export function getPolicySummary(role: UserRole): string {
  switch (role) {
    case "BRIGADISTA":
      return "Puedes llenar encuestas y ver respuestas offline";
    case "ENCARGADO":
      return "Puedes ver encuestas y respuestas offline (sin editar)";
    case "SUPERVISOR":
      return "Acceso limitado offline (solo lectura)";
    case "ADMIN":
      return "Admin solo en línea";
    case "AUDITOR":
      return "Auditor requiere conexión";
    default:
      return "Acceso sin conexión no disponible";
  }
}
