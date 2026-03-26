/**
 * Encargado Surveys - Assigned Surveys
 * Shows: Only surveys assigned to this encargado
 * Access: Encargados only (Rule 9)
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getMyTeamSummary,
} from "@/lib/api/assignments";
import { getCached, setCached } from "@/lib/api/memory-cache";
import { getLatestSurveyVersion } from "@/lib/api/mobile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  activeAssignments: number;
  hasPublishedVersion: boolean;
  status: "active" | "inactive";
  createdAt: string;
}

export default function EncargadoSurveys() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const initialSurveys = getCached<SurveyGroup[]>("encargado:surveys");
  const [surveys, setSurveys] = useState<SurveyGroup[]>(initialSurveys ?? []);
  const [isLoading, setIsLoading] = useState(!initialSurveys);
  const [fetchError, setFetchError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!!initialSurveys);
  const [refreshing, setRefreshing] = useState(false);
  const [busySurveyId, setBusySurveyId] = useState<number | null>(null);

  const statusConfig = useMemo(
    () => ({
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
    }),
    [colors.success, colors.textSecondary],
  );

  const fetchSurveys = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(false);

    if (!user?.id) {
      setSurveys([]);
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const summary = await getMyTeamSummary();
      const grouped: SurveyGroup[] = summary.surveys.map((survey) => ({
        surveyId: survey.survey_id,
        title: survey.title,
        brigadistasAssigned: survey.brigadistas_assigned,
        totalResponses: survey.submissions_count,
        activeAssignments: survey.active_assignments,
        hasPublishedVersion: survey.has_published_version,
        status: survey.status,
        createdAt: survey.created_at,
      }));

      setSurveys(grouped);
      setHasLoadedOnce(true);
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
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  const handleStartSurvey = async (survey: SurveyGroup) => {
    if (busySurveyId !== null) return;
    if (survey.status !== "active") return;
    if (!survey.hasPublishedVersion) {
      Alert.alert(
        "Encuesta no publicada",
        `La encuesta \"${survey.title}\" aun no tiene una version publicada para llenado movil.`,
      );
      return;
    }

    setBusySurveyId(survey.surveyId);
    try {
      const latestVersion = await getLatestSurveyVersion(survey.surveyId);
      if (!latestVersion) {
        Alert.alert(
          "Encuesta no disponible",
          `No se encontro version publicada para \"${survey.title}\" o no tienes acceso desde este endpoint.`,
        );
        return;
      }
      router.push({
        pathname: "/(encargado)/surveys/fill",
        params: {
          surveyId: String(survey.surveyId),
          surveyTitle: survey.title,
          versionId: String(latestVersion.id),
          questionsJson: JSON.stringify(latestVersion.questions ?? []),
        },
      });
    } catch {
      setFetchError(true);
    } finally {
      setBusySurveyId(null);
    }
  };

  const totalResponses = useMemo(
    () => surveys.reduce((acc, s) => acc + s.totalResponses, 0),
    [surveys],
  );
  const activeSurveys = useMemo(
    () => surveys.filter((s) => s.status === "active").length,
    [surveys],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <View style={styles.noticeContainer}>
        <CMSNotice message="Ves encuestas dentro de tu alcance. La configuración global se realiza en el CMS web." />
      </View>

      {fetchError && surveys.length > 0 && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={() => fetchSurveys()}
        >
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: contentPadding + 24 },
          ]}
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
              fetchError && !hasLoadedOnce ? (
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
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
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
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
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

                    {!survey.hasPublishedVersion && (
                      <View
                        style={[
                          styles.unpublishedBadge,
                          { backgroundColor: colors.warning + "20" },
                        ]}
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={14}
                          color={colors.warning}
                        />
                        <Text
                          style={[
                            styles.unpublishedText,
                            { color: colors.warning },
                          ]}
                        >
                          Sin version publicada
                        </Text>
                      </View>
                    )}

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
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor:
                                survey.status === "active" &&
                                survey.hasPublishedVersion
                                  ? colors.primary + "20"
                                  : colors.border,
                              opacity:
                                survey.status === "active" &&
                                survey.hasPublishedVersion
                                  ? 1
                                  : 0.6,
                            },
                          ]}
                          onPress={() => handleStartSurvey(survey)}
                          disabled={
                            survey.status !== "active" ||
                            !survey.hasPublishedVersion ||
                            busySurveyId === survey.surveyId
                          }
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color={
                              survey.status === "active" &&
                              survey.hasPublishedVersion
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.actionButtonText,
                              {
                                color:
                                  survey.status === "active" &&
                                  survey.hasPublishedVersion
                                    ? colors.primary
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            Llenar
                          </Text>
                        </TouchableOpacity>
                      </View>
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
  unpublishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  unpublishedText: {
    fontSize: 12,
    fontWeight: "600",
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
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
