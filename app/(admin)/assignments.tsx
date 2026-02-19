/**
 * Admin Assignments Screen
 * Read-only assignments overview for mobile
 * Assignment management is handled in web CMS
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getAdminAssignments, type AdminAssignment } from "@/lib/api/admin";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Assignment {
  id: number;
  surveyTitle: string;
  brigadistaName: string;
  location: string;
  brigadistasCount: number;
  responsesCount: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
}

const getStatusConfig = (colors: ReturnType<typeof useThemeColors>) => ({
  ACTIVE: {
    label: "Activa",
    color: colors.success,
    icon: "play-circle" as const,
  },
  COMPLETED: {
    label: "Completada",
    color: colors.info,
    icon: "checkmark-circle" as const,
  },
  PAUSED: {
    label: "Pausada",
    color: colors.warning,
    icon: "pause-circle" as const,
  },
});

export default function AdminAssignmentsScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const STATUS_CONFIG = getStatusConfig(colors);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mapAssignment = (raw: AdminAssignment): Assignment => ({
    id: raw.id,
    surveyTitle: raw.survey.title,
    brigadistaName: raw.user.full_name,
    location: raw.location ?? "Sin ubicación",
    brigadistasCount: 1,
    responsesCount: raw.response_count,
    status: raw.status === "active" ? "ACTIVE" : "COMPLETED",
    assignedAt: raw.created_at,
  });

  const fetchAssignments = async () => {
    setFetchError(false);
    try {
      const data = await getAdminAssignments();
      setAssignments(data.map(mapAssignment));
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAssignments();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Asignaciones" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPadding },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <CMSNotice message="Vista de solo lectura. Las asignaciones se gestionan desde el CMS web." />

        {fetchError && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={fetchAssignments}
          >
            <Text style={styles.errorBannerText}>
              No se pudo cargar. Toca para reintentar.
            </Text>
          </TouchableOpacity>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.success },
                ]}
              >
                <Text
                  style={[styles.summaryValue, { color: colors.background }]}
                >
                  {assignments.filter((a) => a.status === "ACTIVE").length}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.background }]}
                >
                  Activas
                </Text>
              </View>
              <View
                style={[styles.summaryCard, { backgroundColor: colors.info }]}
              >
                <Text
                  style={[styles.summaryValue, { color: colors.background }]}
                >
                  {assignments.filter((a) => a.status === "COMPLETED").length}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.background }]}
                >
                  Completadas
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.warning },
                ]}
              >
                <Text
                  style={[styles.summaryValue, { color: colors.background }]}
                >
                  {assignments.length}
                </Text>
                <Text style={styles.summaryLabel}>Brigadistas</Text>
              </View>
            </View>

            {/* Assignments List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Todas las Asignaciones
              </Text>

              {assignments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="clipboard-outline"
                    size={64}
                    color={colors.icon}
                  />
                  <Text style={[styles.emptyText, { color: colors.icon }]}>
                    No hay asignaciones
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                    Gestiona asignaciones desde el CMS web
                  </Text>
                </View>
              ) : (
                assignments.map((assignment) => {
                  const statusConfig = STATUS_CONFIG[assignment.status];

                  return (
                    <View
                      key={assignment.id}
                      style={[
                        styles.assignmentCard,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardTitleContainer}>
                          <Text
                            style={[styles.cardTitle, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {assignment.surveyTitle}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusConfig.color },
                            ]}
                          >
                            <Ionicons
                              name={statusConfig.icon}
                              size={14}
                              color={colors.background}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: colors.background },
                              ]}
                            >
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Team Info */}
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={colors.icon}
                        />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {assignment.location}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={colors.icon}
                        />
                        <Text style={[styles.infoText, { color: colors.text }]}>
                          {assignment.brigadistaName}
                        </Text>
                        <Text
                          style={[styles.infoSubtext, { color: colors.icon }]}
                        >
                          • {assignment.brigadistasCount} brigadistas
                        </Text>
                      </View>

                      {/* Responses */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text
                            style={[
                              styles.progressText,
                              { color: colors.text },
                            ]}
                          >
                            Respuestas registradas
                          </Text>
                          <Text
                            style={[
                              styles.progressStats,
                              { color: colors.icon },
                            ]}
                          >
                            {assignment.responsesCount}
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
                        <Text style={[styles.dateText, { color: colors.icon }]}>
                          Asignada:{" "}
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </Text>
                        <Ionicons
                          name="eye-outline"
                          size={20}
                          color={colors.icon}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    ...typography.h3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleContainer: {
    gap: 8,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    ...typography.body,
  },
  infoSubtext: {
    ...typography.bodySmall,
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  progressStats: {
    ...typography.bodySmall,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dateText: {
    ...typography.bodySmall,
  },
});
