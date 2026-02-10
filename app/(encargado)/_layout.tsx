import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

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
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="surveys"
          options={{
            title: "Encuestas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="doc.text.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: "Equipo",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.3.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="responses"
          options={{
            title: "Respuestas",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="list.bullet.clipboard.fill"
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
