/**
 * App Header Component
 * Reutilizable header con conexión, theme switcher y logout
 */

import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showLogout = true,
}: AppHeaderProps) {
  const colors = useThemeColors();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {subtitle || user?.email}
        </Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.headerActions}>
        {/* Connection Status */}
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isOnline
                ? colors.success + "20"
                : colors.error + "20",
              borderColor: isOnline ? colors.success : colors.error,
            },
          ]}
        >
          <Ionicons
            name={isOnline ? "wifi" : "wifi-outline"}
            size={16}
            color={isOnline ? colors.success : colors.error}
          />
        </View>
        {/* Theme Toggle */}
        <ThemeToggleIcon />
        {/* Logout */}
        {showLogout && (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
