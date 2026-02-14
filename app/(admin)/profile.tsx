/**
 * Admin Profile Screen
 * Perfil y configuración para administradores
 */

import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
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

export default function AdminProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const { addPendingItem, clearPending, pendingByType } = useSync();

  const handleThemeSettings = () => {
    router.push("/theme-settings" as any);
  };

  const handleLogout = () => {
    router.replace("/(auth)/welcome" as any);
  };

  // Debug: Agregar items pendientes de prueba
  const addTestPending = (type: "survey" | "response" | "user") => {
    addPendingItem({
      id: `test-${type}-${Date.now()}`,
      type,
    });
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
      id: "security",
      icon: "shield-checkmark",
      title: "Seguridad",
      subtitle: "Contraseña y privacidad",
      onPress: () => console.log("Security"),
      color: colors.warning,
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
          Administrador
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
