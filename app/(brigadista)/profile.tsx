/**
 * Brigadista Profile Screen
 * Perfil y configuración para brigadistas
 */

import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaProfileScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleEditProfile = () => {
    router.push("/(brigadista)/edit-profile" as any);
  };

  const handleChangeAvatar = () => {
    router.push("/(brigadista)/change-avatar" as any);
  };

  const handleChangePassword = () => {
    router.push("/(brigadista)/change-password" as any);
  };

  const handleThemeSettings = () => {
    router.push("/theme-settings" as any);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      // Force navigate even if backend logout fails
    }
    router.replace("/(auth)/welcome" as any);
  };

  // Get avatar from user auth context
  const avatarUrl = user?.avatar_url || null;

  const profileMenuItems = [
    {
      id: "edit-profile",
      icon: "create-outline",
      title: "Editar Perfil",
      subtitle: "Actualiza tu información personal",
      onPress: handleEditProfile,
      color: colors.primary,
    },
    {
      id: "change-avatar",
      icon: "image-outline",
      title: "Foto de Perfil",
      subtitle: "Cambia tu foto de perfil",
      onPress: handleChangeAvatar,
      color: colors.info,
    },
    {
      id: "change-password",
      icon: "lock-closed-outline",
      title: "Cambiar Contraseña",
      subtitle: "Actualiza tu contraseña",
      onPress: handleChangePassword,
      color: colors.warning,
    },
  ];

  const settingsMenuItems = [
    {
      id: "theme",
      icon: "color-palette",
      title: "Personalización",
      subtitle: "Cambia el tema y colores",
      onPress: handleThemeSettings,
      color: colors.primary,
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
        <TouchableOpacity
          onPress={handleChangeAvatar}
          style={styles.avatarContainer}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View
              style={[styles.avatar, { backgroundColor: colors.background }]}
            >
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
          )}
          <View
            style={[
              styles.avatarEditBadge,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons name="camera" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.background }]}>
          {user?.name || "Usuario"}
        </Text>
        <Text
          style={[styles.email, { color: colors.background, opacity: 0.9 }]}
        >
          {user?.email || ""}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: colors.background + "30" },
          ]}
        >
          <Text style={[styles.roleText, { color: colors.background }]}>
            Brigadista
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PERFIL
          </Text>
          <View style={styles.menuSection}>
            {profileMenuItems.map((item) => (
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
                    style={[
                      styles.menuSubtitle,
                      { color: colors.textTertiary },
                    ]}
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
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CONFIGURACIÓN
          </Text>
          <View style={styles.menuSection}>
            {settingsMenuItems.map((item) => (
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
                    style={[
                      styles.menuSubtitle,
                      { color: colors.textTertiary },
                    ]}
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
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
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
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
