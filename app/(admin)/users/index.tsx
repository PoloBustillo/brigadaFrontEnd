/**
 * Admin Users - Read-only user list
 * Fetches from GET /users.
 * All write operations are handled by the web CMS.
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getAdminUsers, AdminUser } from "@/lib/api/admin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ROLE_CONFIG: Record<
  string,
  { label: string; color_key: "error" | "info" | "success"; icon: keyof typeof Ionicons.glyphMap }
> = {
  admin: { label: "Administrador", color_key: "error", icon: "shield-checkmark-outline" },
  encargado: { label: "Encargado", color_key: "info", icon: "people-outline" },
  brigadista: { label: "Brigadista", color_key: "success", icon: "person-outline" },
};

export default function AdminUsers() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchUsers(true);
  };

  const activeCount = users.filter((u) => u.is_active).length;
  const brigadistaCount = users.filter((u) => u.role === "brigadista").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Usuarios" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Read-only notice */}
        <View
          style={[
            styles.noticeBanner,
            { backgroundColor: colors.info + "18", borderColor: colors.info + "40" },
          ]}
        >
          <Ionicons name="eye-outline" size={16} color={colors.info} />
          <Text style={[styles.noticeText, { color: colors.info }]}>
            Vista de solo lectura. Gestiona usuarios desde el CMS web.
          </Text>
        </View>

        {/* Stats row */}
        {!loading && users.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{users.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activos</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>{brigadistaCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Brigadistas</Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin usuarios</Text>
          </View>
        )}

        {/* List */}
        {!loading && !error && users.length > 0 && (
          <View style={styles.listContainer}>
            {users.map((user) => {
              const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["brigadista"];
              const accentColor = colors[cfg.color_key];
              return (
                <View
                  key={user.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Avatar + name */}
                  <View style={styles.userHeader}>
                    <View style={[styles.avatar, { backgroundColor: accentColor + "20" }]}>
                      <Ionicons name={cfg.icon} size={24} color={accentColor} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {user.full_name}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                        {user.email}
                      </Text>
                    </View>
                  </View>

                  {/* Badges */}
                  <View style={styles.badges}>
                    <View style={[styles.roleBadge, { backgroundColor: accentColor + "20" }]}>
                      <Text style={[styles.roleText, { color: accentColor }]}>
                        {cfg.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: user.is_active
                            ? colors.success + "20"
                            : colors.textSecondary + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={user.is_active ? "checkmark-circle" : "close-circle"}
                        size={12}
                        color={user.is_active ? colors.success : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: user.is_active ? colors.success : colors.textSecondary },
                        ]}
                      >
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Text>
                    </View>
                  </View>

                  {/* Footer: created date */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerDate, { color: colors.textSecondary }]}>
                      Registrado: {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: { fontSize: 13, fontWeight: "500", flex: 1 },
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  loader: { marginTop: 60 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  listContainer: { gap: 12 },
  userCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  userEmail: { fontSize: 13 },
  badges: { flexDirection: "row", gap: 8, marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  roleText: { fontSize: 12, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerDate: { fontSize: 12 },
});

