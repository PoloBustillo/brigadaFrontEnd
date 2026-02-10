/**
 * ConnectionStatus Component - Brigada Digital
 * Shows online/offline status and token expiration
 * Rules 21-24: Offline-first functionality
 */

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { typography } from "@/constants/typography";

interface ConnectionStatusProps {
  style?: any;
  variant?: "compact" | "full";
}

export function ConnectionStatus({
  style,
  variant = "compact",
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    // TODO: Implement real connection check
    // Check network status
    // Check token expiration

    // Pulse animation for online indicator
    if (isOnline) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isOnline, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const getTokenExpiryText = () => {
    if (!tokenExpiry) return "";
    const now = Date.now();
    const diff = tokenExpiry - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return "Token expirado";
    if (days === 1) return "Expira en 1 día";
    return `Expira en ${days} días`;
  };

  if (variant === "compact") {
    return (
      <View style={[styles.compactContainer, style]}>
        <Animated.View style={[styles.statusDot, pulseStyle]}>
          <View
            style={[
              styles.dot,
              { backgroundColor: isOnline ? "#4CAF50" : "#FF9800" },
            ]}
          />
        </Animated.View>
        <Text style={styles.compactText}>
          {isOnline ? "En línea" : "Sin conexión"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.fullContainer, style]}>
      <View style={styles.statusRow}>
        <Animated.View style={pulseStyle}>
          <Ionicons
            name={isOnline ? "wifi" : "cloud-offline"}
            size={20}
            color={isOnline ? "#4CAF50" : "#FF9800"}
          />
        </Animated.View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {isOnline ? "En línea" : "Sin conexión"}
          </Text>
          {!isOnline && (
            <Text style={styles.statusSubtitle}>Trabajando offline</Text>
          )}
          {tokenExpiry && (
            <Text style={styles.tokenExpiry}>{getTokenExpiryText()}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact variant
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A2E",
  },

  // Full variant
  fullContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    ...typography.bodySmall,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  statusSubtitle: {
    ...typography.helper,
    color: "#6C7A89",
  },
  tokenExpiry: {
    ...typography.helper,
    color: "#FF9800",
    marginTop: 2,
  },
});
