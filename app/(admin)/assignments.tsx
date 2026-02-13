/**
 * Admin Assignments Screen
 * Manage survey assignments to teams and users
 * Rules 9-11: Assignment permissions by role
 */

import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
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

interface Assignment {
  id: number;
  surveyTitle: string;
  teamName: string;
  encargadoName: string;
  brigadistasCount: number;
  responsesCount: number;
  targetCount: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
}

// Mock data
const mockAssignments: Assignment[] = [
  {
    id: 1,
    surveyTitle: "Encuesta de Satisfacción Ciudadana 2024",
    teamName: "Equipo Norte",
    encargadoName: "María González",
    brigadistasCount: 5,
    responsesCount: 45,
    targetCount: 100,
    status: "ACTIVE",
    assignedAt: "2024-02-01",
  },
  {
    id: 2,
    surveyTitle: "Censo de Infraestructura",
    teamName: "Equipo Sur",
    encargadoName: "Juan Pérez",
    brigadistasCount: 3,
    responsesCount: 80,
    targetCount: 80,
    status: "COMPLETED",
    assignedAt: "2024-01-15",
  },
];

const getStatusConfig = (colors: ReturnType<typeof useThemeColors>) => ({
  ACTIVE: {
    label: "Activa",
    color: colors.success,
    icon: "play-circle" as const,
  },
  COMPLETED: {
    label: "Completada",
    color: colors.info,
    icon: "checkmark-circle" as const,
  },
  PAUSED: {
    label: "Pausada",
    color: colors.warning,
    icon: "pause-circle" as const,
  },
});

export default function AdminAssignmentsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const STATUS_CONFIG = getStatusConfig(colors);

  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch assignments from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCreateAssignment = () => {
    // TODO: Navigate to create assignment screen
    console.log("Create new assignment");
  };

  const handleViewAssignment = (assignment: Assignment) => {
    // TODO: Navigate to assignment detail screen
    console.log("View assignment:", assignment.id);
  };

  const calculateProgress = (responses: number, target: number) => {
    return Math.min((responses / target) * 100, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Asignaciones" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.success }]}
          >
            <Text style={styles.summaryValue}>
              {assignments.filter((a) => a.status === "ACTIVE").length}
            </Text>
            <Text style={styles.summaryLabel}>Activas</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.info }]}>
            <Text style={styles.summaryValue}>
              {assignments.filter((a) => a.status === "COMPLETED").length}
            </Text>
            <Text style={styles.summaryLabel}>Completadas</Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.warning }]}
          >
            <Text style={styles.summaryValue}>
              {assignments.reduce((acc, a) => acc + a.brigadistasCount, 0)}
            </Text>
            <Text style={styles.summaryLabel}>Brigadistas</Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateAssignment}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Nueva Asignación</Text>
        </TouchableOpacity>

        {/* Assignments List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Todas las Asignaciones
          </Text>

          {assignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="clipboard-outline"
                size={64}
                color={colors.icon}
              />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No hay asignaciones
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>
                Crea tu primera asignación para empezar
              </Text>
            </View>
          ) : (
            assignments.map((assignment) => {
              const statusConfig = STATUS_CONFIG[assignment.status];
              const progress = calculateProgress(
                assignment.responsesCount,
                assignment.targetCount,
              );

              return (
                <TouchableOpacity
                  key={assignment.id}
                  style={[
                    styles.assignmentCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => handleViewAssignment(assignment)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      <Text
                        style={[styles.cardTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {assignment.surveyTitle}
                      </Text>
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
                    </View>
                  </View>

                  {/* Team Info */}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={colors.icon}
                    />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {assignment.teamName}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.icon}
                    />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                      {assignment.encargadoName}
                    </Text>
                    <Text style={[styles.infoSubtext, { color: colors.icon }]}>
                      • {assignment.brigadistasCount} brigadistas
                    </Text>
                  </View>

                  {/* Progress */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[styles.progressText, { color: colors.text }]}
                      >
                        Progreso
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
                        { backgroundColor: colors.border },
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
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.dateText, { color: colors.icon }]}>
                      Asignada:{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </Text>
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
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    ...typography.button,
    color: "#FFFFFF",
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
  cardTitleContainer: {
    gap: 8,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    ...typography.body,
  },
  infoSubtext: {
    ...typography.bodySmall,
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
  },
  dateText: {
    ...typography.bodySmall,
  },
});
