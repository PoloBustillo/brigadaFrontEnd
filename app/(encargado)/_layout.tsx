import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";

/**
 * Encargado Layout - Tabs for Team Manager Role
 * Access: Assigned surveys + team management (Rules 9-10)
 * Tabs: Home, My Surveys, Team, Responses
 */
export default function EncargadoLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProtectedRoute allowedRoles={["ENCARGADO"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
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
          name="surveys/index"
          options={{
            title: "Encuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: "Equipo",
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
      </Tabs>
    </ProtectedRoute>
  );
}
