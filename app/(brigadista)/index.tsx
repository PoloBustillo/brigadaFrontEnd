/**
 * Brigadista Dashboard - Main Screen
 * Shows: Assigned surveys, completion progress, sync status
 * Access: Field workers only (Rule 11)
 *
 * ✅ Modern Design: Clean cards with field work focus
 * ✅ Dynamic Theme: Uses useThemeColors for full theme support
 * ✅ Mock Data: Shows realistic data for testing UI
 * ✅ Offline Ready: Sync status and offline capabilities highlighted
 */

import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getAssignedSurveys,
  type AssignedSurveyResponse,
} from "@/lib/api/mobile";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { offlineSyncService } from "@/lib/services/offline-sync";
import { Ionicons } from "@expo/vector-icons";
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

interface SurveyAssignmentCardProps {
  id: number;
  title: string;
  category: string;
  completed: number;
  total: number;
  dueDate: string;
  priority: "high" | "medium" | "low";
  synced: boolean;
  onPress: () => void;
}

function SurveyAssignmentCard({
  title,
  category,
  completed,
  total,
  dueDate,
  priority,
  synced,
  onPress,
}: SurveyAssignmentCardProps) {
  const colors = useThemeColors();

  const priorityConfig = {
    high: {
      label: "Alta",
      color: colors.error,
      icon: "alert-circle" as const,
    },
    medium: {
      label: "Media",
      color: colors.warning,
      icon: "warning" as const,
    },
    low: {
      label: "Baja",
      color: colors.info,
      icon: "information-circle" as const,
    },
  };

  const config = priorityConfig[priority];
  const progress = (completed / total) * 100;
  const isComplete = completed === total;

  return (
    <TouchableOpacity
      style={[
        styles.surveyCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {/* Header with Priority and Sync Status */}
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: config.color + "20" },
          ]}
        >
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.priorityText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        {!synced && (
          <View
            style={[
              styles.syncBadge,
              { backgroundColor: colors.warning + "20" },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={14}
              color={colors.warning}
            />
          </View>
        )}
      </View>

      {/* Title and Category */}
      <Text
        style={[styles.cardTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
        {category}
      </Text>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Progreso: {completed}/{total}
          </Text>
          <Text
            style={[
              styles.progressPercent,
              { color: isComplete ? colors.success : colors.primary },
            ]}
          >
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: isComplete ? colors.success : colors.primary,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Due Date */}
      <View style={styles.cardFooter}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[styles.dueDateText, { color: colors.textSecondary }]}>
          Vence: {dueDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
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

export default function BrigadistaHome() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, syncAll } = useSync();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<AssignedSurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const CACHE_KEY = "assignments_active";
  const CACHE_TTL = 30 * 60 * 1000; // 30 min

  // Load cached assignments immediately, then fetch from API
  const fetchAssignments = async (showLoading = true) => {
    setFetchError(false);

    // 1. Load from cache instantly (stale-while-revalidate)
    try {
      const cached = await cacheRepository.get<AssignedSurveyResponse[]>(
        CACHE_KEY,
        true,
      );
      if (cached && cached.length > 0) {
        setAssignments(cached);
        if (showLoading) setIsLoading(false); // Show cached data immediately
      }
    } catch {}

    // 2. Try API fetch if online
    if (!isOnline) {
      // If we have cached data, don't show error
      setIsLoading(false);
      if (assignments.length === 0) setFetchError(true);
      return;
    }

    try {
      const data = await getAssignedSurveys("active");
      setAssignments(data);
      // Cache the response
      await cacheRepository.set(CACHE_KEY, data, CACHE_TTL);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      // Only show error if we have no cached data
      if (assignments.length === 0) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending sync count
  const loadPendingSyncCount = async () => {
    try {
      const count = await offlineSyncService.getPendingSyncCount();
      setPendingSyncCount(count);
    } catch {}
  };

  useEffect(() => {
    fetchAssignments();
    loadPendingSyncCount();
  }, []);

  // Refresh sync count when syncing changes
  useEffect(() => {
    if (!isSyncing) loadPendingSyncCount();
  }, [isSyncing]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchAssignments(false);
    await loadPendingSyncCount();
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert(
        "Sin conexión",
        "Necesitas conexión a internet para sincronizar.",
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await syncAll();
      await loadPendingSyncCount();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
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

  // Stats derived from real assignments + real sync data
  const activeCount = assignments.filter(
    (a) => a.assignment_status === "active",
  ).length;
  const stats = [
    {
      icon: "checkmark-circle" as const,
      value: String(assignments.length),
      label: "Asignadas",
      color: colors.success,
    },
    {
      icon: "time" as const,
      value: String(activeCount),
      label: "Activas",
      color: colors.warning,
    },
    {
      icon: "document-text" as const,
      value: String(assignments.length - activeCount),
      label: "Completadas",
      color: colors.primary,
    },
    {
      icon: "cloud-upload" as const,
      value: String(pendingSyncCount + pendingCount),
      label: "Sin Sync",
      color: pendingSyncCount + pendingCount > 0 ? colors.error : colors.info,
    },
  ];

  // Real sync status
  const totalPending = pendingSyncCount + pendingCount;
  const syncStatus = {
    lastSync: totalPending === 0 ? "Todo al día" : `${totalPending} pendientes`,
    pendingResponses: totalPending,
    isSynced: totalPending === 0 && !isSyncing,
  };

  // Map API assignments to card props
  const assignmentCards = assignments.map((a) => ({
    id: a.assignment_id,
    title: a.survey_title,
    category: a.assigned_location ?? "Sin ubicación",
    completed: 0,
    total: a.latest_version.questions.length || 1,
    dueDate: "–",
    priority: "medium" as const,
    synced: false,
    onPress: () => {
      if (!a.latest_version?.id) {
        router.push("/(brigadista)/my-surveys" as any);
        return;
      }

      router.push({
        pathname: "/(brigadista)/surveys/fill",
        params: {
          surveyId: String(a.survey_id),
          surveyTitle: a.survey_title,
          versionId: String(a.latest_version.id),
          questionsJson: JSON.stringify(a.latest_version.questions ?? []),
        },
      });
    },
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: contentPadding },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando encuestas...
          </Text>
        </View>
      )}

      {/* Network error banner */}
      {!isLoading && fetchError && (
        <TouchableOpacity
          style={[
            styles.errorBanner,
            { backgroundColor: colors.error + "15", borderColor: colors.error },
          ]}
          onPress={() => {
            setIsLoading(true);
            fetchAssignments();
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={20}
            color={colors.error}
          />
          <Text style={[styles.errorBannerText, { color: colors.error }]}>
            No se pudo cargar. Toca para reintentar.
          </Text>
          <Ionicons name="refresh-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: colors.warning ?? "#f59e0b" },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Sin conexión — mostrando datos guardados
          </Text>
        </View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Hola de nuevo
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {user?.name || "Brigadista"}
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
              router.push("/(brigadista)/profile" as any);
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

      {/* Sync Status Card */}
      <TouchableOpacity
        style={[
          styles.syncCard,
          {
            backgroundColor: syncStatus.isSynced
              ? colors.success + "15"
              : colors.warning + "15",
            borderColor: syncStatus.isSynced ? colors.success : colors.warning,
          },
        ]}
        activeOpacity={0.7}
        onPress={handleSync}
        disabled={isSyncing}
      >
        <View style={styles.syncHeader}>
          <View style={styles.syncInfo}>
            <Ionicons
              name={syncStatus.isSynced ? "checkmark-circle" : "cloud-upload"}
              size={24}
              color={syncStatus.isSynced ? colors.success : colors.warning}
            />
            <View>
              <Text
                style={[
                  styles.syncStatus,
                  {
                    color: syncStatus.isSynced
                      ? colors.success
                      : colors.warning,
                  },
                ]}
              >
                {syncStatus.isSynced
                  ? "Todo Sincronizado"
                  : "Pendiente de Sync"}
              </Text>
              <Text
                style={[styles.syncDetails, { color: colors.textSecondary }]}
              >
                {syncStatus.lastSync}
              </Text>
            </View>
          </View>
          {isSyncing ? (
            <Text style={[styles.syncingText, { color: colors.primary }]}>
              Sincronizando...
            </Text>
          ) : (
            <Ionicons name="sync" size={20} color={colors.primary} />
          )}
        </View>
        {syncStatus.pendingResponses > 0 && (
          <View
            style={[
              styles.pendingBadge,
              { backgroundColor: colors.warning + "30" },
            ]}
          >
            <Text style={[styles.pendingText, { color: colors.warning }]}>
              {syncStatus.pendingResponses} respuestas pendientes de subir
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>

      {/* Assignments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Mis Asignaciones
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(brigadista)/my-surveys" as any);
            }}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.assignmentsList}>
          {assignmentCards.length > 0 ? (
            assignmentCards.map((assignment) => (
              <SurveyAssignmentCard key={assignment.id} {...assignment} />
            ))
          ) : !isLoading && !fetchError ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="clipboard-outline"
                size={40}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: colors.textSecondary },
                ]}
              >
                Sin encuestas asignadas
              </Text>
              <Text
                style={[styles.emptyStateText, { color: colors.textTertiary }]}
              >
                Tu encargado te asignará encuestas pronto. Usa el gesto de
                arrastrar hacia abajo para actualizar.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Quick Actions */}
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
              router.push("/(brigadista)/my-surveys" as any);
            }}
          >
            <Ionicons name="clipboard" size={32} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Ver Encuestas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(brigadista)/responses/" as any);
            }}
          >
            <Ionicons name="list" size={32} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Mis Respuestas
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    // paddingBottom se aplica dinámicamente con useTabBarHeight
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
  syncCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  syncHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  syncStatus: {
    fontSize: 16,
    fontWeight: "600",
  },
  syncDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  syncingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pendingBadge: {
    padding: 8,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
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
  assignmentsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  surveyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  syncBadge: {
    padding: 6,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  cardCategory: {
    fontSize: 14,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "700",
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
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dueDateText: {
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 10,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
