/**
 * RBAC - Role-Based Access Control
 * Permissions system for enforcing access control
 */

import type { UserRole } from "@/types/user";

/**
 * Permission definitions for each feature/action
 */
export enum Permission {
  // Survey Management
  CREATE_SURVEY = "create_survey",
  EDIT_SURVEY = "edit_survey",
  DELETE_SURVEY = "delete_survey",
  VIEW_ALL_SURVEYS = "view_all_surveys",
  PUBLISH_SURVEY = "publish_survey",

  // User Management
  CREATE_USER = "create_user",
  EDIT_USER = "edit_user",
  DELETE_USER = "delete_user",
  VIEW_ALL_USERS = "view_all_users",

  // Assignment Management
  CREATE_ASSIGNMENT = "create_assignment",
  EDIT_ASSIGNMENT = "edit_assignment",
  DELETE_ASSIGNMENT = "delete_assignment",
  VIEW_ASSIGNMENTS = "view_assignments",

  // Survey Response
  SUBMIT_RESPONSE = "submit_response",
  VIEW_OWN_RESPONSES = "view_own_responses",
  VIEW_ALL_RESPONSES = "view_all_responses",
  VIEW_ASSIGNED_RESPONSES = "view_assigned_responses",

  // Profile
  EDIT_OWN_PROFILE = "edit_own_profile",
  CHANGE_OWN_PASSWORD = "change_own_password",
}

/**
 * Role-Permission Map
 * Defines which roles have which permissions
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    Permission.CREATE_SURVEY,
    Permission.EDIT_SURVEY,
    Permission.DELETE_SURVEY,
    Permission.VIEW_ALL_SURVEYS,
    Permission.PUBLISH_SURVEY,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.VIEW_ALL_USERS,
    Permission.CREATE_ASSIGNMENT,
    Permission.EDIT_ASSIGNMENT,
    Permission.DELETE_ASSIGNMENT,
    Permission.VIEW_ASSIGNMENTS,
    Permission.VIEW_ALL_RESPONSES,
    Permission.EDIT_OWN_PROFILE,
    Permission.CHANGE_OWN_PASSWORD,
  ],

  ENCARGADO: [
    // Supervisors can manage assignments and view responses
    Permission.VIEW_ALL_SURVEYS,
    Permission.CREATE_ASSIGNMENT,
    Permission.EDIT_ASSIGNMENT,
    Permission.DELETE_ASSIGNMENT,
    Permission.VIEW_ASSIGNMENTS,
    Permission.VIEW_ASSIGNED_RESPONSES, // Only responses from their brigadistas
    Permission.EDIT_OWN_PROFILE,
    Permission.CHANGE_OWN_PASSWORD,
  ],

  BRIGADISTA: [
    // Brigadistas can only submit and view their own responses
    Permission.SUBMIT_RESPONSE,
    Permission.VIEW_OWN_RESPONSES,
    Permission.VIEW_ASSIGNMENTS, // Only their own assignments
    Permission.EDIT_OWN_PROFILE,
    Permission.CHANGE_OWN_PASSWORD,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if role can access admin features
 */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Check if role can manage assignments (Admin or Encargado)
 */
export function canManageAssignments(role: UserRole): boolean {
  return hasPermission(role, Permission.CREATE_ASSIGNMENT);
}

/**
 * Check if role can create surveys (Admin only)
 */
export function canCreateSurveys(role: UserRole): boolean {
  return hasPermission(role, Permission.CREATE_SURVEY);
}

/**
 * Check if role can view all responses (Admin or Encargado)
 */
export function canViewResponses(role: UserRole): boolean {
  return (
    hasPermission(role, Permission.VIEW_ALL_RESPONSES) ||
    hasPermission(role, Permission.VIEW_ASSIGNED_RESPONSES)
  );
}

/**
 * Check if role is Brigadista
 */
export function isBrigadista(role: UserRole): boolean {
  return role === "BRIGADISTA";
}

/**
 * Check if role is Encargado
 */
export function isEncargado(role: UserRole): boolean {
  return role === "ENCARGADO";
}
