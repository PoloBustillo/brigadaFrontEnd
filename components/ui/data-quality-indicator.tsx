/**
 * Data Quality Indicator
 *
 * Shows visual indicators for response data quality:
 * - Missing fields (GPS, metadata)
 * - Sync issues
 * - OCR confidence for INE documents
 */

import { useThemeColors } from "@/contexts/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface DataQualityIssue {
  type:
    | "missing_gps"
    | "missing_metadata"
    | "low_ocr"
    | "sync_error"
    | "offline";
  severity: "warning" | "error" | "info";
  message: string;
}

interface DataQualityIndicatorProps {
  issues: DataQualityIssue[];
  syncStatus?: "pending" | "syncing" | "error" | "uploaded";
  hideIfEmpty?: boolean;
  compact?: boolean;
}

export function DataQualityIndicator({
  issues,
  syncStatus,
  hideIfEmpty = true,
  compact = false,
}: DataQualityIndicatorProps) {
  const { warning, error, info, text, surface } = useThemeColors();

  if (hideIfEmpty && issues.length === 0 && !syncStatus) {
    return null;
  }

  const hasCritical = issues.some((i) => i.severity === "error");
  const hasWarning = issues.some((i) => i.severity === "warning");
  const allWarnings = issues.filter((i) => i.severity === "warning");
  const allErrors = issues.filter((i) => i.severity === "error");

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {syncStatus === "pending" && (
          <View style={[styles.statusBadge, { backgroundColor: info }]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>Pending sync</Text>
          </View>
        )}
        {syncStatus === "syncing" && (
          <View style={[styles.statusBadge, { backgroundColor: info }]}>
            <MaterialCommunityIcons name="sync" size={14} color="#fff" />
            <Text style={styles.statusText}>Syncing...</Text>
          </View>
        )}
        {syncStatus === "error" && (
          <View style={[styles.statusBadge, { backgroundColor: error }]}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>Sync error</Text>
          </View>
        )}
        {hasCritical && (
          <View style={[styles.statusBadge, { backgroundColor: error }]}>
            <MaterialCommunityIcons name="alert" size={14} color="#fff" />
            <Text style={styles.statusText}>{allErrors.length} issue(s)</Text>
          </View>
        )}
        {!hasCritical && hasWarning && (
          <View style={[styles.statusBadge, { backgroundColor: warning }]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {allWarnings.length} warning(s)
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>
      {syncStatus && (
        <View style={styles.section}>
          <View
            style={[
              styles.syncStatusRow,
              {
                borderLeftColor:
                  syncStatus === "error"
                    ? error
                    : syncStatus === "syncing"
                      ? info
                      : warning,
              },
            ]}
          >
            {syncStatus === "pending" && (
              <>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color={warning}
                />
                <Text style={[styles.text, { color: text }]}>
                  Waiting to sync
                </Text>
              </>
            )}
            {syncStatus === "syncing" && (
              <>
                <MaterialCommunityIcons name="sync" size={18} color={info} />
                <Text style={[styles.text, { color: text }]}>
                  Syncing changes...
                </Text>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={18}
                  color={error}
                />
                <Text style={[styles.text, { color: error }]}>
                  Sync failed - will retry
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {allErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: error }]}>Issues:</Text>
          {allErrors.map((issue, idx) => (
            <View key={idx} style={styles.issueRow}>
              <MaterialCommunityIcons
                name="alert"
                size={16}
                color={error}
                style={styles.issueIcon}
              />
              <Text style={[styles.issueText, { color: text }]}>
                {issue.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {allWarnings.length > 0 && (
        <View style={styles.section}>
          {!allErrors.length && (
            <Text style={[styles.sectionTitle, { color: warning }]}>
              Warnings:
            </Text>
          )}
          {allWarnings.map((issue, idx) => (
            <View key={idx} style={styles.issueRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={16}
                color={warning}
                style={styles.issueIcon}
              />
              <Text style={[styles.issueText, { color: text }]}>
                {issue.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  section: {
    marginBottom: 8,
  },
  syncStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingVertical: 4,
    borderLeftWidth: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  issueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
    paddingLeft: 8,
  },
  issueIcon: {
    marginTop: 2,
  },
  issueText: {
    fontSize: 13,
    flex: 1,
  },

  // Compact version
  compactContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});
