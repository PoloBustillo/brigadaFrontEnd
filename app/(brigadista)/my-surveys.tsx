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
 */

import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MySurvey {
  id: number;
  title: string;
  description: string;
  encargadoName: string;
  myResponses: number;
  myTarget: number;
  totalResponses: number;
  totalTarget: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
  startDate?: string; // RULE 2: Survey starts from this date
  deadline?: string; // RULE 2: Survey ends at this date
}

// Time window status for surveys
type TimeWindowStatus = "upcoming" | "active" | "expired";

// Mock data - Includes all RULE 1 & RULE 2 scenarios
const mockMySurveys: MySurvey[] = [
  // ✅ ACTIVE + EDITABLE - Started, not expired
  {
    id: 1,
    title: "Encuesta de Satisfacción Ciudadana 2026",
    description:
      "Evaluar la satisfacción de los ciudadanos con los servicios públicos",
    encargadoName: "María González",
    myResponses: 12,
    myTarget: 20,
    totalResponses: 45,
    totalTarget: 100,
    status: "ACTIVE",
    assignedAt: "2026-02-01",
    startDate: "2026-02-05",
    deadline: "2026-03-15",
  },
  // 🔜 ACTIVE + UPCOMING - Not started yet
  {
    id: 2,
    title: "Censo de Vivienda Marzo",
    description: "Relevamiento integral de condiciones habitacionales",
    encargadoName: "María González",
    myResponses: 0,
    myTarget: 25,
    totalResponses: 0,
    totalTarget: 100,
    status: "ACTIVE",
    assignedAt: "2026-02-10",
    startDate: "2026-02-20",
    deadline: "2026-03-20",
  },
  // ⏰ ACTIVE + EXPIRED - Deadline passed
  {
    id: 3,
    title: "Encuesta Vencida de Enero",
    description: "Encuesta de prueba que ya venció - solo lectura",
    encargadoName: "María González",
    myResponses: 5,
    myTarget: 15,
    totalResponses: 20,
    totalTarget: 50,
    status: "ACTIVE",
    assignedAt: "2026-01-05",
    startDate: "2026-01-10",
    deadline: "2026-02-10",
  },
  // ✅ ACTIVE + EDITABLE - No deadline (always active)
  {
    id: 4,
    title: "Registro Continuo de Incidencias",
    description: "Encuesta sin fecha límite, siempre disponible",
    encargadoName: "María González",
    myResponses: 8,
    myTarget: 15,
    totalResponses: 30,
    totalTarget: 50,
    status: "ACTIVE",
    assignedAt: "2026-02-01",
    startDate: "2026-02-01",
    // No deadline - always active
  },
  // ⏸️ PAUSED - Should not show (Rule 1)
  {
    id: 5,
    title: "Encuesta Pausada",
    description: "Esta encuesta fue pausada temporalmente",
    encargadoName: "María González",
    myResponses: 3,
    myTarget: 10,
    totalResponses: 15,
    totalTarget: 40,
    status: "PAUSED",
    assignedAt: "2026-01-15",
    startDate: "2026-01-20",
    deadline: "2026-03-01",
  },
  // ✅ COMPLETED - Should not show (Rule 1)
  {
    id: 6,
    title: "Encuesta Completada",
    description: "Encuesta que ya fue completada por el equipo",
    encargadoName: "María González",
    myResponses: 20,
    myTarget: 20,
    totalResponses: 100,
    totalTarget: 100,
    status: "COMPLETED",
    assignedAt: "2026-01-01",
    startDate: "2026-01-05",
    deadline: "2026-02-05",
  },
  // 🔜 UPCOMING + Will expire soon after starting
  {
    id: 7,
    title: "Encuesta Express Próxima Semana",
    description: "Ventana corta de 3 días",
    encargadoName: "María González",
    myResponses: 0,
    myTarget: 10,
    totalResponses: 0,
    totalTarget: 30,
    status: "ACTIVE",
    assignedAt: "2026-02-12",
    startDate: "2026-02-18",
    deadline: "2026-02-21",
  },
];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Activa",
    color: "#06D6A0",
    icon: "play-circle" as const,
  },
  COMPLETED: {
    label: "Completada",
    color: "#00B4D8",
    icon: "checkmark-circle" as const,
  },
  PAUSED: {
    label: "Pausada",
    color: "#FF9F1C",
    icon: "pause-circle" as const,
  },
};

// RULE 2: Time window status configuration
const TIME_WINDOW_CONFIG = {
  upcoming: {
    label: "Próximamente",
    color: "#6366F1", // Indigo
    icon: "time-outline" as const,
    description: "Aún no inicia",
  },
  active: {
    label: "Disponible",
    color: "#06D6A0", // Green
    icon: "checkbox-outline" as const,
    description: "Puedes responder",
  },
  expired: {
    label: "Vencida",
    color: "#EF4444", // Red
    icon: "close-circle-outline" as const,
    description: "Solo lectura",
  },
};

