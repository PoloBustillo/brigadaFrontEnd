import { ScreenHeader } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  getAssignedSurveys,
  type AssignedSurveyResponse,
} from "@/lib/api/mobile";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXTRAS_CACHE_KEY = "extras_all";
const EXTRAS_CACHE_TTL = 30 * 60 * 1000;

type ExtraSurvey = AssignedSurveyResponse & {
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  isActive: boolean;
  urgencyLevel: "critical" | "warning" | "normal" | "expired";
};

export default function BrigadistaExtrasScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [extras, setExtras] = useState<ExtraSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateUrgency = (
    assignment: AssignedSurveyResponse,
  ): ExtraSurvey => {
    const now = new Date();
    const endDate = assignment.ends_at ? new Date(assignment.ends_at) : null;

    let daysRemaining = 999;
    let hoursRemaining = 0;
    let isExpired = false;
    let isActive = true;
    let urgencyLevel: "critical" | "warning" | "normal" | "expired" = "normal";

    if (endDate) {
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

      daysRemaining = Math.max(0, diffDays);
      hoursRemaining = Math.max(0, diffHours);

      if (diffMs < 0) {
        isExpired = true;
        isActive = false;
        urgencyLevel = "expired";
      } else if (diffDays <= 1) {
        urgencyLevel = "critical";
      } else if (diffDays <= 3) {
        urgencyLevel = "warning";
      }
    }

    return {
      ...assignment,
      daysRemaining,
      hoursRemaining,
      isExpired,
      isActive,
      urgencyLevel,
    };
  };

  const loadExtras = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    let hasCached = false;

    try {
      const cached = await cacheRepository.get<ExtraSurvey[]>(
        EXTRAS_CACHE_KEY,
        true,
      );
      if (cached && cached.length > 0) {
        hasCached = true;
        setExtras(cached);
        setErrorMessage(null);
        if (showLoading) {
          setIsLoading(false);
        }
      }
    } catch {
      // Ignore cache failures and continue with network attempt.
    }

    try {
      const [active, inactive] = await Promise.all([
        getAssignedSurveys("active"),
        getAssignedSurveys("inactive"),
      ]);

      const allSurveys = [...active, ...inactive];
      const extrasSurveys = allSurveys
        .filter((s) => s.survey_type === "extra")
        .map(calculateUrgency)
        .sort((a, b) => {
          if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
          if (a.urgencyLevel !== b.urgencyLevel) {
            const urgencyOrder = {
              critical: 0,
              warning: 1,
              normal: 2,
              expired: 3,
            };
            return (
              (urgencyOrder[a.urgencyLevel] ?? 4) -
              (urgencyOrder[b.urgencyLevel] ?? 4)
            );
          }
          return b.hoursRemaining - a.hoursRemaining;
        });

      setExtras(extrasSurveys);
      await cacheRepository.set(
        EXTRAS_CACHE_KEY,
        extrasSurveys,
        EXTRAS_CACHE_TTL,
      );
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error cargando encuestas Extra",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadExtras(false);
    setIsRefreshing(false);
  }, [loadExtras]);

  const handleOpenSurvey = (assignment: ExtraSurvey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(brigadista)/surveys/fill",
      params: {
        surveyId: String(assignment.survey_id),
        surveyTitle: assignment.survey_title,
        versionId: String(assignment.latest_version.id),
        questionsJson: JSON.stringify(
          assignment.latest_version.questions ?? [],
        ),
      },
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return colors.error;
      case "warning":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "Vence hoy";
      case "warning":
        return "Próximo a vencer";
      case "normal":
        return "Tiempo disponible";
      case "expired":
        return "Expirada";
      default:
        return "";
    }
  };

  const formatTimeRemaining = (
    days: number,
    hours: number,
    isExpired: boolean,
  ) => {
    if (isExpired) return "Expirada";
    if (days === 0) return `${hours}h restantes`;
    if (days === 1) return "Vence hoy";
    return `${days} días restantes`;
  };

  const metrics = {
    total: extras.length,
    active: extras.filter(
      (e) => !e.isExpired && e.assignment_status === "active",
    ).length,
    critical: extras.filter((e) => e.urgencyLevel === "critical").length,
    expired: extras.filter((e) => e.urgencyLevel === "expired").length,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Encuestas Extra"
        subtitle="Accesos con vigencia temporal"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + Math.max(insets.bottom, 12) },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Card with Metrics */}
        {extras.length > 0 && (
          <LinearGradient
            colors={[colors.info + "22", colors.primary + "14", colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: colors.border }]}
          >
            <View style={styles.heroHeader}>
              <View
                style={[
                  styles.heroIconWrap,
                  { backgroundColor: colors.info + "18" },
                ]}
              >
                <Ionicons name="time-outline" size={20} color={colors.info} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Encuestas temporales
              </Text>
            </View>

            <Text
              style={[styles.heroSubtitle, { color: colors.textSecondary }]}
            >
              Estas encuestas tienen vigencia limitada. Responde antes de que se
              venza el plazo.
            </Text>

            <View style={styles.metricsRow}>
              <View
                style={[
                  styles.metricItem,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {metrics.total}
                </Text>
                <Text
                  style={[styles.metricLabel, { color: colors.textSecondary }]}
                >
                  Total
                </Text>
              </View>
              <View
                style={[
                  styles.metricItem,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color:
                        metrics.active > 0
                          ? colors.success
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {metrics.active}
                </Text>
                <Text
                  style={[styles.metricLabel, { color: colors.textSecondary }]}
                >
                  Activas
                </Text>
              </View>
              {metrics.critical > 0 && (
                <View
                  style={[
                    styles.metricItem,
                    {
                      borderColor: colors.error,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.metricValue, { color: colors.error }]}>
                    {metrics.critical}
                  </Text>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Urgentes
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        )}

        {isLoading && !extras.length ? (
          <View style={[styles.centerContainer, styles.padding]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando encuestas...
            </Text>
          </View>
        ) : errorMessage && !extras.length ? (
          <View
            style={[
              styles.emptyState,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={colors.error}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Error al cargar
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.textSecondary }]}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => loadExtras()}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.retryButtonText, { color: colors.surface }]}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : extras.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={colors.success}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin encuestas Extra
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.textSecondary }]}
            >
              Por ahora no hay encuestas temporales asignadas. Vuelve más tarde
              para nuevas oportunidades.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.text }]}>
                Tus encuestas ({extras.length})
              </Text>
            </View>

            <View style={styles.surveysList}>
              {extras.map((survey) => (
                <View key={survey.assignment_id}>
                  <TouchableOpacity
                    onPress={() => handleOpenSurvey(survey)}
                    disabled={survey.isExpired}
                    activeOpacity={survey.isExpired ? 1 : 0.7}
                  >
                    <LinearGradient
                      colors={
                        survey.isExpired
                          ? [colors.surface, colors.surface]
                          : survey.urgencyLevel === "critical"
                            ? [colors.error + "12", colors.error + "08"]
                            : survey.urgencyLevel === "warning"
                              ? [colors.warning + "12", colors.warning + "08"]
                              : [colors.surface, colors.surface]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.surveyCard,
                        {
                          borderColor:
                            survey.urgencyLevel === "critical"
                              ? colors.error
                              : survey.urgencyLevel === "warning"
                                ? colors.warning
                                : colors.border,
                          opacity: survey.isExpired ? 0.6 : 1,
                        },
                      ]}
                    >
                      <View style={styles.surveyCardTop}>
                        <View style={styles.surveyTitleArea}>
                          <Text
                            style={[styles.surveyTitle, { color: colors.text }]}
                            numberOfLines={2}
                          >
                            {survey.survey_title}
                          </Text>
                          {survey.survey_description && (
                            <Text
                              style={[
                                styles.surveyDescription,
                                { color: colors.textSecondary },
                              ]}
                              numberOfLines={2}
                            >
                              {survey.survey_description}
                            </Text>
                          )}
                        </View>

                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: colors.info + "20" },
                          ]}
                        >
                          <Ionicons
                            name="hourglass-outline"
                            size={12}
                            color={colors.info}
                          />
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: colors.info },
                            ]}
                          >
                            Extra
                          </Text>
                        </View>
                      </View>

                      <View style={styles.surveyCardBottom}>
                        <View style={styles.timeInfo}>
                          <View
                            style={[
                              styles.urgencyBadge,
                              {
                                backgroundColor:
                                  getUrgencyColor(survey.urgencyLevel) + "20",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.urgencyDot,
                                {
                                  backgroundColor: getUrgencyColor(
                                    survey.urgencyLevel,
                                  ),
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.urgencyText,
                                {
                                  color: getUrgencyColor(survey.urgencyLevel),
                                },
                              ]}
                            >
                              {getUrgencyText(survey.urgencyLevel)}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.timeText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatTimeRemaining(
                              survey.daysRemaining,
                              survey.hoursRemaining,
                              survey.isExpired,
                            )}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleOpenSurvey(survey)}
                          disabled={survey.isExpired}
                          style={[
                            styles.openButton,
                            {
                              backgroundColor: survey.isExpired
                                ? colors.textSecondary + "40"
                                : colors.primary,
                            },
                          ]}
                        >
                          <Ionicons
                            name={survey.isExpired ? "lock-closed" : "play"}
                            size={14}
                            color={
                              survey.isExpired
                                ? colors.textSecondary
                                : colors.surface
                            }
                          />
                          <Text
                            style={[
                              styles.openButtonText,
                              {
                                color: survey.isExpired
                                  ? colors.textSecondary
                                  : colors.surface,
                              },
                            ]}
                          >
                            {survey.isExpired ? "Expirada" : "Abrir"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  padding: { padding: 20 },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Hero Card
  heroCard: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // List
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  surveysList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Survey Card
  surveyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  surveyCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  surveyTitleArea: {
    flex: 1,
    gap: 4,
  },
  surveyTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  surveyDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Card Bottom
  surveyCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  timeInfo: {
    flex: 1,
    gap: 6,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 11,
  },
  openButton: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
