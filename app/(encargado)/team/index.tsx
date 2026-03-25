/**
 * Encargado Team - Team Management
 * Shows: Team members (brigadistas), assignments, performance
 * Access: Encargados only (Rule 10)
 */

import { AppHeader } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getAdminAssignments } from "@/lib/api/admin";
import { getCached, setCached } from "@/lib/api/memory-cache";
import {
  getAllTeamResponses,
  getMyCreatedAssignments,
  getMyTeam,
} from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  const { user } = useAuth();
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const initialMembers = getCached<TeamMemberDisplay[]>("encargado:team");
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>(initialMembers ?? []);
  const [isLoading, setIsLoading] = useState(!initialMembers);
  const [fetchError, setFetchError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!!initialMembers);
  const [refreshing, setRefreshing] = useState(false);

  const isEncargadoRole = (role?: string | null) =>
    (role ?? "").toLowerCase() === "encargado";
  const toId = (value: unknown) => Number(value);
  const isActiveStatus = (status?: string | null) =>
    (status ?? "").toLowerCase() === "active";

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

  const fetchTeam = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError(false);

    if (!user?.id) {
      setTeamMembers([]);
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [membersResult, assignmentsResult, createdAssignmentsResult, responsesResult] =
        await Promise.allSettled([
          getMyTeam(),
          getAdminAssignments(),
          getMyCreatedAssignments(),
          getAllTeamResponses(),
        ]);

      // Team list is critical — if this fails, mark error
      if (membersResult.status === "rejected") {
        setFetchError(true);
        return;
      }

      const members = membersResult.value;
      const assignments =
        assignmentsResult.status === "fulfilled" ? assignmentsResult.value : [];
      const createdAssignments =
        createdAssignmentsResult.status === "fulfilled"
          ? createdAssignmentsResult.value
          : [];
      const responses =
        responsesResult.status === "fulfilled" ? responsesResult.value : [];

      // Do not mark the whole screen as offline when optional metric sources fail.
      // Only membersResult (handled above) is critical for connection state.

      const managedSurveyIdsActive = new Set(
        assignments
          .filter(
            (assignment) =>
              toId(assignment.user_id) === toId(user.id) &&
              isEncargadoRole(assignment.user?.role) &&
              isActiveStatus(assignment.status),
          )
          .map((assignment) => assignment.survey_id),
      );

      const managedSurveyIds =
        managedSurveyIdsActive.size > 0
          ? managedSurveyIdsActive
          : new Set(
              assignments
                .filter(
                  (assignment) =>
                    toId(assignment.user_id) === toId(user.id) &&
                    isEncargadoRole(assignment.user?.role),
                )
                .map((assignment) => assignment.survey_id),
            );

      const managedSurveyIdsByAssigner = new Set(
        assignments
          .filter((assignment) => toId(assignment.assigned_by) === toId(user.id))
          .map((assignment) => assignment.survey_id),
      );

      const managedSurveyIdsByCreator = new Set(
        createdAssignments.map((assignment) => assignment.survey_id),
      );

      const managerScopeSurveyIds = new Set<number>([
        ...managedSurveyIds,
        ...managedSurveyIdsByAssigner,
        ...managedSurveyIdsByCreator,
      ]);
      if (managerScopeSurveyIds.size === 0) {
        responses.forEach((response) => {
          if (typeof response.survey_id === "number") {
            managerScopeSurveyIds.add(response.survey_id);
          }
        });
      }

      const scopedAssignments =
        managerScopeSurveyIds.size > 0
          ? assignments.filter((assignment) =>
              managerScopeSurveyIds.has(assignment.survey_id),
            )
          : createdAssignments;

      const responsesByUser = responses.reduce<Map<number, number>>((acc, r) => {
        if (
          typeof r.survey_id === "number" &&
          managerScopeSurveyIds.has(r.survey_id)
        ) {
          acc.set(r.user_id, (acc.get(r.user_id) ?? 0) + 1);
        }
        return acc;
      }, new Map<number, number>());

      const display: TeamMemberDisplay[] = members.map((m) => {
        const userAssignments = scopedAssignments.filter(
          (a: any) => toId(a.user_id) === toId(m.id),
        );
        const uniqueSurveys = new Set(
          userAssignments.map((a: any) => a.survey_id),
        ).size;
        const totalResponsesFromAssignments = userAssignments.reduce(
          (acc: number, a: any) => acc + a.response_count,
          0,
        );
        const totalResponses = Math.max(
          totalResponsesFromAssignments,
          responsesByUser.get(toId(m.id)) ?? 0,
        );
        const hasActive = userAssignments.some((a: any) =>
          isActiveStatus(a.status),
        );
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
      setHasLoadedOnce(true);
      setCached("encargado:team", display);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam(!!initialMembers);
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            No se pudo actualizar. Desliza para reintentar.
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
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
              fetchError && !hasLoadedOnce ? (
                <View
                  style={styles.emptyState}
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
                    No se pudo cargar el equipo. Desliza para reintentar.
                  </Text>
                </View>
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
                  <View
                    key={member.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
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
                    </View>
                  </View>
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
