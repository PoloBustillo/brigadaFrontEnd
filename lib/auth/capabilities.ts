import type { User } from "@/types/user";

import {
  Permission,
  getUserPermissions,
  hasAnyPermissionForUser,
} from "./permissions";

export type MobileRouteGroup = "(encargado)" | "(brigadista)";

const SURVEY_OPERATOR_PERMISSIONS: Permission[] = [
  Permission.VIEW_SURVEYS,
  Permission.SUBMIT_RESPONSE,
  Permission.VIEW_OWN_RESPONSES,
  Permission.VIEW_ASSIGNMENTS,
  Permission.EDIT_OWN_PROFILE,
  Permission.CHANGE_OWN_PASSWORD,
  Permission.VIEW_NOTIFICATIONS,
];

const TEAM_SURVEY_PERMISSIONS: Permission[] = [
  Permission.VIEW_ALL_SURVEYS,
  Permission.CREATE_ASSIGNMENT,
  Permission.EDIT_ASSIGNMENT,
  Permission.DELETE_ASSIGNMENT,
  Permission.VIEW_ASSIGNED_RESPONSES,
  Permission.VIEW_ALL_RESPONSES,
];

export function getPrimaryMobileRouteGroup(
  user: Pick<User, "role" | "permissions"> | null | undefined,
): MobileRouteGroup {
  if (!user) {
    return "(brigadista)";
  }

  const permissions = getUserPermissions(user);

  if (permissions.includes(Permission.SUBMIT_RESPONSE)) {
    return "(brigadista)";
  }

  if (
    TEAM_SURVEY_PERMISSIONS.some((permission) =>
      permissions.includes(permission),
    )
  ) {
    return "(encargado)";
  }

  return "(brigadista)";
}

export function canAccessMobileRouteGroup(
  user: Pick<User, "role" | "permissions">,
  group: string,
): boolean {
  if (group === "(brigadista)") {
    return hasAnyPermissionForUser(user, SURVEY_OPERATOR_PERMISSIONS);
  }

  if (group === "(encargado)") {
    return hasAnyPermissionForUser(user, TEAM_SURVEY_PERMISSIONS);
  }

  return false;
}
