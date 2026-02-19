/**
 * Encargado Assignments Screen
 * View assigned surveys and team management
 * Rule 9-10: Encargado can only see their assignments
 */

import { UserHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import {
  getMyCreatedAssignments,
  type AssignmentDetail,
} from "@/lib/api/assignments";
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

/** Assignments grouped by survey for the management view */
interface SurveyGroup {
  surveyId: number;
  surveyTitle: string;
  brigadistas: { id: number; name: string }[];
  responsesCount: number;
  status: "active" | "inactive";
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  active: {
    label: "Activa",
    color: "#06D6A0",
    icon: "play-circle",
  },
  inactive: {
    label: "Inactiva",
    color: "#9CA3AF",
    icon: "pause-circle",
  },
};

function groupBysurvey(assignments: AssignmentDetail[]): SurveyGroup[] {
  const map = new Map<number, SurveyGroup>();
  for (const a of assignments) {
    if (!map.has(a.survey_id)) {
      map.set(a.survey_id, {
        surveyId: a.survey_id,
        surveyTitle: a.survey.title,
        brigadistas: [],
        responsesCount: 0,
        status: a.status,
        createdAt: a.created_at,
      });
    }
    const group = map.get(a.survey_id)!;
    group.brigadistas.push({ id: a.user_id, name: a.user.full_name });
    group.responsesCount += a.response_count;
    // If any assignment is active, the group is active
    if (a.status === "active") group.status = "active";
  }
  return Array.from(map.values());
}

export default function EncargadoAssignmentsScreen() {
  const colors = useThemeColors();

  const [surveyGroups, setSurveyGroups] = useState<SurveyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = async () => {
    setFetchError(false);
    try {
      const data = await getMyCreatedAssignments();
      setSurveyGroups(groupBysurvey(data));
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleViewAssignment = (group: SurveyGroup) => {
    console.log("View survey group:", group.surveyId);
  };

  const totalBrigadistas = Array.from(
    new Set(surveyGroups.flatMap((g) => g.brigadistas.map((b) => b.id))),
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <UserHeader title="Mis Asignaciones" />

      {fetchError && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchAssignments}>
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
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: "#00B4D8" }]}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.summaryValue}>{surveyGroups.length}</Text>
              <Text style={styles.summaryLabel}>Encuestas</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#06D6A0" }]}>
              <Ionicons name="people-outline" size={32} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{totalBrigadistas}</Text>
              <Text style={styles.summaryLabel}>Mi Equipo</Text>
            </View>
          </View>

          {/* Assignments List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Encuestas Activas
            </Text>

            {surveyGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="folder-open-outline"
                  size={64}
                  color={colors.icon}
                />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No tienes asignaciones
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                  Crea asignaciones desde el panel web
                </Text>
              </View>
            ) : (
              surveyGroups.map((group) => {
                const statusConf =
                  STATUS_CONFIG[group.status] ?? STATUS_CONFIG.inactive;

                return (
                  <TouchableOpacity
                    key={group.surveyId}
                    style={[
                      styles.assignmentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleViewAssignment(group)}
                    activeOpacity={0.7}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <Text
                        style={[styles.cardTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {group.surveyTitle}
                      </Text>
                    </View>

                    {/* Status badge */}
                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusConf.color },
                        ]}
                      >
                        <Ionicons
                          name={statusConf.icon as any}
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.statusText}>
                          {statusConf.label}
                        </Text>
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
                        {group.brigadistas.length} brigadista
                        {group.brigadistas.length !== 1 ? "s" : ""} asignado
                        {group.brigadistas.length !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    {/* Response count */}
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="chatbox-outline"
                        size={18}
                        color={colors.icon}
                      />
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {group.responsesCount} respuesta
                        {group.responsesCount !== 1 ? "s" : ""} del equipo
                      </Text>
                    </View>

                    {/* Footer */}
                    <View
                      style={[
                        styles.cardFooter,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[styles.progressStats, { color: colors.icon }]}
                      >
                        Asignada{" "}
                        {new Date(group.createdAt).toLocaleDateString()}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.icon}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
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
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
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
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  errorBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: 6,
  },
  cardDescription: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deadlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    ...typography.body,
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
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercentage: {
    ...typography.bodySmall,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00B4D8",
  },
});
