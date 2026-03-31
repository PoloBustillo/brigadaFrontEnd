/**
 * Brigadista Notifications Screen
 * Lists notifications with pull-to-refresh and mark-read actions.
 */

import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/api/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const iconForType = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case "survey_created":
    case "version_published":
      return "document-text";
    case "assignment_created":
      return "clipboard";
    case "survey_deleted":
      return "trash";
    default:
      return "notifications";
  }
};

const ItemSeparator = () => <View style={{ height: 10 }} />;

const normalizePath = (actionUrl?: string | null): string => {
  if (!actionUrl) return "";
  const clean = actionUrl.trim();
  if (!clean) return "";
  const noQuery = clean.split("?")[0] ?? "";
  const noHash = noQuery.split("#")[0] ?? "";
  return noHash.endsWith("/") && noHash.length > 1
    ? noHash.slice(0, -1)
    : noHash;
};

const requiredPermissionsForPath = (path: string): string[] => {
  if (!path) return [];
  if (path.includes("surveys")) return ["view_surveys", "view_all_surveys"];
  if (path.includes("assignments")) {
    return [
      "view_assignments",
      "view_all_assignments",
      "manage_assignments",
      "manage_brigadista_assignments",
    ];
  }
  if (path.includes("areas")) return ["view_areas", "view_all_areas"];
  if (path.includes("reports")) return ["view_reports", "view_responses"];
  if (path.includes("notifications")) {
    return ["view_notifications", "view_all_notifications"];
  }
  return [];
};

const canAccessNotification = (
  notification: NotificationItem,
  permissions: string[],
) => {
  const path = normalizePath(notification.action_url);
  const required = requiredPermissionsForPath(path);
  if (required.length === 0) return true;
  return required.some((permission) => permissions.includes(permission));
};

