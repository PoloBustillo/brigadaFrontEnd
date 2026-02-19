/**
 * Admin Dashboard
 * Read-only overview: KPI stats fetched from the real API.
 * All write operations are handled by the web CMS.
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getAdminStats, AdminStats } from "@/lib/api/admin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ---------------------------------------------------------------------------

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

export default function AdminDashboard() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();

  const [apiStats, setApiStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setApiStats(data);
    } catch {
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchStats(true);
  };

  const statCards: StatCardProps[] = apiStats
    ? [
        {
          icon: "document-text-outline" as const,
          value: apiStats.activeSurveys,
          label: "Encuestas activas",
          color: colors.primary,
        },
        {
          icon: "people-outline" as const,
          value: apiStats.totalUsers,
          label: "Usuarios",
          color: colors.success,
        },
        {
          icon: "chatbox-outline" as const,
          value: apiStats.totalResponses,
          label: "Respuestas",
          color: colors.info,
        },
        {
          icon: "briefcase-outline" as const,
          value: apiStats.pendingAssignments,
          label: "Asig. pendientes",
          color: colors.warning,
        },
        {
          icon: "checkmark-circle-outline" as const,
          value: apiStats.completedAssignments,
          label: "Asig. completadas",
          color: colors.success,
        },
        {
          icon: "person-outline" as const,
          value: apiStats.activeBrigadistas,
          label: "Brigadistas activos",
          color: colors.info,
        },
        {
          icon: "trending-up-outline" as const,
          value: `${apiStats.responseRate}%`,
          label: "Tasa de respuesta",
          color: colors.primary,
        },
        {
          icon: "layers-outline" as const,
          value: apiStats.totalAssignments,
          label: "Total asignaciones",
          color: colors.textSecondary,
        },
      ]
    : [];


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Resumen" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Read-only notice */}
        <View
          style={[
            styles.noticeBanner,
            { backgroundColor: colors.info + "18", borderColor: colors.info + "40" },
          ]}
        >
          <Ionicons name="eye-outline" size={16} color={colors.info} />
          <Text style={[styles.noticeText, { color: colors.info }]}>
            Vista de solo lectura. Gestiona el contenido desde el CMS web.
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        {!loading && apiStats && (
          <View style={styles.statsGrid}>
            {statCards.map((card, i) => (
              <StatCard key={i} {...card} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  loader: { marginTop: 60 },
  errorContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
