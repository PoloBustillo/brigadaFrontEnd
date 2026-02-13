/**
 * Brigadista Surveys - Assigned Surveys (Alternative View)
 * Shows: Only surveys assigned to this brigadista
 * Note: This is a hidden route, main view is in my-surveys.tsx
 * Access: Brigadistas only (Rule 11)
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  const router = useRouter();
  const [surveys, setSurveys] = useState<AssignedSurvey[]>(mockAssignedSurveys);
  const [refreshing, setRefreshing] = useState(false);

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

  const totalResponses = surveys.reduce((acc, s) => acc + s.myResponses, 0);
  const totalTarget = surveys.reduce((acc, s) => acc + s.myTarget, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <ScrollView
        contentContainerStyle={styles.content}
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
                {surveys.length}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Encuestas
              </Text>
            </View>
          </View>
        </View>

        {/* Surveys List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Encuestas Asignadas
        </Text>

        <View style={styles.listContainer}>
          {surveys.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No hay encuestas
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Las encuestas asignadas aparecerán aquí
              </Text>
            </View>
          ) : (
            surveys.map((survey) => {
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
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>
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
    color: "#FFFFFF",
  },
});
