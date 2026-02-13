/**
 * Encargado Surveys - Assigned Surveys
 * Shows: Only surveys assigned to this encargado
 * Access: Encargados only (Rule 9)
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

interface MySurvey {
  id: number;
  title: string;
  category: string;
  questionsCount: number;
  myTeamResponses: number;
  targetCount: number;
  brigadistasAssigned: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
  deadline?: string;
}

// Mock data
const mockMySurveys: MySurvey[] = [
  {
    id: 1,
    title: "Encuesta de Satisfacción Ciudadana 2024",
    category: "Servicios Públicos",
    questionsCount: 15,
    myTeamResponses: 45,
    targetCount: 100,
    brigadistasAssigned: 5,
    status: "ACTIVE",
    assignedAt: "2024-02-01",
    deadline: "2024-03-01",
  },
  {
    id: 2,
    title: "Censo de Infraestructura Urbana",
    category: "Infraestructura",
    questionsCount: 22,
    myTeamResponses: 80,
    targetCount: 80,
    brigadistasAssigned: 4,
    status: "COMPLETED",
    assignedAt: "2024-01-15",
    deadline: "2024-02-15",
  },
  {
    id: 3,
    title: "Evaluación de Programas Sociales",
    category: "Programas Sociales",
    questionsCount: 18,
    myTeamResponses: 32,
    targetCount: 60,
    brigadistasAssigned: 3,
    status: "ACTIVE",
    assignedAt: "2024-02-05",
    deadline: "2024-03-10",
  },
];

export default function EncargadoSurveys() {
  const colors = useThemeColors();
  const router = useRouter();
  const [surveys, setSurveys] = useState<MySurvey[]>(mockMySurveys);
  const [refreshing, setRefreshing] = useState(false);

  const statusConfig = {
    ACTIVE: {
      label: "Activa",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    COMPLETED: {
      label: "Completada",
      color: colors.info,
      icon: "checkmark-done-circle" as const,
    },
    PAUSED: {
      label: "Pausada",
      color: colors.warning,
      icon: "pause-circle" as const,
    },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch my surveys from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSurveyPress = (survey: MySurvey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to survey detail
    console.log("View survey:", survey.id);
  };

  const totalResponses = surveys.reduce((acc, s) => acc + s.myTeamResponses, 0);
  const activeSurveys = surveys.filter((s) => s.status === "ACTIVE").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />

      <ScrollView
        contentContainerStyle={styles.content}
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
              const config = statusConfig[survey.status];
              const progress =
                (survey.myTeamResponses / survey.targetCount) * 100;
              const isComplete = survey.myTeamResponses >= survey.targetCount;

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
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                      <Text
                        style={[styles.cardTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {survey.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardCategory,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {survey.category}
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
                        {survey.brigadistasAssigned} brigadistas
                      </Text>
                    </View>
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
                        Progreso del equipo
                      </Text>
                      <Text
                        style={[
                          styles.progressValue,
                          {
                            color: isComplete ? colors.success : colors.primary,
                          },
                        ]}
                      >
                        {survey.myTeamResponses}/{survey.targetCount}
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

                  {/* Footer */}
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <View style={styles.footerInfo}>
                      {survey.deadline && (
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
                            Vence:{" "}
                            {new Date(survey.deadline).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
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
