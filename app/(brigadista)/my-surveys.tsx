/**
 * Brigadista My Surveys Screen
 * View and fill assigned surveys
 * Rule 1: Brigadista can only see surveys that:
 *   - Are ACTIVE
 *   - Are within deadline
 *   - Are assigned to their encargado
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
  deadline?: string;
}

// Mock data
const mockMySurveys: MySurvey[] = [
  {
    id: 1,
    title: "Encuesta de Satisfacción Ciudadana 2024",
    description:
      "Evaluar la satisfacción de los ciudadanos con los servicios públicos",
    encargadoName: "María González",
    myResponses: 12,
    myTarget: 20,
    totalResponses: 45,
    totalTarget: 100,
    status: "ACTIVE",
    assignedAt: "2024-02-01",
    deadline: "2024-03-01",
  },
  {
    id: 2,
    title: "Censo de Infraestructura",
    description: "Relevamiento del estado de infraestructura urbana",
    encargadoName: "María González",
    myResponses: 8,
    myTarget: 15,
    totalResponses: 30,
    totalTarget: 50,
    status: "ACTIVE",
    assignedAt: "2024-01-20",
    deadline: "2024-02-28",
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

export default function BrigadistaSurveysScreen() {
  const colors = useThemeColors();

  const [surveys, setSurveys] = useState<MySurvey[]>(mockMySurveys);
  const [refreshing, setRefreshing] = useState(false);

  // 🔒 RULE 1: Filter surveys - Only ACTIVE, within deadline, assigned to encargado
  const activeSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      // Rule 1.1: Must be ACTIVE
      if (survey.status !== "ACTIVE") return false;

      // Rule 1.2: Must be within deadline (if deadline exists)
      if (survey.deadline) {
        const now = new Date();
        const deadlineDate = new Date(survey.deadline);
        if (deadlineDate < now) return false;
      }

      // Rule 1.3: Must be assigned by encargado (implicitly true in mockData)
      // In real implementation: survey.encargadoId === brigadista.encargadoId

      return true;
    });
  }, [surveys]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch my assigned surveys from database
    // Filter by brigadista_id = user.id
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStartSurvey = (survey: MySurvey) => {
    // TODO: Navigate to survey filling screen
    console.log("Start survey:", survey.id);
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

  const totalMyResponses = activeSurveys.reduce(
    (acc, s) => acc + s.myResponses,
    0,
  );
  const totalMyTarget = activeSurveys.reduce((acc, s) => acc + s.myTarget, 0);

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

    const expiredCount = surveys.filter((s) => {
      if (!s.deadline) return false;
      return new Date(s.deadline) < new Date();
    }).length;

    const inactiveCount = surveys.filter((s) => s.status !== "ACTIVE").length;

    if (expiredCount > 0 && inactiveCount > 0) {
      return {
        icon: "alert-circle-outline" as const,
        title: "No hay encuestas activas disponibles",
        subtitle: `${expiredCount} encuesta(s) vencida(s) • ${inactiveCount} pausada(s) o completada(s)`,
        color: colors.warning,
      };
    }

    if (expiredCount > 0) {
      return {
        icon: "time-outline" as const,
        title: "Todas las encuestas han vencido",
        subtitle: `${expiredCount} encuesta(s) fuera de fecha. Consulta con tu encargado.`,
        color: colors.error,
      };
    }

    if (inactiveCount > 0) {
      return {
        icon: "pause-circle-outline" as const,
        title: "Las encuestas no están activas",
        subtitle: `${inactiveCount} encuesta(s) pausada(s) o completada(s)`,
        color: colors.info,
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
                {activeSurveys.length} encuestas activas
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
          <Text style={[styles.summaryFooter, { color: colors.text }]}>
            {calculateMyProgress(totalMyResponses, totalMyTarget).toFixed(0)}%
            completado
          </Text>
        </View>

        {/* Surveys List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Encuestas Activas
          </Text>

          {activeSurveys.length === 0 ? (
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
                    Solo se muestran encuestas activas y dentro de fecha
                  </Text>
                </View>
              )}
            </View>
          ) : (
            activeSurveys.map((survey) => {
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
                              daysLeft < 7 ? colors.error : colors.warning,
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
                      style={[styles.infoText, { color: colors.textSecondary }]}
                    >
                      Encargado: {survey.encargadoName}
                    </Text>
                  </View>

                  {/* My Progress */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[styles.progressText, { color: colors.text }]}
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
                      style={[styles.teamProgressValue, { color: colors.text }]}
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
                    onPress={() => handleStartSurvey(survey)}
                    activeOpacity={0.8}
                    disabled={isCompleted}
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "add-circle"}
                      size={20}
                      color={isCompleted ? colors.textSecondary : "#FFFFFF"}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        {
                          color: isCompleted ? colors.textSecondary : "#FFFFFF",
                        },
                      ]}
                    >
                      {isCompleted ? "Meta Completada" : "Llenar Encuesta"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
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
    textAlign: "right",
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
