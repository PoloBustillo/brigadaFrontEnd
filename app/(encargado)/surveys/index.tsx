/**
 * Encargado Surveys - Assigned Surveys
 * Shows: Only surveys assigned to this encargado
 * Access: Encargados only (Rule 9)
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getCached, setCached } from "@/lib/api/memory-cache";
import type { AssignmentDetail } from "@/lib/api/assignments";
import { getMyCreatedAssignments } from "@/lib/api/assignments";
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

interface SurveyGroup {
  surveyId: number;
  title: string;
  brigadistasAssigned: number;
  totalResponses: number;
  status: "active" | "inactive";
  createdAt: string;
}

function groupBySurvey(assignments: AssignmentDetail[]): SurveyGroup[] {
  const map = new Map<number, SurveyGroup>();
  for (const a of assignments) {
    if (!map.has(a.survey_id)) {
      map.set(a.survey_id, {
        surveyId: a.survey_id,
        title: a.survey.title,
        brigadistasAssigned: 0,
        totalResponses: 0,
        status: a.status,
        createdAt: a.created_at,
      });
    }
    const g = map.get(a.survey_id)!;
    g.brigadistasAssigned++;
    g.totalResponses += a.response_count;
    if (a.status === "active") g.status = "active";
  }
  return Array.from(map.values());
}

export default function EncargadoSurveys() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const initialSurveys = getCached<SurveyGroup[]>("encargado:surveys");
  const [surveys, setSurveys] = useState<SurveyGroup[]>(initialSurveys ?? []);
  const [isLoading, setIsLoading] = useState(!initialSurveys);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const statusConfig = {
    active: {
      label: "Activa",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    inactive: {
      label: "Inactiva",
      color: colors.textSecondary,
      icon: "pause-circle" as const,
    },
  };

  const fetchSurveys = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(false);
    try {
      const data = await getMyCreatedAssignments();
      const grouped = groupBySurvey(data);
      setSurveys(grouped);
      setCached("encargado:surveys", grouped);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSurveys(!!initialSurveys);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  const totalResponses = surveys.reduce((acc, s) => acc + s.totalResponses, 0);
  const activeSurveys = surveys.filter((s) => s.status === "active").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <View style={styles.noticeContainer}>
        <CMSNotice message="Vista informativa. La configuración de encuestas se realiza en el CMS web." />
      </View>

      {fetchError && surveys.length > 0 && (
        <TouchableOpacity style={styles.errorBanner} onPress={() => fetchSurveys()}>
          <Text style={styles.errorBannerText}>
            No se pudo actualizar. Toca para reintentar.
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
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
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {surveys.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Asignadas
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="pulse" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {activeSurveys}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Activas
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="chatbox" size={24} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalResponses}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Respuestas
              </Text>
            </View>
          </View>

          {/* Surveys List */}
          <View style={styles.listContainer}>
            {surveys.length === 0 ? (
              fetchError ? (
                <TouchableOpacity
                  style={styles.emptyState}
                  onPress={() => fetchSurveys()}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={64}
                    color={colors.error}
                  />
                  <Text style={[styles.emptyText, { color: colors.error }]}>
                    Sin conexión
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    No se pudieron cargar las encuestas. Toca para reintentar.
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="document-text-outline"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Sin encuestas asignadas
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Las encuestas que te asignen aparecerán aquí
                  </Text>
                </View>
              )
            ) : (
              surveys.map((survey) => {
                const config =
                  statusConfig[survey.status] ?? statusConfig.inactive;

                return (
                  <View
                    key={survey.surveyId}
                    style={[
                      styles.surveyCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleSection}>
                        <Text
                          style={[styles.cardTitle, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {survey.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: config.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={config.icon}
                          size={14}
                          color={config.color}
                        />
                        <Text
                          style={[styles.statusText, { color: config.color }]}
                        >
                          {config.label}
                        </Text>
                      </View>
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {survey.brigadistasAssigned} brigadista
                          {survey.brigadistasAssigned !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="chatbox-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {survey.totalResponses} respuesta
                          {survey.totalResponses !== 1 ? "s" : ""}
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
                      <View style={styles.footerInfo}>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.footerText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Asignada{" "}
                            {new Date(survey.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="eye-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  </View>
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
  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
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
  surveyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
