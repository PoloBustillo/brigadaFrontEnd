import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useSync } from "@/contexts/sync-context";
import { Ionicons } from "@expo/vector-icons";

/**
 * Brigadista Layout - Tabs for Field Worker Role
 * Access: Only assigned surveys (Rule 11)
 * Tabs: Home, My Surveys, My Responses
 */
export default function BrigadistaLayout() {
  const { isOnline } = useSync();

  return (
    <ProtectedRoute allowedRoles={["BRIGADISTA"]}>
      <View style={{ flex: 1 }}>
        <OfflineBanner compact={false} showIfOnline={true} />
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
              href: isOnline ? undefined : null,
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
              title: "Respuestas",
              href: isOnline ? undefined : null,
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
          <Tabs.Screen
            name="surveys/fill"
            options={{
              href: null, // Hidden from tabs
              tabBarStyle: { display: "none" },
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              href: null, // Not available yet
            }}
          />
        </Tabs>
      </View>
    </ProtectedRoute>
  );
}
