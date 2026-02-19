import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { Ionicons } from "@expo/vector-icons";

/**
 * Admin Layout - Tabs for Administrator Role
 * Read-only view. All write operations are handled by the web CMS.
 * Tabs: Resumen, Encuestas, Usuarios, Perfil
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
            title: "Resumen",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="surveys/index"
          options={{
            title: "Encuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="users/index"
          options={{
            title: "Usuarios",
            tabBarIcon: ({ color }) => (
              <Ionicons name="people-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
          }}
        />
        {/* Hidden screens - not visible as tabs */}
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen name="change-avatar" options={{ href: null }} />
        <Tabs.Screen name="change-password" options={{ href: null }} />
        <Tabs.Screen name="assignments" options={{ href: null }} />
        <Tabs.Screen name="responses/index" options={{ href: null }} />
      </Tabs>
    </ProtectedRoute>
  );
}
