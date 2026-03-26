/**
 * Encargado Team - Team Management
 * Shows: Team members (brigadistas), assignments, performance
 * Access: Encargados only (Rule 10)
 */

import { AppHeader } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getMyTeamSummary,
} from "@/lib/api/assignments";
import { getCached, setCached } from "@/lib/api/memory-cache";
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
  const [teamMembers, setTeamMembers] = useState<TeamMemberDisplay[]>(
    initialMembers ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialMembers);
  const [fetchError, setFetchError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!!initialMembers);
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
      const summary = await getMyTeamSummary();
      const display: TeamMemberDisplay[] = summary.team_members.map((member) => ({
        id: member.id,
        name: member.full_name,
        email: member.email,
        surveysAssigned: member.surveys_assigned,
        responsesCompleted: member.submissions_count,
        status: member.status === "active" ? "active" : "inactive",
      }));
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: contentPadding },
          ]}
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
                Envios
              </Text>
            </View>
          </View>

          {/* Team Members List */}
          <View style={styles.listContainer}>
            {teamMembers.length === 0 ? (
              fetchError && !hasLoadedOnce ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={64}
                    color={colors.error}
                  />
                  <Text style={[styles.emptyText, { color: colors.error }]}>
                    Sin conexión
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
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
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
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
                          {member.responsesCompleted} envios
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
