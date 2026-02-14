/**
 * Admin Profile Screen
 * Perfil y configuración para administradores
 */

import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
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

export default function AdminProfileScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { addPendingItem, clearPending, pendingByType } = useSync();

  const handleThemeSettings = () => {
    router.push("/theme-settings" as any);
  };

  const handleLogout = () => {
    router.replace("/(auth)/welcome" as any);
  };

  const handleEditProfile = () => {
    router.push("/(admin)/edit-profile" as any);
  };

  const handleChangeAvatar = () => {
    router.push("/(admin)/change-avatar" as any);
  };

  const handleChangePassword = () => {
    router.push("/(admin)/change-password" as any);
  };

  // Debug: Agregar items pendientes de prueba
  const addTestPending = (type: "survey" | "response" | "user") => {
    addPendingItem({
      id: `test-${type}-${Date.now()}`,
      type,
    });
  };

  const profileMenuItems = [
    {
      id: "edit-profile",
      icon: "person-outline",
      title: "Editar Perfil",
      subtitle: "Actualiza tu información",
      onPress: handleEditProfile,
      color: colors.primary,
    },
    {
      id: "change-avatar",
      icon: "camera-outline",
      title: "Cambiar Foto",
      subtitle: "Actualiza tu foto de perfil",
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
      id: "notifications",
      icon: "notifications",
      title: "Notificaciones",
      subtitle: "Gestiona tus preferencias",
      onPress: () => console.log("Notifications"),
      color: colors.info,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleChangeAvatar}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: colors.background }]}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color={colors.primary} />
            )}
          </View>
          <View
            style={[
              styles.avatarEditBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="camera" size={14} color={colors.background} />
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
            ADMINISTRADOR
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

        {/* Settings Section */}
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

        {/* Debug Section - TEST SYNC BADGES */}
        <View style={[styles.debugSection, { borderColor: colors.border }]}>
          <Text style={[styles.debugTitle, { color: colors.textSecondary }]}>
            🔧 Debug: Probar Sync Badges
          </Text>
          <Text style={[styles.debugSubtitle, { color: colors.textTertiary }]}>
            Pendientes: Encuestas {pendingByType.surveys} | Respuestas{" "}
            {pendingByType.responses} | Usuarios {pendingByType.users}
          </Text>
          <View style={styles.debugButtons}>
            <TouchableOpacity
              style={[
                styles.debugButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={() => addTestPending("survey")}
            >
              <Text style={[styles.debugButtonText, { color: colors.primary }]}>
                + Encuesta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.debugButton,
                { backgroundColor: colors.info + "20" },
              ]}
              onPress={() => addTestPending("response")}
            >
              <Text style={[styles.debugButtonText, { color: colors.info }]}>
                + Respuesta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.debugButton,
                { backgroundColor: colors.success + "20" },
              ]}
              onPress={() => addTestPending("user")}
            >
              <Text style={[styles.debugButtonText, { color: colors.success }]}>
                + Usuario
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.debugButton,
                { backgroundColor: colors.error + "20" },
              ]}
              onPress={() => clearPending()}
            >
              <Text style={[styles.debugButtonText, { color: colors.error }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
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
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
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
  debugSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  debugSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  debugButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  debugButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
