import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { Ionicons } from "@expo/vector-icons";

/**
 * Brigadista Layout - Tabs for Field Worker Role
 * Access: Only assigned surveys (Rule 11)
 * Tabs: Home, My Surveys, My Responses
 */
export default function BrigadistaLayout() {
  return (
    <ProtectedRoute allowedRoles={["BRIGADISTA"]}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
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
            href: null, // Hidden from tabs - accessible via navigation
          }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null, // Hidden from tabs
          }}
        />
        <Tabs.Screen
          name="change-avatar"
          options={{
            href: null, // Hidden from tabs
          }}
        />
        <Tabs.Screen
          name="change-password"
          options={{
            href: null, // Hidden from tabs
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
