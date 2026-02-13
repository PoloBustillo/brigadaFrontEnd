/**
 * Admin Users - User Management
 * Shows: All users, roles, activation status
 * Access: Administrators only (Rule 6)
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "ENCARGADO" | "BRIGADISTA";
  isActive: boolean;
  surveysCompleted: number;
  lastActive: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    email: "maria.gonzalez@brigada.com",
    name: "María González",
    role: "ENCARGADO",
    isActive: true,
    surveysCompleted: 45,
    lastActive: "Hace 1 hora",
  },
  {
    id: 2,
    email: "juan.perez@brigada.com",
    name: "Juan Pérez",
    role: "BRIGADISTA",
    isActive: true,
    surveysCompleted: 32,
    lastActive: "Hace 2 horas",
  },
  {
    id: 3,
    email: "admin@brigada.com",
    name: "Admin Principal",
    role: "ADMIN",
    isActive: true,
    surveysCompleted: 0,
    lastActive: "Ahora",
  },
  {
    id: 4,
    email: "carlos.lopez@brigada.com",
    name: "Carlos López",
    role: "BRIGADISTA",
    isActive: false,
    surveysCompleted: 18,
    lastActive: "Hace 2 días",
  },
];

export default function AdminUsers() {
  const colors = useThemeColors();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [refreshing, setRefreshing] = useState(false);

  const roleConfig = {
    ADMIN: {
      label: "Administrador",
      color: colors.error,
      icon: "shield-checkmark" as const,
    },
    ENCARGADO: {
      label: "Encargado",
      color: colors.info,
      icon: "people" as const,
    },
    BRIGADISTA: {
      label: "Brigadista",
      color: colors.success,
      icon: "person" as const,
    },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch users from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCreateUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to create user screen
    console.log("Create new user");
  };

  const handleUserPress = (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to user detail
    console.log("View user:", user.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Usuarios" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="people" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {users.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {users.filter((u) => u.isActive).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Activos
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="person-add" size={24} color={colors.info} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {users.filter((u) => u.role === "BRIGADISTA").length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Brigadistas
            </Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateUser}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Nuevo Usuario</Text>
        </TouchableOpacity>

        {/* Users List */}
        <View style={styles.listContainer}>
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No hay usuarios
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Crea el primer usuario para empezar
              </Text>
            </View>
          ) : (
            users.map((user) => {
              const config = roleConfig[user.role];
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleUserPress(user)}
                  activeOpacity={0.7}
                >
                  {/* Avatar and Info */}
                  <View style={styles.userHeader}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: config.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={config.icon}
                        size={24}
                        color={config.color}
                      />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {user.name}
                      </Text>
                      <Text
                        style={[
                          styles.userEmail,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {user.email}
                      </Text>
                    </View>
                  </View>

                  {/* Role and Status */}
                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: config.color + "20" },
                      ]}
                    >
                      <Text style={[styles.roleText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: user.isActive
                            ? colors.success + "20"
                            : colors.textSecondary + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          user.isActive ? "checkmark-circle" : "close-circle"
                        }
                        size={12}
                        color={
                          user.isActive ? colors.success : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: user.isActive
                              ? colors.success
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={styles.userStats}>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="checkmark-done"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.statText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {user.surveysCompleted} completadas
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.statText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {user.lastActive}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.footerText, { color: colors.primary }]}
                    >
                      Ver detalles
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listContainer: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  userStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
