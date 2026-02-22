/**
 * Brigadista My Surveys Screen
 * View and fill assigned surveys
 * Rule 1: Brigadista can only see surveys that:
 *   - Are ACTIVE
 *   - Are within deadline
 *   - Are assigned to their encargado
 * Rule 2: Time window states:
 *   - Not started → "Próximamente" (read-only preview)
 *   - Active (started + not expired) → Editable
 *   - Expired → Read-only
 * Rule 3: Response status:
 *   - draft: Local draft, can edit
 *   - completed: Ready to send, can edit before syncing
 *   - synced: Already sent, read-only
 *   - rejected: Requires correction, can edit if supervisor allows
 */

import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  RESPONSE_STATUS_CONFIG,
  STATUS_CONFIG,
  TIME_WINDOW_CONFIG,
  useMysurveys,
} from "@/hooks/use-my-surveys";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaSurveysScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const { isOnline, pendingItems, isSyncing } = useSync();

  const {
    surveys,
    refreshing,
    isLoading,
    fetchError,
    expandedSections,
    surveysByTimeWindow,
    visibleSurveys,
    onRefresh,
    retryLoad,
    toggleSection,
    getTimeWindowStatus,
    canEditResponse,
    handleStartSurvey,
  } = useMysurveys();

  const calculateMyProgress = (responses: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min(responses / target, 1);
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilStart = (startDate?: string) => {
    if (!startDate) return null;
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Empty state logic
  const getEmptyStateInfo = () => {
    if (fetchError && surveys.length === 0) {
      return {
        icon: "cloud-offline-outline" as const,
        title: "Sin conexión",
        subtitle: "No se pudieron cargar las encuestas. Toca para reintentar.",
        color: colors.error,
        isError: true,
      };
    }

    if (surveys.length === 0) {
      return {
        icon: "document-outline" as const,
        title: "No tienes encuestas asignadas",
        subtitle: "Tu encargado te asignará encuestas próximamente",
        color: colors.textSecondary,
        isError: false,
      };
    }

    const inactiveCount = surveys.filter((s) => s.status !== "ACTIVE").length;

    if (visibleSurveys.length === 0) {
      return {
        icon: "pause-circle-outline" as const,
        title: "No hay encuestas activas",
        subtitle: `${inactiveCount} encuesta(s) pausada(s) o completada(s)`,
        color: colors.info,
        isError: false,
      };
    }

    // If we have visible surveys, show appropriate message
    const { upcoming, active, expired } = surveysByTimeWindow;

    if (active.length === 0 && upcoming.length === 0 && expired.length === 0) {
      return {
        icon: "alert-circle-outline" as const,
        title: "No hay encuestas disponibles",
        subtitle: "Las encuestas aparecerán aquí cuando sean asignadas",
        color: colors.warning,
        isError: false,
      };
    }

    return {
      icon: "document-outline" as const,
      title: "No hay encuestas disponibles",
      subtitle: "Las encuestas activas aparecerán aquí automáticamente",
      color: colors.textSecondary,
      isError: false,
    };
  };

  const emptyStateInfo = getEmptyStateInfo();

  const unifiedStatus = (() => {
    if (!isLoading && fetchError && surveys.length > 0) {
      return {
        type: "error" as const,
        icon: "cloud-offline-outline" as const,
        text: "No se pudo cargar. Toca para reintentar.",
        action: retryLoad,
        bg: colors.error + "15",
        border: colors.error,
        fg: colors.error,
      };
    }
    if (!isOnline) {
      return {
        type: "offline" as const,
        icon: "cloud-offline-outline" as const,
        text:
          pendingItems.length > 0
            ? `Sin conexión — ${pendingItems.length} pendiente(s)`
            : "Sin conexión",
        action: undefined,
        bg: (colors.warning ?? "#f59e0b") + "18",
        border: (colors.warning ?? "#f59e0b") + "40",
        fg: colors.warning ?? "#f59e0b",
      };
    }
    if (isSyncing) {
      return {
        type: "sync" as const,
        icon: "sync-outline" as const,
        text: "Sincronizando respuestas…",
        action: undefined,
        bg: colors.primary + "18",
        border: colors.primary + "40",
        fg: colors.primary,
      };
    }
    return null;
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      {/* Unified status bar (offline/sync/error) */}
      {unifiedStatus && (
        <TouchableOpacity
          disabled={!unifiedStatus.action}
          onPress={unifiedStatus.action}
          activeOpacity={unifiedStatus.action ? 0.8 : 1}
          style={[
            styles.statusBar,
            {
              backgroundColor: unifiedStatus.bg,
              borderColor: unifiedStatus.border,
            },
          ]}
        >
          {unifiedStatus.type === "sync" ? (
            <ActivityIndicator size="small" color={unifiedStatus.fg} />
          ) : (
            <Ionicons
              name={unifiedStatus.icon}
              size={16}
              color={unifiedStatus.fg}
            />
          )}
          <Text style={[styles.statusBarText, { color: unifiedStatus.fg }]}>
            {unifiedStatus.text}
          </Text>
          {unifiedStatus.action && (
            <Ionicons
              name="refresh-outline"
              size={16}
              color={unifiedStatus.fg}
            />
          )}
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
            { paddingBottom: contentPadding },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Surveys List */}
          <View style={styles.section}>
            {visibleSurveys.length === 0 ? (
              <TouchableOpacity
                disabled={!emptyStateInfo.isError}
                onPress={emptyStateInfo.isError ? retryLoad : undefined}
                activeOpacity={emptyStateInfo.isError ? 0.7 : 1}
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: colors.surface,
                    borderColor: emptyStateInfo.isError
                      ? colors.error + "50"
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconContainer,
                    { backgroundColor: emptyStateInfo.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={emptyStateInfo.icon}
                    size={48}
                    color={emptyStateInfo.color}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: emptyStateInfo.isError
                        ? colors.error
                        : colors.text,
                    },
                  ]}
                >
                  {emptyStateInfo.title}
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  {emptyStateInfo.subtitle}
                </Text>
                {!emptyStateInfo.isError && surveys.length > 0 && (
                  <View
                    style={[
                      styles.emptyHint,
                      { backgroundColor: colors.info + "15" },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={colors.info}
                    />
                    <Text
                      style={[styles.emptyHintText, { color: colors.info }]}
                    >
                      Solo se muestran encuestas activas
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <>
                {/* 1️⃣ Active Surveys Section - Expandida por defecto */}
                {surveysByTimeWindow.active.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.sectionHeader,
                        {
                          backgroundColor: colors.success + "15",
                          borderColor: colors.success + "30",
                        },
                      ]}
                      onPress={() => toggleSection("active")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons
                          name="checkbox-outline"
                          size={24}
                          color={colors.success}
                        />
                        <View>
                          <Text
                            style={[
                              styles.sectionTitle,
                              { color: colors.text, marginBottom: 2 },
                            ]}
                          >
                            Disponibles
                          </Text>
                          <Text
                            style={[
                              styles.sectionSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {surveysByTimeWindow.active.length} encuesta(s)
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={
                          expandedSections.active
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {expandedSections.active &&
                      surveysByTimeWindow.active.map((survey) => {
                        const timeWindow = getTimeWindowStatus(survey);
                        const windowConfig = TIME_WINDOW_CONFIG[timeWindow];
                        const statusConfig =
                          STATUS_CONFIG[survey.status] ?? STATUS_CONFIG.ACTIVE;
                        const daysLeft = getDaysUntilDeadline(survey.deadline);

                        return (
                          <View
                            key={survey.id}
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
                              <Text
                                style={[
                                  styles.cardTitle,
                                  { color: colors.text },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.title}
                              </Text>
                              <Text
                                style={[
                                  styles.cardDescription,
                                  { color: colors.textSecondary },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.description}
                              </Text>
                            </View>

                            {/* Badges */}
                            <View style={styles.badgesRow}>
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
                              {daysLeft !== null && (
                                <View
                                  style={[
                                    styles.deadlineBadge,
                                    {
                                      backgroundColor:
                                        daysLeft < 7
                                          ? colors.error
                                          : colors.warning,
                                    },
                                  ]}
                                >
                                  <Ionicons
                                    name="time-outline"
                                    size={14}
                                    color={colors.background}
                                  />
                                  <Text
                                    style={[
                                      styles.deadlineText,
                                      { color: colors.background },
                                    ]}
                                  >
                                    {daysLeft > 0
                                      ? `${daysLeft} días`
                                      : daysLeft === 0
                                        ? "Hoy"
                                        : "Vencida"}
                                  </Text>
                                </View>
                              )}
                              {/* RULE 3: Response Status Badge */}
                              {survey.responseStatus &&
                                RESPONSE_STATUS_CONFIG[
                                  survey.responseStatus
                                ] && (
                                  <View
                                    style={[
                                      styles.responseStatusBadge,
                                      {
                                        backgroundColor:
                                          RESPONSE_STATUS_CONFIG[
                                            survey.responseStatus
                                          ]!.color,
                                      },
                                    ]}
                                  >
                                    <Ionicons
                                      name={
                                        RESPONSE_STATUS_CONFIG[
                                          survey.responseStatus
                                        ]!.icon
                                      }
                                      size={14}
                                      color={colors.background}
                                    />
                                    <Text
                                      style={[
                                        styles.responseStatusText,
                                        { color: colors.background },
                                      ]}
                                    >
                                      {
                                        RESPONSE_STATUS_CONFIG[
                                          survey.responseStatus
                                        ]!.label
                                      }
                                    </Text>
                                  </View>
                                )}
                            </View>

                            {/* Encargado — only show when name available */}
                            {!!survey.encargadoName && (
                              <View style={styles.infoRow}>
                                <Ionicons
                                  name="person-outline"
                                  size={16}
                                  color={colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.infoText,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  Encargado: {survey.encargadoName}
                                </Text>
                              </View>
                            )}

                            {/* Action Button */}
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                {
                                  backgroundColor: (() => {
                                    // RULE 3: Button color based on response status
                                    if (survey.responseStatus === "synced")
                                      return colors.info;
                                    if (
                                      survey.responseStatus === "rejected" &&
                                      !survey.allowRejectedEdit
                                    )
                                      return colors.border;
                                    if (
                                      survey.responseStatus === "rejected" &&
                                      survey.allowRejectedEdit
                                    )
                                      return colors.warning;
                                    return colors.success;
                                  })(),
                                },
                              ]}
                              onPress={() =>
                                handleStartSurvey(survey, timeWindow)
                              }
                              activeOpacity={0.8}
                              disabled={
                                survey.responseStatus === "synced" ||
                                (survey.responseStatus === "rejected" &&
                                  !survey.allowRejectedEdit)
                              }
                            >
                              <Ionicons
                                name={(() => {
                                  // RULE 3: Icon based on response status
                                  if (survey.responseStatus === "synced")
                                    return "eye-outline";
                                  if (
                                    survey.responseStatus === "rejected" &&
                                    !survey.allowRejectedEdit
                                  )
                                    return "lock-closed-outline";
                                  if (
                                    survey.responseStatus === "rejected" &&
                                    survey.allowRejectedEdit
                                  )
                                    return "hammer-outline";
                                  if (survey.responseStatus === "draft")
                                    return "create-outline";
                                  if (survey.responseStatus === "completed")
                                    return "checkmark-circle-outline";
                                  return "add-circle";
                                })()}
                                size={20}
                                color={colors.background}
                              />
                              <Text
                                style={[
                                  styles.actionButtonText,
                                  { color: colors.background },
                                ]}
                              >
                                {(() => {
                                  // RULE 3: Button text based on response status
                                  if (survey.responseStatus === "synced")
                                    return "Ver Respuesta";
                                  if (
                                    survey.responseStatus === "rejected" &&
                                    !survey.allowRejectedEdit
                                  )
                                    return "Esperando Aprobación";
                                  if (
                                    survey.responseStatus === "rejected" &&
                                    survey.allowRejectedEdit
                                  )
                                    return "Corregir Respuesta";
                                  if (survey.responseStatus === "draft")
                                    return "Continuar Borrador";
                                  if (survey.responseStatus === "completed")
                                    return "Editar Respuesta";
                                  return "Llenar Encuesta";
                                })()}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                  </>
                )}

                {/* 2️⃣ Upcoming Surveys Section - Colapsada por defecto */}
                {surveysByTimeWindow.upcoming.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.sectionHeader,
                        {
                          backgroundColor: colors.info + "15",
                          borderColor: colors.info + "30",
                        },
                      ]}
                      onPress={() => toggleSection("upcoming")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons
                          name="calendar-outline"
                          size={24}
                          color={colors.info}
                        />
                        <View>
                          <Text
                            style={[
                              styles.sectionTitle,
                              { color: colors.text, marginBottom: 2 },
                            ]}
                          >
                            Próximamente
                          </Text>
                          <Text
                            style={[
                              styles.sectionSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {surveysByTimeWindow.upcoming.length} encuesta(s)
                            por comenzar
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={
                          expandedSections.upcoming
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {expandedSections.upcoming &&
                      surveysByTimeWindow.upcoming.map((survey) => {
                        const timeWindow = getTimeWindowStatus(survey);
                        const windowConfig = TIME_WINDOW_CONFIG[timeWindow];
                        const daysUntilStart = getDaysUntilStart(
                          survey.startDate,
                        );

                        return (
                          <TouchableOpacity
                            key={survey.id}
                            style={[
                              styles.surveyCard,
                              {
                                backgroundColor: colors.surface,
                                borderColor: windowConfig.color + "50",
                                borderWidth: 2,
                              },
                            ]}
                            onPress={() =>
                              handleStartSurvey(survey, timeWindow)
                            }
                            activeOpacity={0.8}
                          >
                            {/* Time Window Badge */}
                            <View
                              style={[
                                styles.timeWindowBadge,
                                { backgroundColor: windowConfig.color },
                              ]}
                            >
                              <Ionicons
                                name={windowConfig.icon}
                                size={14}
                                color={colors.background}
                              />
                              <Text
                                style={[
                                  styles.timeWindowText,
                                  { color: colors.background },
                                ]}
                              >
                                {windowConfig.label}
                              </Text>
                            </View>

                            {/* Header */}
                            <View style={styles.cardHeader}>
                              <Text
                                style={[
                                  styles.cardTitle,
                                  { color: colors.text },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.title}
                              </Text>
                              <Text
                                style={[
                                  styles.cardDescription,
                                  { color: colors.textSecondary },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.description}
                              </Text>
                            </View>

                            {/* Start Date Info */}
                            <View style={styles.infoRow}>
                              <Ionicons
                                name="calendar-outline"
                                size={16}
                                color={windowConfig.color}
                              />
                              <Text
                                style={[
                                  styles.infoText,
                                  {
                                    color: windowConfig.color,
                                    fontWeight: "600",
                                  },
                                ]}
                              >
                                Inicia{" "}
                                {daysUntilStart !== null
                                  ? daysUntilStart === 0
                                    ? "hoy"
                                    : daysUntilStart === 1
                                      ? "mañana"
                                      : `en ${daysUntilStart} días`
                                  : "pronto"}
                              </Text>
                            </View>

                            {/* Encargado — only show when name available */}
                            {!!survey.encargadoName && (
                              <View style={styles.infoRow}>
                                <Ionicons
                                  name="person-outline"
                                  size={16}
                                  color={colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.infoText,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  Encargado: {survey.encargadoName}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                  </>
                )}

                {/* 3️⃣ Expired Surveys Section - Colapsada por defecto */}
                {surveysByTimeWindow.expired.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.sectionHeader,
                        {
                          backgroundColor: colors.error + "15",
                          borderColor: colors.error + "30",
                        },
                      ]}
                      onPress={() => toggleSection("expired")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sectionHeaderLeft}>
                        <Ionicons
                          name="time-outline"
                          size={24}
                          color={colors.error}
                        />
                        <View>
                          <Text
                            style={[
                              styles.sectionTitle,
                              { color: colors.text, marginBottom: 2 },
                            ]}
                          >
                            Vencidas (Solo Lectura)
                          </Text>
                          <Text
                            style={[
                              styles.sectionSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {surveysByTimeWindow.expired.length} encuesta(s)
                            finalizadas
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={
                          expandedSections.expired
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {expandedSections.expired &&
                      surveysByTimeWindow.expired.map((survey) => {
                        const timeWindow = getTimeWindowStatus(survey);
                        const windowConfig = TIME_WINDOW_CONFIG[timeWindow];
                        const myProgress = calculateMyProgress(
                          survey.myResponses,
                          survey.myTarget,
                        );

                        return (
                          <TouchableOpacity
                            key={survey.id}
                            style={[
                              styles.surveyCard,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                opacity: 0.8,
                              },
                            ]}
                            onPress={() =>
                              handleStartSurvey(survey, timeWindow)
                            }
                            activeOpacity={0.7}
                          >
                            {/* Expired Badge */}
                            <View
                              style={[
                                styles.timeWindowBadge,
                                { backgroundColor: windowConfig.color },
                              ]}
                            >
                              <Ionicons
                                name={windowConfig.icon}
                                size={14}
                                color={colors.background}
                              />
                              <Text
                                style={[
                                  styles.timeWindowText,
                                  { color: colors.background },
                                ]}
                              >
                                {windowConfig.label}
                              </Text>
                            </View>

                            {/* Header */}
                            <View style={styles.cardHeader}>
                              <Text
                                style={[
                                  styles.cardTitle,
                                  { color: colors.text },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.title}
                              </Text>
                              <Text
                                style={[
                                  styles.cardDescription,
                                  { color: colors.textSecondary },
                                ]}
                                numberOfLines={2}
                              >
                                {survey.description}
                              </Text>
                            </View>

                            {/* My Progress */}
                            <View style={styles.progressContainer}>
                              <View style={styles.progressHeader}>
                                <Text
                                  style={[
                                    styles.progressText,
                                    { color: colors.text },
                                  ]}
                                >
                                  Tu progreso final
                                </Text>
                                <Text
                                  style={[
                                    styles.progressStats,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {survey.myResponses} / {survey.myTarget}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.progressBar,
                                  { backgroundColor: colors.surfaceVariant },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${myProgress}%`,
                                      backgroundColor: colors.textSecondary,
                                    },
                                  ]}
                                />
                              </View>
                            </View>

                            {/* View Only Button */}
                            <TouchableOpacity
                              style={[
                                styles.actionButton,
                                { backgroundColor: colors.border },
                              ]}
                              onPress={() =>
                                handleStartSurvey(survey, timeWindow)
                              }
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="eye-outline"
                                size={20}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.actionButtonText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                Ver Respuestas
                              </Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                  </>
                )}
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBarText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryBadgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  summaryFooter: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 0,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  surveyCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  timeWindowBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  timeWindowText: {
    fontSize: 12,
    fontWeight: "600",
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
  },
  responseStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  responseStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  infoText: {
    ...typography.bodySmall,
  },
  progressContainer: {
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
    fontWeight: "600",
  },
  teamProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  teamProgressLabel: {
    ...typography.bodySmall,
  },
  teamProgressValue: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
