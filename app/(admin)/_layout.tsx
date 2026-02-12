import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Admin Layout - Tabs for Administrator Role
 * Access: Full system access (Rule 6)
 * Tabs: Dashboard, Surveys, Users, Responses
 */
export default function AdminLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
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
          name="assignments"
          options={{
            href: null, // Hidden from tabs
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
