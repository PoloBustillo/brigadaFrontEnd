import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";

/**
 * Brigadista Layout - Tabs for Field Worker Role
 * Access: Only assigned surveys (Rule 11)
 * Tabs: Home, My Surveys, My Responses
 */
export default function BrigadistaLayout() {
  const colors = useThemeColors();

  return (
    <ProtectedRoute allowedRoles={["BRIGADISTA"]}>
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
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-surveys"
          options={{
            title: "Mis Encuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="clipboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="responses/index"
          options={{
            title: "Mis Respuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="checkmark-circle" size={24} color={color} />
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
          name="surveys/index"
          options={{
            href: null, // Hidden from tabs
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
