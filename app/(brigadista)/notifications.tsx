/**
 * Brigadista Notifications Screen
 * Lists notifications with pull-to-refresh and mark-read actions.
 */

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
import React, { useCallback, useEffect, useState } from "react";
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

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const renderItem = useCallback(({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: item.read ? colors.surface : colors.primary + "10",
          borderColor: colors.border,
        },
      ]}
      onPress={() => !item.read && handleMarkRead(item.id)}
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
  ), [colors, handleMarkRead]);

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
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No tienes notificaciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
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