const mapActionUrlToAppRoute = (actionUrl?: string | null): string | null => {
  const path = normalizePath(actionUrl);
  if (!path) return null;
  if (path.includes("surveys")) return "/(brigadista)/surveys";
  if (path.includes("assignments")) return "/(brigadista)/questionnaires";
  if (path.includes("areas") || path.includes("maps"))
    return "/(brigadista)/maps";
  if (path.includes("reports")) return "/(brigadista)/tracking";
  if (path.includes("notifications")) return "/(brigadista)/notifications";
  return null;
};

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const accessibleNotifications = useMemo(
    () =>
      notifications.filter((notification) =>
        canAccessNotification(notification, permissions),
      ),
    [notifications, permissions],
  );

  const inaccessibleCount = Math.max(
    0,
    notifications.length - accessibleNotifications.length,
  );

  const statusScore = useMemo(() => {
    let score = 100;
    score -= Math.min(35, unreadCount * 3);
    score -= Math.min(20, inaccessibleCount * 5);
    if (user?.state !== "ACTIVE") score -= 35;
    if (!permissions.includes("view_notifications")) score -= 15;
    if (!user?.phone) score -= 5;
    if (!user?.avatar_url) score -= 5;
    return Math.max(0, Math.min(100, score));
  }, [
    unreadCount,
    inaccessibleCount,
    user?.state,
    user?.phone,
    user?.avatar_url,
    permissions,
  ]);

  const scoreLevel: "estable" | "atencion" | "riesgo" =
    statusScore >= 80 ? "estable" : statusScore >= 60 ? "atencion" : "riesgo";

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await getNotifications({ limit: 50 });
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch (err: any) {
      setError(err.message || "Error al cargar notificaciones");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    })();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id: number) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: updated.read } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail — will refresh on next pull
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const actionItems = useMemo(() => {
    const items: Array<{ key: string; label: string; action: () => void }> = [];

    if (unreadCount > 0) {
      items.push({
        key: "read_all",
        label: `Marcar ${unreadCount} pendientes como leidas`,
        action: handleMarkAllRead,
      });
    }

    if (inaccessibleCount > 0) {
      items.push({
        key: "check_permissions",
        label: "Revisar permisos para ver todas tus notificaciones",
        action: () => router.push("/(brigadista)/permissions"),
      });
    }

    if (!user?.phone || !user?.avatar_url) {
      items.push({
        key: "complete_profile",
        label: "Completar perfil para mejorar soporte y trazabilidad",
        action: () => router.push("/(brigadista)/edit-profile"),
      });
    }

    if (user?.state !== "ACTIVE") {
      items.push({
        key: "report_issue",
        label: "Tu estatus no esta activo. Reportar para resolverlo",
        action: () => router.push("/(brigadista)/report-issue"),
      });
    }

    return items;
  }, [
    unreadCount,
    inaccessibleCount,
    user?.phone,
    user?.avatar_url,
    user?.state,
    handleMarkAllRead,
    router,
  ]);

  const handleOpenNotification = useCallback(
    async (item: NotificationItem) => {
      if (!item.read) {
        await handleMarkRead(item.id);
      }
      const route = mapActionUrlToAppRoute(item.action_url);
      if (route) {
        router.push(route as any);
      }
    },
    [handleMarkRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: item.read ? colors.surface : colors.primary + "10",
            borderColor: colors.border,
          },
        ]}
        onPress={() => handleOpenNotification(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor:
                (item.read ? colors.textTertiary : colors.primary) + "20",
            },
          ]}
        >
          <Ionicons
            name={iconForType(item.type)}
            size={22}
            color={item.read ? colors.textTertiary : colors.primary}
          />
        </View>
        <View style={styles.body}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontWeight: item.read ? "400" : "600",
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.message, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {!item.read && (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    ),
    [colors, handleOpenNotification],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notificaciones
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>
              Leer todo
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : accessibleNotifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No tienes notificaciones accesibles
          </Text>
        </View>
      ) : (
        <FlatList
          data={accessibleNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            <View
              style={[
                styles.statusCard,
                {
                  borderColor:
                    scoreLevel === "riesgo"
                      ? colors.error
                      : scoreLevel === "atencion"
                        ? colors.warning
                        : colors.success,
                  backgroundColor:
                    scoreLevel === "riesgo"
                      ? colors.error + "12"
                      : scoreLevel === "atencion"
                        ? colors.warning + "12"
                        : colors.success + "12",
                },
              ]}
            >
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Status Score
              </Text>
              <Text style={[styles.statusScore, { color: colors.text }]}>
                {statusScore}/100
              </Text>
              <Text
                style={[styles.statusSubtitle, { color: colors.textSecondary }]}
              >
                {scoreLevel === "estable"
                  ? "Estado estable"
                  : scoreLevel === "atencion"
                    ? "Requiere atencion"
                    : "Riesgo alto, atiende action items"}
              </Text>
              {inaccessibleCount > 0 && (
                <Text
                  style={[styles.statusHint, { color: colors.textTertiary }]}
                >
                  {inaccessibleCount} notificaciones ocultas por permisos
                </Text>
              )}

              {actionItems.length > 0 && (
                <View style={styles.actionItemsWrap}>
                  {actionItems.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={item.action}
                      style={[
                        styles.actionItemBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name="construct-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text
                        style={[styles.actionItemText, { color: colors.text }]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: contentPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={ItemSeparator}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  markAll: { fontSize: 14, fontWeight: "600" },
  list: { padding: 16 },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusTitle: { fontSize: 13, fontWeight: "600" },
  statusScore: { fontSize: 24, fontWeight: "700", marginTop: 2 },
  statusSubtitle: { fontSize: 12, marginTop: 2 },
  statusHint: { fontSize: 11, marginTop: 6 },
  actionItemsWrap: { marginTop: 10, gap: 8 },
  actionItemBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionItemText: { fontSize: 12, fontWeight: "500", flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  body: { flex: 1 },
  title: { fontSize: 15, marginBottom: 2 },
  message: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyText: { fontSize: 15 },
});
