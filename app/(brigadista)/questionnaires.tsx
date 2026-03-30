import { ScreenHeader } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { getAdminSurveys, type AdminSurvey } from "@/lib/api/admin";
import {
  getAssignedSurveys,
  type AssignedSurveyResponse,
} from "@/lib/api/mobile";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const ASSIGNMENTS_CACHE_KEY = "assignments_all";
const ASSIGNMENTS_CACHE_TTL = 30 * 60 * 1000;

type DecoratedAssignment = AssignedSurveyResponse & {
  temporalState: "active" | "upcoming" | "expired";
  canOpen: boolean;
  questionCount: number;
};

export default function BrigadistaQuestionnairesScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignedSurveyResponse[]>([]);
  const [globalSurveys, setGlobalSurveys] = useState<AdminSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canViewAllSurveys = (user?.permissions ?? []).includes(
    "view_all_surveys",
  );

  const loadAssignments = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }

      let hasCached = false;

      try {
        const cached = await cacheRepository.get<AssignedSurveyResponse[]>(
          ASSIGNMENTS_CACHE_KEY,
          true,
        );
        if (cached && cached.length > 0) {
          hasCached = true;
          setAssignments(cached);
          setErrorMessage(null);
          if (showLoading) {
            setIsLoading(false);
          }
        }
      } catch {
        // Ignore cache failures and continue with network attempt.
      }

      try {
        const [activeAssignments, inactiveAssignments, adminCatalog] =
          await Promise.all([
            getAssignedSurveys("active"),
            getAssignedSurveys("inactive"),
            canViewAllSurveys ? getAdminSurveys() : Promise.resolve([]),
          ]);

        const byAssignmentId = new Map<number, AssignedSurveyResponse>();
        [...activeAssignments, ...inactiveAssignments].forEach((assignment) => {
          byAssignmentId.set(assignment.assignment_id, assignment);
        });

        const remote = Array.from(byAssignmentId.values());

        setAssignments(remote);
        setGlobalSurveys(adminCatalog);
        setErrorMessage(null);
        void cacheRepository.set(
          ASSIGNMENTS_CACHE_KEY,
          remote,
          ASSIGNMENTS_CACHE_TTL,
        );
      } catch (error: any) {
        if (!hasCached) {
          setAssignments([]);
          setErrorMessage(
            error?.message ?? "No se pudo cargar la lista de encuestas.",
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [canViewAllSurveys],
  );

  useEffect(() => {
    loadAssignments().catch(() => {
      setIsLoading(false);
      setIsRefreshing(false);
    });
  }, [loadAssignments]);

  const decoratedAssignments = useMemo<DecoratedAssignment[]>(() => {
    const now = new Date();

    return assignments.map((assignment) => {
      const startsAt = assignment.starts_at
        ? new Date(assignment.starts_at)
        : null;
      const endsAt = assignment.ends_at ? new Date(assignment.ends_at) : null;

      const temporalState: DecoratedAssignment["temporalState"] =
        startsAt && startsAt > now
          ? "upcoming"
          : endsAt && endsAt < now
            ? "expired"
            : "active";

      const questionCount = assignment.latest_version?.questions?.length ?? 0;
      const canOpen =
        assignment.assignment_status === "active" &&
        temporalState === "active" &&
        Boolean(assignment.latest_version?.id);

      return {
        ...assignment,
        temporalState,
        canOpen,
        questionCount,
      };
    });
  }, [assignments]);

  const metrics = useMemo(() => {
    let canRespond = 0;
    let pending = 0;

    for (const item of decoratedAssignments) {
      if (item.canOpen) {
        canRespond += 1;
      } else if (item.assignment_status === "active") {
        pending += 1;
      }
    }

    return {
      total: decoratedAssignments.length,
      canRespond,
      pending,
    };
  }, [decoratedAssignments]);

  const visibleAssignments = useMemo(() => {
    return decoratedAssignments.filter((item) => item.canOpen);
  }, [decoratedAssignments]);

  const nonAssignedGlobalSurveys = useMemo(() => {
    if (!canViewAllSurveys || globalSurveys.length === 0) {
      return [];
    }

    const assignedSurveyIds = new Set(
      assignments.map((item) => item.survey_id),
    );
    return globalSurveys.filter((survey) => !assignedSurveyIds.has(survey.id));
  }, [canViewAllSurveys, globalSurveys, assignments]);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(true);
    loadAssignments(false).catch(() => {
      setIsRefreshing(false);
    });
  };

  const openAssignment = (assignment: DecoratedAssignment) => {
    if (!assignment.canOpen || !assignment.latest_version?.id) {
      return;
    }

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

  const formatWindow = (value: string | null) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const surveyTypeLabel = (type: "normal" | "gestion" | "extra") => {
    if (type === "gestion") return "Gestión";
    if (type === "extra") return "Extra";
    return "Normal";
  };

  const managementStatusLabel = (
    status: "pendiente" | "en_tramite" | "resuelto" | "problema" | null,
  ) => {
    if (status === "en_tramite") return "En trámite";
    if (status === "resuelto") return "Resuelto";
    if (status === "problema") return "Problema";
    return "Pendiente";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Cuestionarios"
        subtitle="Tus asignaciones: solo responde las activas y dentro de plazo"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + Math.max(insets.bottom, 12) },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={[colors.primary + "22", colors.info + "14", colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.border }]}
        >
          <View style={styles.heroHeader}>
            <View
              style={[
                styles.heroIconWrap,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons
                name="clipboard-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Panel de cuestionarios
            </Text>
          </View>

          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Visualiza todas tus asignaciones, identifica prioridades y entra
            directo a responder las activas.
          </Text>

          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricItem,
                { borderColor: colors.border, backgroundColor: colors.surface },
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
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {metrics.canRespond}
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Para responder
              </Text>
            </View>
            <View
              style={[
                styles.metricItem,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {metrics.pending}
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Pendientes
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.listHeaderRow}>
          <Text style={[styles.listTitle, { color: colors.text }]}>
            Encuestas para responder ({visibleAssignments.length})
          </Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>

        {errorMessage && assignments.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.warning}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!isLoading && visibleAssignments.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name="documents-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Por ahora no tienes cuestionarios disponibles para responder.
            </Text>
          </View>
        ) : null}

        {visibleAssignments.map((assignment) => (
          <View
            key={`${assignment.assignment_id}`}
            style={[
              styles.assignmentCard,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.assignmentTopRow}>
              <Text style={[styles.assignmentTitle, { color: colors.text }]}>
                {assignment.survey_title}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.metaPill,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Ionicons name="layers-outline" size={14} color={colors.info} />
                <Text
                  style={[styles.metaPillText, { color: colors.textSecondary }]}
                >
                  {surveyTypeLabel(assignment.survey_type)}
                </Text>
              </View>

              {assignment.survey_type === "gestion" ? (
                <View
                  style={[
                    styles.metaPill,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="git-network-outline"
                    size={14}
                    color={colors.warning}
                  />
                  <Text
                    style={[
                      styles.metaPillText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {managementStatusLabel(assignment.management_status)}
                  </Text>
                </View>
              ) : null}
            </View>

            {assignment.survey_description ? (
              <Text
                style={[
                  styles.assignmentDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {assignment.survey_description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.metaPill,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={[styles.metaPillText, { color: colors.textSecondary }]}
                >
                  {assignment.questionCount} preguntas
                </Text>
              </View>

              <View
                style={[
                  styles.metaPill,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.info}
                />
                <Text
                  style={[styles.metaPillText, { color: colors.textSecondary }]}
                >
                  {formatWindow(assignment.starts_at)} -{" "}
                  {formatWindow(assignment.ends_at)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.openButton,
                {
                  backgroundColor: colors.primary,
                },
              ]}
              activeOpacity={0.88}
              onPress={() => openAssignment(assignment)}
            >
              <Ionicons
                name="play-outline"
                size={16}
                color={colors.onPrimary}
              />
              <Text
                style={[styles.openButtonText, { color: colors.onPrimary }]}
              >
                Responder cuestionario
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {canViewAllSurveys ? (
          <View
            style={[
              styles.catalogSection,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.catalogHeaderRow}>
              <Ionicons name="albums-outline" size={16} color={colors.info} />
              <Text style={[styles.catalogTitle, { color: colors.text }]}>
                Catalogo global sin asignacion (
                {nonAssignedGlobalSurveys.length})
              </Text>
            </View>

            <Text style={[styles.catalogHint, { color: colors.textSecondary }]}>
              Estas encuestas se ven por permiso global. Para responderlas desde
              mobile deben estar asignadas a tu usuario. Total catalogo visible:{" "}
              {globalSurveys.length}.
            </Text>

            {nonAssignedGlobalSurveys.length === 0 ? (
              <Text
                style={[
                  styles.catalogEmptyText,
                  { color: colors.textSecondary },
                ]}
              >
                Todo el catalogo visible ya esta asignado en tu lista principal.
              </Text>
            ) : (
              nonAssignedGlobalSurveys.map((survey) => (
                <View
                  key={`global-${survey.id}`}
                  style={[
                    styles.catalogItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[styles.catalogItemTitle, { color: colors.text }]}
                  >
                    {survey.title}
                  </Text>
                  <Text
                    style={[
                      styles.catalogItemDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {survey.description || "Sin descripcion"}
                  </Text>
                  <View
                    style={[
                      styles.catalogBadge,
                      {
                        borderColor: colors.warning + "55",
                        backgroundColor: colors.warning + "18",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.catalogBadgeText,
                        { color: colors.warning },
                      ]}
                    >
                      Sin asignacion
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metricItem: {
    minWidth: "23%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  assignmentCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  assignmentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  assignmentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  temporalBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  temporalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  assignmentDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  openButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  openButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  catalogSection: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  catalogHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  catalogHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  catalogEmptyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  catalogItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  catalogItemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  catalogItemDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  catalogBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catalogBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
