/**
 * Sync Queue Display
 *
 * Shows pending items with status badges
 * - Responses pending upload
 * - Documents pending upload
 * - Sync errors
 * - Manual retry option
 */

import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SyncQueueDisplayProps {
  compact?: boolean;
  maxItems?: number;
}

export function SyncQueueDisplay({
  compact = false,
  maxItems = 5,
}: SyncQueueDisplayProps) {
  const { pendingItems, pendingByType, syncAll, isSyncing } = useSync();
  const { primary, warning, error, info, text, surface } = useThemeColors();

  const visibleItems = useMemo(() => {
    return pendingItems
      .filter((item) => item.status === "pending" || item.status === "error")
      .slice(0, maxItems);
  }, [pendingItems, maxItems]);

  if (visibleItems.length === 0) {
    return null;
  }

  const totalPending =
    pendingByType.responses +
    pendingByType.files +
    pendingByType.surveys +
    pendingByType.users;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "error":
        return error;
      case "syncing":
        return info;
      case "pending":
        return warning;
      default:
        return info;
    }
  };

  const getStatusIcon = (type: string, status: string) => {
    if (status === "error") return "alert-circle";
    if (status === "syncing") return "sync";
    switch (type) {
      case "response":
        return "clipboard-check";
      case "file":
        return "file-upload";
      case "survey":
        return "download";
      case "user":
        return "account";
      default:
        return "clock";
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: surface }]}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons
            name="package-down"
            size={18}
            color={text}
            style={{ opacity: 0.7 }}
          />
          <Text style={[styles.compactTitle, { color: text }]}>
            {totalPending} pending
          </Text>
          <View style={styles.compactBadges}>
            {pendingByType.responses > 0 && (
              <View style={[styles.compactBadge, { backgroundColor: warning }]}>
                <Text style={styles.compactBadgeText}>
                  {pendingByType.responses}
                </Text>
              </View>
            )}
            {pendingByType.files > 0 && (
              <View style={[styles.compactBadge, { backgroundColor: info }]}>
                <Text style={styles.compactBadgeText}>
                  {pendingByType.files}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons
            name="package-down"
            size={20}
            color={text}
            style={{ opacity: 0.7 }}
          />
          <Text style={[styles.title, { color: text }]}>
            {totalPending} items pending sync
          </Text>
        </View>

        <View style={styles.typeBadges}>
          {pendingByType.responses > 0 && (
            <View style={[styles.typeBadge, { backgroundColor: warning }]}>
              <MaterialCommunityIcons
                name="clipboard"
                size={14}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.typeBadgeText}>
                {pendingByType.responses}
              </Text>
            </View>
          )}
          {pendingByType.files > 0 && (
            <View style={[styles.typeBadge, { backgroundColor: info }]}>
              <MaterialCommunityIcons
                name="file"
                size={14}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.typeBadgeText}>{pendingByType.files}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              {
                borderLeftColor: getStatusColor(item.status),
                backgroundColor:
                  item.status === "error"
                    ? `${error}15`
                    : item.status === "syncing"
                      ? `${info}15`
                      : `${warning}15`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={getStatusIcon(item.type, item.status)}
              size={18}
              color={getStatusColor(item.status)}
              style={styles.itemIcon}
            />

            <View style={styles.itemContent}>
              <Text
                style={[styles.itemType, { color: text }]}
                numberOfLines={1}
              >
                {item.type === "response"
                  ? "Response"
                  : item.type === "file"
                    ? "Document"
                    : item.type === "survey"
                      ? "Survey"
                      : "User"}{" "}
                ({item.retryCount > 0 ? `retry: ${item.retryCount}` : "1st try"}
                )
              </Text>
              {item.error && (
                <Text style={[styles.itemError, { color: error }]}>
                  {item.error.substring(0, 50)}
                  {item.error.length > 50 ? "..." : ""}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === "error"
                      ? error
                      : item.status === "syncing"
                        ? info
                        : warning,
                },
              ]}
            />
          </View>
        )}
      />

      {visibleItems.length < totalPending && (
        <Text style={[styles.moreItems, { color: text }]}>
          ... and {totalPending - visibleItems.length} more items
        </Text>
      )}

      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: primary }]}
        onPress={syncAll}
        disabled={isSyncing}
      >
        <MaterialCommunityIcons
          name={isSyncing ? "sync" : "play"}
          size={18}
          color="#fff"
        />
        <Text style={styles.retryButtonText}>
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full display
  container: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  typeBadges: {
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 6,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemType: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemError: {
    fontSize: 12,
    fontStyle: "italic",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  moreItems: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Compact display
  compactContainer: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  compactBadges: {
    flexDirection: "row",
    gap: 6,
  },
  compactBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
