import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { ProtectedRoute } from "@/components/auth";
import { HapticTab } from "@/components/haptic-tab";
import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useSync } from "@/contexts/sync-context";
import { Permission } from "@/lib/auth/permissions";
import { Ionicons } from "@expo/vector-icons";

/**
 * Brigadista Layout - Tabs for Field Worker Role
 * Access: Only assigned surveys (Rule 11)
 * Tabs: Home, My Surveys, My Responses
 */
export default function BrigadistaLayout() {
  const { isOnline } = useSync();

  return (
    <ProtectedRoute
      allowedPermissions={[
        Permission.VIEW_SURVEYS,
        Permission.SUBMIT_RESPONSE,
        Permission.VIEW_OWN_RESPONSES,
        Permission.VIEW_ASSIGNMENTS,
        Permission.EDIT_OWN_PROFILE,
        Permission.CHANGE_OWN_PASSWORD,
      ]}
    >
      <View style={{ flex: 1 }}>
        <OfflineBanner compact={false} showIfOnline={true} />
        <Tabs
          initialRouteName="index"
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
              tabBarStyle: { display: "none" },
              href: isOnline ? undefined : null,
              tabBarIcon: ({ color }) => (
                <Ionicons name="home" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: null, // Hidden from tabs - accessible via navigation
              tabBarStyle: { display: "none" },
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
          <Tabs.Screen name="maps" options={{ href: null }} />
          <Tabs.Screen name="tracking" options={{ href: null }} />
          <Tabs.Screen name="questionnaires" options={{ href: null }} />
          <Tabs.Screen name="score-details" options={{ href: null }} />
          <Tabs.Screen
            name="surveys/fill"
            options={{
              href: null,
              tabBarStyle: { display: "none" },
            }}
          />
          <Tabs.Screen name="extras" options={{ href: null }} />
          <Tabs.Screen name="networks" options={{ href: null }} />
          <Tabs.Screen name="permissions" options={{ href: null }} />
          <Tabs.Screen name="report-issue" options={{ href: null }} />
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
