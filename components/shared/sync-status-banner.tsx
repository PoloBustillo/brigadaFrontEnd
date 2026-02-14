/**
 * 🔄 Sync Status Banner Component
 * Shows sync status, errors, and retry information
 * REGLA 6: Sincronización automática
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function SyncStatusBanner() {
  const colors = useThemeColors();
  const {
    pendingCount,
    errorCount,
    isSyncing,
    isOnline,
    syncAll,
    pendingItems,
  } = useSync();

  // Animation for syncing state
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isSyncing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Don't show banner if nothing to sync and no errors
  if (pendingCount === 0 && errorCount === 0) {
    return null;
  }

  // Determine banner state
  const hasErrors = errorCount > 0;
  const hasPartialErrors = pendingItems.some(
    (item) => item.status === "partial_error"
  );

  const getBannerConfig = () => {
    if (!isOnline) {
      return {
        backgroundColor: colors.warning + "15",
        borderColor: colors.warning + "40",
        iconColor: colors.warning,
        icon: "cloud-offline-outline" as const,
        title: "Sin conexión",
        subtitle: `${pendingCount} elemento(s) esperando sincronización`,
        showAction: false,
      };
    }

    if (isSyncing) {
      return {
        backgroundColor: colors.info + "15",
        borderColor: colors.info + "40",
        iconColor: colors.info,
        icon: "sync-outline" as const,
        title: "Sincronizando...",
        subtitle: `${pendingCount} elemento(s) pendientes`,
        showAction: false,
      };
    }

    if (hasErrors) {
      return {
        backgroundColor: colors.error + "15",
        borderColor: colors.error + "40",
        iconColor: colors.error,
        icon: hasPartialErrors
          ? ("warning-outline" as const)
          : ("alert-circle-outline" as const),
        title: hasPartialErrors
          ? "Error parcial en sincronización"
          : "Error en sincronización",
        subtitle: `${errorCount} elemento(s) con error - Toca para reintentar`,
        showAction: true,
      };
    }

    return {
      backgroundColor: colors.warning + "15",
      borderColor: colors.warning + "40",
      iconColor: colors.warning,
      icon: "cloud-upload-outline" as const,
      title: "Pendiente de sincronización",
      subtitle: `${pendingCount} elemento(s) - Toca para sincronizar`,
      showAction: true,
    };
  };

  const config = getBannerConfig();

  const handlePress = () => {
    if (config.showAction && isOnline && !isSyncing) {
      syncAll();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={config.showAction ? 0.7 : 1}
      disabled={!config.showAction}
    >
      <Animated.View style={isSyncing ? animatedStyle : undefined}>
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {config.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {config.subtitle}
        </Text>
      </View>

      {config.showAction && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
});
