/**
 * Encargado Assignments Screen
 * View assigned surveys and team management
 * Rule 9-10: Encargado can only see their assignments
 */

import { UserHeader } from "@/components/shared";
import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

interface MyAssignment {
  id: number;
  surveyTitle: string;
  surveyDescription: string;
  brigadistasAssigned: number;
  responsesCount: number;
  targetCount: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
  deadline?: string;
}

// Mock data
const mockMyAssignments: MyAssignment[] = [
  {
    id: 1,
    surveyTitle: "Encuesta de Satisfacción Ciudadana 2024",
    surveyDescription:
      "Evaluar la satisfacción de los ciudadanos con los servicios públicos",
    brigadistasAssigned: 5,
    responsesCount: 45,
    targetCount: 100,
    status: "ACTIVE",
    assignedAt: "2024-02-01",
    deadline: "2024-03-01",
  },
  {
    id: 2,
    surveyTitle: "Censo de Infraestructura",
    surveyDescription: "Relevamiento del estado de infraestructura urbana",
    brigadistasAssigned: 3,
    responsesCount: 30,
    targetCount: 50,
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

export default function EncargadoAssignmentsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [assignments, setAssignments] =
    useState<MyAssignment[]>(mockMyAssignments);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch my assignments from database
    // Filter by encargado_id = user.id
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleViewAssignment = (assignment: MyAssignment) => {
    // TODO: Navigate to assignment detail and team management
    console.log("View assignment:", assignment.id);
  };

  const calculateProgress = (responses: number, target: number) => {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <UserHeader title="Mis Asignaciones" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#00B4D8" }]}>
            <Ionicons name="document-text-outline" size={32} color="#FFFFFF" />
            <Text style={styles.summaryValue}>{assignments.length}</Text>
            <Text style={styles.summaryLabel}>Encuestas Asignadas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#06D6A0" }]}>
            <Ionicons name="people-outline" size={32} color="#FFFFFF" />
            <Text style={styles.summaryValue}>
              {assignments.reduce((acc, a) => acc + a.brigadistasAssigned, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Mi Equipo</Text>
          </View>
        </View>

        {/* Assignments List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Encuestas Activas
          </Text>

          {assignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No tienes asignaciones
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                El administrador te asignará encuestas próximamente
              </Text>
            </View>
          ) : (
            assignments.map((assignment) => {
              const statusConfig = STATUS_CONFIG[assignment.status];
              const progress = calculateProgress(
                assignment.responsesCount,
                assignment.targetCount,
              );
              const daysLeft = getDaysUntilDeadline(assignment.deadline);

              return (
                <TouchableOpacity
                  key={assignment.id}
                  style={[
                    styles.assignmentCard,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                  onPress={() => handleViewAssignment(assignment)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {assignment.surveyTitle}
                    </Text>
                    <Text
                      style={[styles.cardDescription, { color: colors.icon }]}
                      numberOfLines={2}
                    >
                      {assignment.surveyDescription}
                    </Text>
                  </View>

                  {/* Status and Deadline */}
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
                              daysLeft < 7 ? "#FF6B6B" : "#FFB84D",
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

                  {/* Team Info */}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={colors.icon}
                    />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {assignment.brigadistasAssigned} brigadistas asignados
                    </Text>
                  </View>

                  {/* Progress */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[styles.progressText, { color: colors.text }]}
                      >
                        Progreso del equipo
                      </Text>
                      <Text
                        style={[styles.progressStats, { color: colors.icon }]}
                      >
                        {assignment.responsesCount} / {assignment.targetCount}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: "#E5E7EB" },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: statusConfig.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.progressPercentage,
                        { color: colors.icon },
                      ]}
                    >
                      {progress.toFixed(0)}% completado
                    </Text>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="people" size={20} color="#00B4D8" />
                      <Text style={styles.actionText}>Ver Equipo</Text>
                    </TouchableOpacity>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.icon}
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
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
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
  assignmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    ...typography.body,
  },
  progressContainer: {
    marginTop: 12,
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
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercentage: {
    ...typography.bodySmall,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00B4D8",
  },
});
