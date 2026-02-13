/**
 * Brigadista My Surveys Screen
 * View and fill assigned surveys
 * Rule 11: Brigadista can only see their assigned surveys
 */

import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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

  const totalMyResponses = surveys.reduce((acc, s) => acc + s.myResponses, 0);
  const totalMyTarget = surveys.reduce((acc, s) => acc + s.myTarget, 0);

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
              <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                {surveys.length} encuestas asignadas
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
              <Text style={[styles.summaryBadgeText, { color: colors.success }]}>
                {totalMyResponses}/{totalMyTarget}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.border },
            ]}
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

          {surveys.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tienes encuestas asignadas
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Tu encargado te asignará encuestas próximamente
              </Text>
            </View>
          ) : (
            surveys.map((survey) => {
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
                      style={[styles.cardDescription, { color: colors.textSecondary }]}
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
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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
                          { color: isCompleted ? colors.success : colors.textSecondary },
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
                  <View style={[styles.teamProgressRow, { borderTopColor: colors.border }]}>
                    <Text
                      style={[styles.teamProgressLabel, { color: colors.textSecondary }]}
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
                        { color: isCompleted ? colors.textSecondary : "#FFFFFF" },
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
