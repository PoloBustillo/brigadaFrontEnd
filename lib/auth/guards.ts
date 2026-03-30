/**
 * Route Guards
 * HOCs and hooks for protecting routes based on roles and permissions
 */

import { useAuth } from "@/contexts/auth-context";
import { getPrimaryMobileRouteGroup } from "@/lib/auth/capabilities";
import type { UserRole } from "@/types/user";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import {
  hasAnyPermissionForUser,
  hasPermissionForUser,
  Permission,
} from "./permissions";

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
    const inProtectedGroup = ["(brigadista)", "(tabs)"].includes(
      segments[0] as string,
    );

    if (!isAuthenticated && inProtectedGroup) {
      // Redirect to login if trying to access protected route
      console.log("Not authenticated, redirecting to login");
      router.replace("/(auth)/login-enhanced");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated user tries to access auth screens
      console.log("Already authenticated, redirecting to home");
      redirectToRoleHome(user!, router);
    }
  }, [isAuthenticated, loading, segments]);
}

/**
 * Redirect user to their role-specific home screen
 */
export function redirectToRoleHome(
  user: { role: UserRole; permissions?: string[] },
  router: any,
) {
  const routeGroup = getPrimaryMobileRouteGroup(user);
  router.replace(`/${routeGroup}`);
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
      router.replace("/(auth)/login-enhanced");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not in allowed roles:`, allowedRoles);
      router.replace("/(auth)/welcome");
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
      router.replace("/(auth)/login-enhanced");
      return;
    }

    if (!hasPermissionForUser(user, requiredPermission)) {
      console.log(
        `User role ${user.role} doesn't have permission:`,
        requiredPermission,
      );
      router.replace("/(auth)/welcome");
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
      router.replace("/(auth)/login-enhanced");
      return;
    }

    if (!hasAnyPermissionForUser(user, permissions)) {
      console.log(
        `User role ${user.role} doesn't have any of permissions:`,
        permissions,
      );
      router.replace("/(auth)/welcome");
    }
  }, [user, loading, permissions]);
}

/**
 * Check if current user has permission (for conditional rendering)
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermissionForUser(user, permission);
}

/**
 * Check if current user has any of the permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasAnyPermissionForUser(user, permissions);
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
      router.replace("/(auth)/login-enhanced");
    }
  }, [user]);
}