export default function BrigadistaSurveysScreen() {
  const colors = useThemeColors();

  const [surveys, setSurveys] = useState<MySurvey[]>(mockMySurveys);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para controlar secciones expandidas/colapsadas
  const [expandedSections, setExpandedSections] = useState({
    active: true, // Disponibles - expandidas por defecto
    upcoming: false, // Próximamente - colapsadas por defecto
    expired: false, // Vencidas - colapsadas por defecto
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 🔒 RULE 2: Determine time window status
  const getTimeWindowStatus = (survey: MySurvey): TimeWindowStatus => {
    const now = new Date();

    // Check if survey has started
    if (survey.startDate) {
      const startDate = new Date(survey.startDate);
      if (startDate > now) {
        return "upcoming"; // Not started yet
      }
    }

    // Check if survey has expired
    if (survey.deadline) {
      const deadlineDate = new Date(survey.deadline);
      if (deadlineDate < now) {
        return "expired"; // Past deadline
      }
    }

    // Survey is active (started and not expired)
    return "active";
  };

  // 🔒 RULE 1 + RULE 2: Filter surveys - Only ACTIVE status, show all time windows
  const visibleSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      // Rule 1.1: Must be ACTIVE status
      if (survey.status !== "ACTIVE") return false;

      // Rule 1.3: Must be assigned by encargado (implicitly true in mockData)
      // In real implementation: survey.encargadoId === brigadista.encargadoId

      return true;
    });
  }, [surveys]);

  // Separate surveys by time window
  const surveysByTimeWindow = useMemo(() => {
    return {
      upcoming: visibleSurveys.filter(
        (s) => getTimeWindowStatus(s) === "upcoming",
      ),
      active: visibleSurveys.filter((s) => getTimeWindowStatus(s) === "active"),
      expired: visibleSurveys.filter(
        (s) => getTimeWindowStatus(s) === "expired",
      ),
    };
  }, [visibleSurveys]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch my assigned surveys from database
    // Filter by brigadista_id = user.id
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStartSurvey = (
    survey: MySurvey,
    timeWindow: TimeWindowStatus,
  ) => {
    const windowConfig = TIME_WINDOW_CONFIG[timeWindow];

    if (timeWindow === "upcoming") {
      // TODO: Show preview or notification
      console.log("Survey not started yet:", survey.id);
      return;
    }

    if (timeWindow === "expired") {
      // TODO: Navigate to read-only view
      console.log("Survey expired - read only:", survey.id);
      return;
    }

    // Active survey - navigate to edit/fill
    console.log("Start survey:", survey.id);
    // TODO: Navigate to survey filling screen
  };

  const calculateMyProgress = (responses: number, target: number) => {
    return Math.min((responses / target) * 100, 100);
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

  // Calculate totals only for active (editable) surveys
  const totalMyResponses = surveysByTimeWindow.active.reduce(
    (acc, s) => acc + s.myResponses,
    0,
  );
  const totalMyTarget = surveysByTimeWindow.active.reduce(
    (acc, s) => acc + s.myTarget,
    0,
  );

  // Empty state logic
  const getEmptyStateInfo = () => {
    if (surveys.length === 0) {
      return {
        icon: "document-outline" as const,
        title: "No tienes encuestas asignadas",
        subtitle: "Tu encargado te asignará encuestas próximamente",
        color: colors.textSecondary,
      };
    }

    const inactiveCount = surveys.filter((s) => s.status !== "ACTIVE").length;

    if (visibleSurveys.length === 0) {
      return {
        icon: "pause-circle-outline" as const,
        title: "No hay encuestas activas",
        subtitle: `${inactiveCount} encuesta(s) pausada(s) o completada(s)`,
        color: colors.info,
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
      };
    }

    return {
      icon: "document-outline" as const,
      title: "No hay encuestas disponibles",
      subtitle: "Las encuestas activas aparecerán aquí automáticamente",
      color: colors.textSecondary,
    };
  };

  const emptyStateInfo = getEmptyStateInfo();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.success + "15",
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Mi Progreso Total
              </Text>
              <Text
                style={[
                  styles.summarySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {surveysByTimeWindow.active.length} encuestas disponibles
              </Text>
            </View>
            <View
              style={[
                styles.summaryBadge,
                {
                  backgroundColor: colors.success + "20",
                  borderColor: colors.success,
                },
              ]}
            >
              <Text
                style={[styles.summaryBadgeText, { color: colors.success }]}
              >
                {totalMyResponses}/{totalMyTarget}
              </Text>
            </View>
          </View>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${calculateMyProgress(totalMyResponses, totalMyTarget)}%`,
                  backgroundColor: colors.success,
                },
              ]}
            />
          </View>
          <View style={styles.summaryFooterRow}>
            <Text style={[styles.summaryFooter, { color: colors.text }]}>
              {calculateMyProgress(totalMyResponses, totalMyTarget).toFixed(0)}%
              completado
            </Text>
            {surveysByTimeWindow.upcoming.length > 0 && (
              <Text style={[styles.summaryFooter, { color: colors.info }]}>
                {surveysByTimeWindow.upcoming.length} próxima(s)
              </Text>
            )}
          </View>
        </View>

        {/* Surveys List */}
        <View style={styles.section}>
          {visibleSurveys.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.surface, borderColor: colors.border },
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
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {emptyStateInfo.title}
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                {emptyStateInfo.subtitle}
              </Text>
              {surveys.length > 0 && (
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
                  <Text style={[styles.emptyHintText, { color: colors.info }]}>
                    Solo se muestran encuestas activas
                  </Text>
                </View>
              )}
            </View>
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
                          Disponibles para Responder
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
                        expandedSections.active ? "chevron-up" : "chevron-down"
                      }
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {expandedSections.active &&
                    surveysByTimeWindow.active.map((survey) => {
                      const timeWindow = getTimeWindowStatus(survey);
                      const windowConfig = TIME_WINDOW_CONFIG[timeWindow];
                      const statusConfig = STATUS_CONFIG[survey.status];
                      const myProgress = calculateMyProgress(
                        survey.myResponses,
                        survey.myTarget,
                      );
                      const daysLeft = getDaysUntilDeadline(survey.deadline);
                      const isCompleted = survey.myResponses >= survey.myTarget;

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
                              style={[styles.cardTitle, { color: colors.text }]}
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
                                color="#FFFFFF"
                              />
                              <Text style={styles.statusText}>
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
                                  color="#FFFFFF"
                                />
                                <Text style={styles.deadlineText}>
                                  {daysLeft > 0
                                    ? `${daysLeft} días`
                                    : daysLeft === 0
                                      ? "Hoy"
                                      : "Vencida"}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Encargado */}
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

                          {/* My Progress */}
                          <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                              <Text
                                style={[
                                  styles.progressText,
                                  { color: colors.text },
                                ]}
                              >
                                Mi progreso
                              </Text>
                              <Text
                                style={[
                                  styles.progressStats,
                                  {
                                    color: isCompleted
                                      ? colors.success
                                      : colors.textSecondary,
                                  },
                                ]}
                              >
                                {survey.myResponses} / {survey.myTarget}
                                {isCompleted && " ✓"}
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
                                    backgroundColor: isCompleted
                                      ? colors.success
                                      : colors.info,
                                  },
                                ]}
                              />
                            </View>
                          </View>

                          {/* Team Progress */}
                          <View
                            style={[
                              styles.teamProgressRow,
                              { borderTopColor: colors.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.teamProgressLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Progreso del equipo:
                            </Text>
                            <Text
                              style={[
                                styles.teamProgressValue,
                                { color: colors.text },
                              ]}
                            >
                              {survey.totalResponses} / {survey.totalTarget}
                            </Text>
                          </View>

                          {/* Action Button */}
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              {
                                backgroundColor: isCompleted
                                  ? colors.border
                                  : colors.success,
                              },
                            ]}
                            onPress={() =>
                              handleStartSurvey(survey, timeWindow)
                            }
                            activeOpacity={0.8}
                            disabled={isCompleted}
                          >
                            <Ionicons
                              name={
                                isCompleted ? "checkmark-circle" : "add-circle"
                              }
                              size={20}
                              color={
                                isCompleted ? colors.textSecondary : "#FFFFFF"
                              }
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                {
                                  color: isCompleted
                                    ? colors.textSecondary
                                    : "#FFFFFF",
                                },
                              ]}
                            >
                              {isCompleted
                                ? "Meta Completada"
                                : "Llenar Encuesta"}
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
                          {surveysByTimeWindow.upcoming.length} encuesta(s) por
                          comenzar
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
                          onPress={() => handleStartSurvey(survey, timeWindow)}
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
                              color="#FFFFFF"
                            />
                            <Text style={styles.timeWindowText}>
                              {windowConfig.label}
                            </Text>
                          </View>

                          {/* Header */}
                          <View style={styles.cardHeader}>
                            <Text
                              style={[styles.cardTitle, { color: colors.text }]}
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

                          {/* Encargado */}
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
                        expandedSections.expired ? "chevron-up" : "chevron-down"
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
                          onPress={() => handleStartSurvey(survey, timeWindow)}
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
                              color="#FFFFFF"
                            />
                            <Text style={styles.timeWindowText}>
                              {windowConfig.label}
                            </Text>
                          </View>

                          {/* Header */}
                          <View style={styles.cardHeader}>
                            <Text
                              style={[styles.cardTitle, { color: colors.text }]}
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
    color: "#FFFFFF",
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
