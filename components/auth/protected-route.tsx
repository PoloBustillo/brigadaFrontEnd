/**
 * Protected Route Component
 * Handles role-based route protection and automatic redirects
 * Rules 6-8: Role-based permissions
 */

import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/user";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const navigateToUserRole = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        router.replace("/(admin)/" as any);
        break;
      case "ENCARGADO":
        router.replace("/(encargado)/" as any);
        break;
      case "BRIGADISTA":
        router.replace("/(brigadista)/" as any);
        break;
    }
  };

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inRoleGroup = ["(admin)", "(encargado)", "(brigadista)"].includes(
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
      navigateToUserRole(user.role);
      return;
    }

    // Check role permissions for protected routes
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log(
        `⛔ Access denied: User role ${user.role} not in allowed roles`,
        allowedRoles,
      );
      navigateToUserRole(user.role);
      return;
    }

    // Check if user is in wrong role group
    if (inRoleGroup) {
      const currentRoleGroup = segments[0];
      const expectedGroup = `(${user.role.toLowerCase()})`;

      if (currentRoleGroup !== expectedGroup) {
        console.log(
          `🔀 User in wrong role group. Current: ${currentRoleGroup}, Expected: ${expectedGroup}`,
        );
        navigateToUserRole(user.role);
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
