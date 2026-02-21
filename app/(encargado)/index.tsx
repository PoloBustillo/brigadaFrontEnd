/**
 * Encargado Dashboard - Main Screen
 * Shows: Team overview, assigned surveys, member activity
 * Access: Team managers only (Rules 9-10)
 *
 * ✅ Modern Design: Clean cards with team focus
 * ✅ Dynamic Theme: Uses useThemeColors for full theme support
 * ✅ Mock Data: Shows realistic data for testing UI
 * ✅ Team Management: Focus on team performance and assignments
 */

import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  getMyCreatedAssignments,
  getMyTeam,
  getTeamResponses,
} from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TeamMemberCardProps {
  id: number;
  name: string;
  email: string;
  surveysCompleted: number;
  surveysTotal: number;
  lastActive: string;
  status: "active" | "idle" | "offline";
}

function TeamMemberCard({
  name,
  email,
  surveysCompleted,
  surveysTotal,
  lastActive,
  status,
}: TeamMemberCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const statusConfig = {
    active: {
      label: "Activo",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    idle: {
      label: "Inactivo",
      color: colors.warning,
      icon: "time" as const,
    },
    offline: {
      label: "Sin conexión",
      color: colors.textSecondary,
      icon: "cloud-offline" as const,
    },
  };

  const config = statusConfig[status];
  const progress = (surveysCompleted / surveysTotal) * 100;

  return (
    <TouchableOpacity
      style={[
        styles.memberCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(encargado)/team/" as any);
      }}
    >
      {/* Avatar Circle */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.primary + "20", borderColor: config.color },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </Text>
      </View>

      <View style={styles.memberInfo}>
        {/* Name and Status */}
        <View style={styles.memberHeader}>
          <Text style={[styles.memberName, { color: colors.text }]}>
            {name}
          </Text>
          <View style={styles.statusContainer}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Email */}
        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
          {email}
        </Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {surveysCompleted} de {surveysTotal} encuestas
          </Text>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.success,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Last Active */}
        <Text style={[styles.lastActive, { color: colors.textSecondary }]}>
          Última actividad: {lastActive}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export default function EncargadoHome() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberCardProps[]>([]);

  const formatLastActive = (isoDate: string | null) => {
    if (!isoDate) return "Sin actividad reciente";
    const date = new Date(isoDate);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Hace <1h";
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  const fetchDashboardData = async () => {
    setFetchError(false);
    try {
      const [membersResult, assignmentsResult, responsesResult] =
        await Promise.allSettled([
          getMyTeam(),
          getMyCreatedAssignments(),
          getTeamResponses(0, 200),
        ]);

      // Team members are critical — if this fails, mark error
      if (membersResult.status === "rejected") {
        setFetchError(true);
        setStats([
          { icon: "people", value: 0, label: "Mi Equipo", color: colors.primary },
          { icon: "document-text", value: 0, label: "Mis Encuestas", color: colors.success },
          { icon: "clipboard", value: 0, label: "Respuestas", color: colors.info },
          { icon: "trending-up", value: "0%", label: "Completado", color: colors.warning },
        ]);
        return;
      }

      const members = membersResult.value;
      const assignments =
        assignmentsResult.status === "fulfilled" ? assignmentsResult.value : [];
      const responses =
        responsesResult.status === "fulfilled" ? responsesResult.value : [];

      // If secondary data failed, show a soft banner
      if (
        assignmentsResult.status === "rejected" ||
        responsesResult.status === "rejected"
      ) {
        setFetchError(true);
      }

      const uniqueSurveyIds = new Set(assignments.map((a) => a.survey_id));
      const assignmentsWithResponses = assignments.filter(
        (a) => a.response_count > 0,
      ).length;
      const completionRate =
        assignments.length > 0
          ? Math.round((assignmentsWithResponses / assignments.length) * 100)
          : 0;

      setStats([
        {
          icon: "people",
          value: members.length,
          label: "Mi Equipo",
          color: colors.primary,
        },
        {
          icon: "document-text",
          value: uniqueSurveyIds.size,
          label: "Mis Encuestas",
          color: colors.success,
        },
        {
          icon: "clipboard",
          value: responses.length,
          label: "Respuestas",
          color: colors.info,
        },
        {
          icon: "trending-up",
          value: `${completionRate}%`,
          label: "Completado",
          color: colors.warning,
        },
      ]);

      const mappedMembers: TeamMemberCardProps[] = members.map((member) => {
        const memberAssignments = assignments.filter(
          (a) => a.user_id === member.id,
        );
        const surveysAssigned = new Set(
          memberAssignments.map((a) => a.survey_id),
        ).size;
        const surveysWithResponses = new Set(
          memberAssignments
            .filter((a) => a.response_count > 0)
            .map((a) => a.survey_id),
        ).size;
        const latestResponseDate =
          responses
            .filter((r) => r.user_id === member.id && r.completed_at)
            .map((r) => r.completed_at as string)
            .sort()
            .reverse()[0] ?? null;

        const hasActive = memberAssignments.some((a) => a.status === "active");
        const status: TeamMemberCardProps["status"] = hasActive
          ? "active"
          : memberAssignments.length > 0
            ? "idle"
            : "offline";

        return {
          id: member.id,
          name: member.full_name,
          email: member.email,
          surveysCompleted: surveysWithResponses,
          surveysTotal: Math.max(surveysAssigned, 1),
          lastActive: formatLastActive(latestResponseDate),
          status,
        };
      });

      setTeamMembers(mappedMembers);
    } catch {
      setFetchError(true);
      setStats([
        {
          icon: "people",
          value: 0,
          label: "Mi Equipo",
          color: colors.primary,
        },
        {
          icon: "document-text",
          value: 0,
          label: "Mis Encuestas",
          color: colors.success,
        },
        {
          icon: "clipboard",
          value: 0,
          label: "Respuestas",
          color: colors.info,
        },
        {
          icon: "trending-up",
          value: "0%",
          label: "Completado",
          color: colors.warning,
        },
      ]);
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchDashboardData();
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Bienvenido de nuevo
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {user?.name || "Encargado"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Connection Status */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isOnline
                  ? colors.success + "20"
                  : colors.error + "20",
                borderColor: isOnline ? colors.success : colors.error,
              },
            ]}
          >
            <Ionicons
              name={isOnline ? "wifi" : "wifi-outline"}
              size={16}
              color={isOnline ? colors.success : colors.error}
            />
          </View>
          {/* Theme Toggle */}
          <ThemeToggleIcon />
          {/* Profile */}
          <TouchableOpacity
            style={[
              styles.profileButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(encargado)/profile" as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          {/* Logout */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>

      {/* Error banner only when we have PARTIAL data — not on first-load failure */}
      {fetchError && teamMembers.length > 0 && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={fetchDashboardData}
        >
          <Text style={styles.errorBannerText}>
            No se pudo actualizar. Toca para reintentar.
          </Text>
        </TouchableOpacity>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Team Section */}
      {!isLoading && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mi Equipo
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(encargado)/team/" as any);
              }}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teamList}>
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} {...member} />
            ))}
            {teamMembers.length === 0 && (
              fetchError ? (
                <TouchableOpacity onPress={fetchDashboardData} activeOpacity={0.7}>
                  <Text style={[styles.emptyTeamText, { color: colors.error }]}>
                    No se pudo cargar el equipo. Toca para reintentar.
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.emptyTeamText, { color: colors.textSecondary }]}>
                  No hay miembros de equipo asignados todavía.
                </Text>
              )
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      {!isLoading && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Acciones Rápidas
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Gestión desde CMS",
                  "Las asignaciones se crean y administran en el CMS web. En la app móvil solo puedes consultar avances y respuestas.",
                );
              }}
            >
              <Ionicons
                name="information-circle"
                size={32}
                color={colors.primary}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Gestión en CMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(encargado)/surveys/" as any);
              }}
            >
              <Ionicons name="bar-chart" size={32} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Ver Progreso
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
  statCard: {
    flex: 1,
    minWidth: "22%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  teamList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTeamText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
  },
  memberCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
    gap: 6,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  memberEmail: {
    fontSize: 14,
  },
  progressSection: {
    gap: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  lastActive: {
    fontSize: 12,
  },
  actionsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
});
