import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { Ionicons } from "@expo/vector-icons";

/**
 * Admin Layout - Tabs for Administrator Role
 * Access: Full system access (Rule 6)
 * Tabs: Dashboard, Surveys, Users, Responses
 */
export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
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
          name="assignments"
          options={{
            href: null, // Hidden from tabs
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
