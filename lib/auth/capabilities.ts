import type { User } from "@/types/user";

import { Permission, hasAnyPermissionForUser } from "./permissions";

export type MobileRouteGroup = "(brigadista)";

const SURVEY_OPERATOR_PERMISSIONS: Permission[] = [
  Permission.VIEW_SURVEYS,
  Permission.SUBMIT_RESPONSE,
  Permission.VIEW_OWN_RESPONSES,
  Permission.VIEW_ASSIGNMENTS,
  Permission.EDIT_OWN_PROFILE,
  Permission.CHANGE_OWN_PASSWORD,
  Permission.VIEW_NOTIFICATIONS,
];

const MOBILE_APP_PERMISSIONS: Permission[] = [...SURVEY_OPERATOR_PERMISSIONS];

export function canAccessMobileApp(
  user: Pick<User, "role" | "permissions"> | null | undefined,
): boolean {
  if (!user) return false;
  return hasAnyPermissionForUser(user, MOBILE_APP_PERMISSIONS);
}

export function getPrimaryMobileRouteGroup(
  user: Pick<User, "role" | "permissions"> | null | undefined,
): MobileRouteGroup {
  return "(brigadista)";
}

export function canAccessMobileRouteGroup(
  user: Pick<User, "role" | "permissions">,
  group: string,
): boolean {
  if (group === "(brigadista)") {
    return hasAnyPermissionForUser(user, SURVEY_OPERATOR_PERMISSIONS);
  }

  return false;
}
