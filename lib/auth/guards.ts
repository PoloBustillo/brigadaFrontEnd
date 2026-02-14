/**
 * Route Guards
 * HOCs and hooks for protecting routes based on roles and permissions
 */

import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/user";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { hasAnyPermission, hasPermission, Permission } from "./permissions";

/**
 * Hook to protect routes - redirects if not authenticated
 */
export function useProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = [
      "(admin)",
      "(encargado)",
      "(brigadista)",
      "(tabs)",
    ].includes(segments[0] as string);

    if (!isAuthenticated && inProtectedGroup) {
      // Redirect to login if trying to access protected route
      console.log("Not authenticated, redirecting to login");
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated user tries to access auth screens
      console.log("Already authenticated, redirecting to home");
      redirectToRoleHome(user!.role, router);
    }
  }, [isAuthenticated, loading, segments]);
}

/**
 * Redirect user to their role-specific home screen
 */
export function redirectToRoleHome(role: UserRole, router: any) {
  switch (role) {
    case "ADMIN":
      router.replace("/(admin)");
      break;
    case "ENCARGADO":
      router.replace("/(encargado)");
      break;
    case "BRIGADISTA":
      router.replace("/(brigadista)");
      break;
    default:
      console.warn("Unknown role:", role);
      router.replace("/(tabs)");
  }
}

/**
 * Hook to require specific role(s)
 * Redirects to unauthorized screen if user doesn't have required role
 */
export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log("No user, redirecting to login");
      router.replace("/(auth)/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not in allowed roles:`, allowedRoles);
      router.replace("/unauthorized");
    }
  }, [user, loading, allowedRoles]);
}

/**
 * Hook to require specific permission(s)
 */
export function useRequirePermission(requiredPermission: Permission) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (!hasPermission(user.role, requiredPermission)) {
      console.log(
        `User role ${user.role} doesn't have permission:`,
        requiredPermission,
      );
      router.replace("/unauthorized");
    }
  }, [user, loading, requiredPermission]);
}

/**
 * Hook to require any of the specified permissions
 */
export function useRequireAnyPermission(permissions: Permission[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (!hasAnyPermission(user.role, permissions)) {
      console.log(
        `User role ${user.role} doesn't have any of permissions:`,
        permissions,
      );
      router.replace("/unauthorized");
    }
  }, [user, loading, permissions]);
}

/**
 * Check if current user has permission (for conditional rendering)
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Check if current user has any of the permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasAnyPermission(user.role, permissions);
}

/**
 * Check if current user is deactivated
 */
export function useCheckUserActive() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.state === "DISABLED") {
      console.log("User is deactivated, logging out");
      logout();
      router.replace("/(auth)/login");
    }
  }, [user]);
}
