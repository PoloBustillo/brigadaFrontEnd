/**
 * Brigadista Profile Screen
 * Perfil y configuración para brigadistas
 */

import { ColorSchemeSelector } from "@/components/ui/color-scheme-selector";
import { useAuth } from "@/contexts/auth-context";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaProfileScreen() {
  const colors = useThemeColors();
  const { themeMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const handleThemeSettings = () => {
    router.push("/theme-settings" as any);
  };

  const handleLogout = () => {
    router.replace("/(auth)/welcome" as any);
  };

  const menuItems = [
    {
      id: "theme",
      icon: "color-palette",
      title: "Personalización",
      subtitle: "Cambia el tema y colores",
      onPress: handleThemeSettings,
      color: colors.primary,
    },
    {
      id: "notifications",
      icon: "notifications",
      title: "Notificaciones",
      subtitle: "Gestiona tus preferencias",
      onPress: () => console.log("Notifications"),
      color: colors.info,
    },
    {
      id: "help",
      icon: "help-circle",
      title: "Ayuda",
      subtitle: "Preguntas frecuentes",
      onPress: () => console.log("Help"),
      color: colors.success,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.background }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.name, { color: colors.background }]}>
          {user?.name || "Usuario"}
        </Text>
        <Text style={[styles.role, { color: colors.background, opacity: 0.9 }]}>
          Brigadista
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Color Scheme Selector */}
        <View style={styles.colorSchemeSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette" size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Esquemas de Colores
            </Text>
          </View>

          {/* Theme Mode Indicator */}
          <View
            style={[
              styles.themeModeIndicator,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={
                themeMode === "light"
                  ? "sunny"
                  : themeMode === "dark"
                    ? "moon"
                    : "phone-portrait"
              }
              size={18}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.themeModeText, { color: colors.textSecondary }]}
            >
              Modo:{" "}
              {themeMode === "light"
                ? "Claro"
                : themeMode === "dark"
                  ? "Oscuro"
                  : "Auto"}
            </Text>
          </View>

          <ColorSchemeSelector />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={item.onPress}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.menuSubtitle, { color: colors.textTertiary }]}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.error + "15" },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  colorSchemeSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeModeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  themeModeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  menuSection: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
