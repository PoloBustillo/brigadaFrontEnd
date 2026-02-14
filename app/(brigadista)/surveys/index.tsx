/**
 * Brigadista Surveys - Assigned Surveys (Alternative View)
 * Shows: Only surveys assigned to this brigadista
 * Note: This is a hidden route, main view is in my-surveys.tsx
 * Rule 1: Brigadista can only see surveys that:
 *   - Are ACTIVE
 *   - Are within deadline
 *   - Are assigned to their encargado
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AssignedSurvey {
  id: number;
  title: string;
  description: string;
  questionsCount: number;
  myResponses: number;
  myTarget: number;
  status: "ACTIVE" | "COMPLETED";
  dueDate?: string;
}

// Mock data
const mockAssignedSurveys: AssignedSurvey[] = [
  {
    id: 1,
    title: "Encuesta de Satisfacción Ciudadana 2024",
    description: "Evaluar la satisfacción con servicios públicos",
    questionsCount: 15,
    myResponses: 12,
    myTarget: 20,
    status: "ACTIVE",
    dueDate: "2024-03-01",
  },
  {
    id: 2,
    title: "Censo de Infraestructura Urbana",
    description: "Evaluación de infraestructura en la zona",
    questionsCount: 22,
    myResponses: 18,
    myTarget: 25,
    status: "ACTIVE",
    dueDate: "2024-03-15",
  },
];

export default function BrigadistaSurveys() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const [surveys, setSurveys] = useState<AssignedSurvey[]>(mockAssignedSurveys);
  const [refreshing, setRefreshing] = useState(false);

  // 🔒 RULE 1: Filter surveys - Only ACTIVE, within deadline
  const activeSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      // Rule 1.1: Must be ACTIVE
      if (survey.status !== "ACTIVE") return false;

      // Rule 1.2: Must be within deadline (if deadline exists)
      if (survey.dueDate) {
        const now = new Date();
        const deadlineDate = new Date(survey.dueDate);
        if (deadlineDate < now) return false;
      }

      return true;
    });
  }, [surveys]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch assigned surveys from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSurveyPress = (survey: AssignedSurvey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to survey detail
    console.log("Start survey:", survey.id);
  };

  const totalResponses = activeSurveys.reduce(
    (acc, s) => acc + s.myResponses,
    0,
  );
  const totalTarget = activeSurveys.reduce((acc, s) => acc + s.myTarget, 0);

  // Empty state logic
  const getEmptyStateInfo = () => {
    if (surveys.length === 0) {
      return {
        icon: "document-outline" as const,
        title: "No tienes encuestas asignadas",
        subtitle: "Las encuestas asignadas aparecerán aquí",
        color: colors.textSecondary,
      };
    }

    const expiredCount = surveys.filter((s) => {
      if (!s.dueDate) return false;
      return new Date(s.dueDate) < new Date();
    }).length;

    const inactiveCount = surveys.filter((s) => s.status !== "ACTIVE").length;

    if (expiredCount > 0 && inactiveCount === 0) {
      return {
        icon: "time-outline" as const,
        title: "Todas las encuestas han vencido",
        subtitle: `${expiredCount} encuesta(s) fuera de fecha`,
        color: colors.error,
      };
    }

    if (inactiveCount > 0 && expiredCount === 0) {
      return {
        icon: "pause-circle-outline" as const,
        title: "Las encuestas están completadas",
        subtitle: `${inactiveCount} encuesta(s) completada(s)`,
        color: colors.success,
      };
    }

    return {
      icon: "alert-circle-outline" as const,
      title: "No hay encuestas activas",
      subtitle:
        expiredCount > 0
          ? `${expiredCount} vencida(s) • ${inactiveCount} completada(s)`
          : "Las encuestas activas aparecerán aquí",
      color: colors.warning,
    };
  };

  const emptyStateInfo = getEmptyStateInfo();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPadding },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryHeader}>
            <Ionicons name="clipboard" size={28} color={colors.primary} />
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Mi Progreso
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {totalResponses}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Completadas
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {totalTarget}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Meta
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {activeSurveys.length}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Activas
              </Text>
            </View>
          </View>
        </View>

        {/* Surveys List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Encuestas Asignadas
        </Text>

        <View style={styles.listContainer}>
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
              const progress = (survey.myResponses / survey.myTarget) * 100;
              const isComplete = survey.myResponses >= survey.myTarget;

              return (
                <TouchableOpacity
                  key={survey.id}
                  style={[
                    styles.surveyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSurveyPress(survey)}
                  activeOpacity={0.7}
                >
                  {/* Status Badge */}
                  {isComplete && (
                    <View
                      style={[
                        styles.completeBadge,
                        { backgroundColor: colors.success + "20" },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.success}
                      />
                      <Text
                        style={[styles.completeText, { color: colors.success }]}
                      >
                        Meta Alcanzada
                      </Text>
                    </View>
                  )}

                  {/* Title */}
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

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="help-circle-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {survey.questionsCount} preguntas
                      </Text>
                    </View>
                    {survey.dueDate && (
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Vence: {new Date(survey.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[
                          styles.progressText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Mi progreso
                      </Text>
                      <Text
                        style={[
                          styles.progressValue,
                          {
                            color: isComplete ? colors.success : colors.primary,
                          },
                        ]}
                      >
                        {survey.myResponses}/{survey.myTarget}
                      </Text>
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
                            backgroundColor: isComplete
                              ? colors.success
                              : colors.primary,
                            width: `${Math.min(progress, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleSurveyPress(survey)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        isComplete ? "checkmark-done" : "add-circle-outline"
                      }
                      size={20}
                      color={colors.background}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: colors.background },
                      ]}
                    >
                      {isComplete ? "Ver Respuestas" : "Nueva Respuesta"}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
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
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryStatItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
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
    borderRadius: 12,
    borderWidth: 1,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  completeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
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
    fontSize: 13,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
