import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Brigadista Layout - Tabs for Field Worker Role
 * Access: Only assigned surveys (Rule 11)
 * Tabs: Home, My Surveys, My Responses
 */
export default function BrigadistaLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProtectedRoute allowedRoles={["BRIGADISTA"]}>
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
            title: "Mis Encuestas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="doc.text.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="responses"
          options={{
            title: "Mis Respuestas",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="checkmark.circle.fill"
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
