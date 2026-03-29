/**
 * Protected Route Component
 * Handles permission/capability-based route protection and redirects.
 */

import { useAuth } from "@/contexts/auth-context";
import {
  canAccessMobileRouteGroup,
  getPrimaryMobileRouteGroup,
} from "@/lib/auth/capabilities";
import { hasAnyPermissionForUser, Permission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/user";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowedPermissions?: Permission[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedPermissions,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const navigateToUserHome = () => {
    if (!user) {
      router.replace("/(auth)/welcome" as any);
      return;
    }
    const routeGroup = getPrimaryMobileRouteGroup(user);
    router.replace(`/${routeGroup}/` as any);
  };

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inRoleGroup = ["(encargado)", "(brigadista)"].includes(
      segments[0] as string,
    );

    // Not authenticated
    if (!user) {
      if (requireAuth && !inAuthGroup) {
        console.log("🔒 No session, redirecting to welcome");
        router.replace("/(auth)/welcome" as any);
      }
      return;
    }

    // Authenticated but in auth screens
    if (user && inAuthGroup) {
      console.log("✅ User logged in, redirecting from auth to dashboard");
      navigateToUserHome();
      return;
    }

    // Backward compatibility while old role-based screens are being removed.
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(
        `⛔ Access denied: User role ${user.role} not in allowed roles`,
        allowedRoles,
      );
      navigateToUserHome();
      return;
    }

    if (
      allowedPermissions &&
      !hasAnyPermissionForUser(user, allowedPermissions)
    ) {
      console.log(
        `⛔ Access denied: User ${user.email} lacks required permissions`,
        allowedPermissions,
      );
      navigateToUserHome();
      return;
    }

    // Check if user is in a route group outside their effective capabilities.
    if (inRoleGroup) {
      const currentRoleGroup = segments[0];
      if (!canAccessMobileRouteGroup(user, String(currentRoleGroup))) {
        console.log(
          `🔀 User in inaccessible group. Current: ${currentRoleGroup}`,
        );
        navigateToUserHome();
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, segments]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1B8D" />
      </View>
    );
  }

  // Render children if all checks passed
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
