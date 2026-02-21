import { Tabs } from "expo-router";
import React from "react";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { Ionicons } from "@expo/vector-icons";

/**
 * Encargado Layout - Tabs for Team Manager Role
 * Access: Seguimiento de equipo y encuestas asignadas (consulta)
 * Configuración y asignaciones: solo desde CMS web
 * Tabs: Home, Encuestas, Equipo, Respuestas
 */
export default function EncargadoLayout() {
  return (
    <ProtectedRoute allowedRoles={["ENCARGADO"]}>
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
          name="surveys/index"
          options={{
            title: "Encuestas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="document-text" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="team/index"
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
            href: null, // Hidden route (informational only if opened)
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
