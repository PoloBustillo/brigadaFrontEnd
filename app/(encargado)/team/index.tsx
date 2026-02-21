/**
 * Encargado Team - Team Management
 * Shows: Team members (brigadistas), assignments, performance
 * Access: Encargados only (Rule 10)
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { getMyCreatedAssignments, getMyTeam } from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TeamMemberDisplay {
  id: number;
  name: string;
  email: string;
  surveysAssigned: number;
  responsesCompleted: number;
  status: "active" | "inactive";
}

export default function EncargadoTeam() {
  const colors = useThemeColors();
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const statusConfig = {
    active: {
      label: "Activo",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    inactive: {
      label: "Inactivo",
      color: colors.textSecondary,
      icon: "ellipse-outline" as const,
    },
  };

  const fetchTeam = async () => {
    setFetchError(false);
    try {
      const [members, assignments] = await Promise.all([
        getMyTeam(),
        getMyCreatedAssignments(),
      ]);
      const display: TeamMemberDisplay[] = members.map((m) => {
        const userAssignments = assignments.filter((a) => a.user_id === m.id);
        const uniqueSurveys = new Set(userAssignments.map((a) => a.survey_id))
          .size;
        const totalResponses = userAssignments.reduce(
          (acc, a) => acc + a.response_count,
          0,
        );
        const hasActive = userAssignments.some((a) => a.status === "active");
        return {
          id: m.id,
          name: m.full_name,
          email: m.email,
          surveysAssigned: uniqueSurveys,
          responsesCompleted: totalResponses,
          status: hasActive ? "active" : "inactive",
        };
      });
      setTeamMembers(display);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };

  const handleMemberPress = (member: TeamMemberDisplay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("View member:", member.id);
  };

  const totalResponses = teamMembers.reduce(
    (acc, m) => acc + m.responsesCompleted,
    0,
  );
  const activeMembers = teamMembers.filter((m) => m.status === "active").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mi Equipo" />

      {fetchError && teamMembers.length > 0 && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchTeam}>
          <Text style={styles.errorBannerText}>
            No se pudo actualizar. Toca para reintentar.
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {teamMembers.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Brigadistas
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {activeMembers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Activos
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

          {/* Team Members List */}
          <View style={styles.listContainer}>
            {teamMembers.length === 0 ? (
              fetchError ? (
                <TouchableOpacity
                  style={styles.emptyState}
                  onPress={fetchTeam}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={64}
                    color={colors.error}
                  />
                  <Text style={[styles.emptyText, { color: colors.error }]}>
                    Sin conexión
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    No se pudo cargar el equipo. Toca para reintentar.
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={64}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    Equipo sin miembros
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Los brigadistas asignados a tu equipo aparecerán aquí
                  </Text>
                </View>
              )
            ) : (
              teamMembers.map((member) => {
                const config =
                  statusConfig[member.status] ?? statusConfig.inactive;

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleMemberPress(member)}
                    activeOpacity={0.7}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colors.success + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.avatarText, { color: colors.success }]}
                        >
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text
                          style={[styles.memberName, { color: colors.text }]}
                        >
                          {member.name}
                        </Text>
                        <Text
                          style={[
                            styles.memberEmail,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {member.email}
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
                          size={12}
                          color={config.color}
                        />
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.statText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {member.surveysAssigned} encuestas
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons
                          name="checkmark-done-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.statText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {member.responsesCompleted} completadas
                        </Text>
                      </View>
                    </View>

                    {/* Progress section removed — no target available */}

                    {/* Footer */}
                    <View
                      style={[
                        styles.cardFooter,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.footerItem}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.footerText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {config.label}
                        </Text>
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
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  errorBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
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
  memberCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
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
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
