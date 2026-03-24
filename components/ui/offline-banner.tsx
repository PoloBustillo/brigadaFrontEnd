/**
 * Offline Mode Banner & Sync Status
 * 
 * Visible indicator of offline/online mode with:
 * - Real-time connectivity status
 * - Pending items count
 * - Sync progress
 * - Manual sync trigger button
 */

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";

interface OfflineBannerProps {
  compact?: boolean;
  showIfOnline?: boolean; // Show even when online if syncing
}

export function OfflineBanner({
  compact = false,
  showIfOnline = false,
}: OfflineBannerProps) {
  const { isOnline, isSyncing, pendingCount, syncAll } = useSync();
  const { primary, warning, background } = useThemeColors();
  const [animValue] = useState(new Animated.Value(0));

  // Show banner if offline OR (online but syncing and showIfOnline is true)
  const shouldShow = !isOnline || (isSyncing && showIfOnline);

  useEffect(() => {
    if (shouldShow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [shouldShow, animValue]);

  if (!shouldShow) {
    return null;
  }

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const statusColor = isOnline && !isSyncing ? primary : warning;
  const icon = isOnline ? "wifi-check" : "wifi-off";
  const statusText = isOnline ? "Online" : "Offline Mode";

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactBanner,
          { backgroundColor: statusColor, opacity },
        ]}
      >
        <View style={styles.compactContent}>
          <MaterialCommunityIcons name={icon} size={16} color="#fff" />
          <Text style={styles.compactText}>{statusText}</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: statusColor,
          opacity,
          borderBottomColor: background === "#000" ? "#333" : "#ddd",
        },
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.statusSection}>
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color="#fff"
            style={styles.icon}
          />
          <View>
            <Text style={styles.statusTitle}>{statusText}</Text>
            {isSyncing && (
              <Text style={styles.statusSubtitle}>Syncing changes...</Text>
            )}
            {pendingCount > 0 && !isSyncing && (
              <Text style={styles.statusSubtitle}>
                {pendingCount} item{pendingCount !== 1 ? "s" : ""} pending
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {!isOnline && pendingCount > 0 && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}
              onPress={syncAll}
              disabled={isSyncing}
            >
              <MaterialCommunityIcons
                name={isSyncing ? "sync" : "sync-circle"}
                size={20}
                color="#fff"
                style={isSyncing ? { transform: [{ rotate: "45deg" }] } : undefined}
              />
              <Text style={styles.syncButtonText}>
                {isSyncing ? "Syncing..." : "Retry"}
              </Text>
            </TouchableOpacity>
          )}

          {pendingCount > 0 && (
            <View style={styles.badgeLarge}>
              <Text style={styles.badgeTextLarge}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Full banner
  banner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  bannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  statusSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  badgeLarge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeTextLarge: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Compact banner
  compactBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  compactText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
