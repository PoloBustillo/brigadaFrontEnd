import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";

/**
 * Admin Layout - Tabs for Administrator Role
 * Access: Full system access (Rule 6)
 * Tabs: Dashboard, Surveys, Users, Responses
 */
export default function AdminLayout() {
  const colors = useThemeColors();

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
        }}
        initialRouteName="index"
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="surveys/index"
          options={{
            title: "Encuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users/index"
          options={{
            title: "Usuarios",
            tabBarIcon: ({ color }) => (
              <Ionicons name="people" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="responses/index"
          options={{
            title: "Respuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="clipboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="assignments"
          options={{
            href: null, // Hidden from tabs
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
