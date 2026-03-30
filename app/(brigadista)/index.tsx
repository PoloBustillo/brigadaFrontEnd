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

import { BrigadistaMainMenu, BrigadistaTopBar } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  fetchPublicAppConfig,
  type BottomBarMenuItem,
  type SocialLinkItem,
} from "@/lib/api/app-config";
import {
  getAssignedSurveys,
  type AssignedSurveyResponse,
} from "@/lib/api/mobile";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { responseRepository } from "@/lib/db/repositories/response.repository";
import { offlineSyncService } from "@/lib/services/offline-sync";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GENERATED_QR_BASE_URL = "https://quickchart.io/qr?size=360&margin=1&text=";

const buildGeneratedQrUrl = (url: string | null | undefined) => {
  const normalized = url?.trim();
  if (!normalized) return null;
  return `${GENERATED_QR_BASE_URL}${encodeURIComponent(normalized)}`;
};

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isOnline, isSyncing, pendingCount, syncAll } = useSync();
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<AssignedSurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [localSurveyProgress, setLocalSurveyProgress] = useState<
    Record<string, number>
  >({});
  const [bottomBarMenuItems, setBottomBarMenuItems] = useState<
    BottomBarMenuItem[]
  >([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [showNetworksModal, setShowNetworksModal] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState<string | null>(null);
  const SHOW_SOCIAL_QR = true;

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

  // Load pending sync count + local stats
  const loadLocalStats = async () => {
    try {
      const count = await offlineSyncService.getPendingSyncCount();
      setPendingSyncCount(count);
    } catch {}

    // Load completed count from local DB
    if (user?.id) {
      try {
        const stats = await responseRepository.getResponseStats(
          String(user.id),
        );
        setCompletedCount(stats.completed + stats.validated);
      } catch {}
    }
  };

  // Load per-survey progress from local drafts
  const loadSurveyProgress = async () => {
    if (!assignments.length) return;
    const progress: Record<string, number> = {};
    for (const a of assignments) {
      try {
        const responses = await responseRepository.getResponsesBySurvey(
          String(a.survey_id),
          String(a.latest_version.id),
        );
        // If any response is completed/synced, mark 100%
        const completed = responses.find(
          (r) => r.status === "completed" || r.sync_status === "synced",
        );
        if (completed) {
          progress[String(a.assignment_id)] =
            a.latest_version.questions.length || 1;
        } else if (responses.length > 0) {
          // Draft — count answered questions
          const latest = responses[0];
          try {
            const answers = JSON.parse(latest.answers_json || "[]");
            progress[String(a.assignment_id)] = Array.isArray(answers)
              ? answers.length
              : 0;
          } catch {
            progress[String(a.assignment_id)] = 0;
          }
        }
      } catch {}
    }
    setLocalSurveyProgress(progress);
  };

  useEffect(() => {
    fetchAssignments();
    loadLocalStats();
  }, []);

  useEffect(() => {
    const loadBottomBarConfig = async () => {
      const config = await fetchPublicAppConfig();
      setSocialLinks(config?.social_links ?? []);
      const configuredItems = config?.bottom_bar_menu_items ?? [];
      if (configuredItems.length > 0) {
        setBottomBarMenuItems(configuredItems);
        return;
      }

      setBottomBarMenuItems(
        (config?.bottom_bar_survey_ids ?? []).map((surveyId) => ({
          survey_id: surveyId,
          title: `Encuesta ${surveyId}`,
          icon: "document-text-outline",
        })),
      );
    };

    loadBottomBarConfig();
  }, []);

  // Refresh local stats when syncing changes or assignments load
  useEffect(() => {
    if (!isSyncing) loadLocalStats();
  }, [isSyncing]);

  useEffect(() => {
    loadSurveyProgress();
  }, [assignments]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchAssignments(false);
    await loadLocalStats();
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
      await loadLocalStats();
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

  // Stats derived from real assignments + local DB data
  const totalPendingSync = pendingSyncCount + pendingCount;
  const stats = [
    {
      icon: "clipboard" as const,
      value: String(assignments.length),
      label: "Asignadas",
      color: colors.primary,
    },
    {
      icon: "checkmark-circle" as const,
      value: String(completedCount),
      label: "Completadas",
      color: colors.success,
    },
    {
      icon: "cloud-upload" as const,
      value: String(totalPendingSync),
      label: "Sin Sync",
      color: totalPendingSync > 0 ? colors.error : colors.info,
    },
  ];

  // Real sync status
  const syncStatus = {
    lastSync:
      totalPendingSync === 0 ? "Todo al día" : `${totalPendingSync} pendientes`,
    pendingResponses: totalPendingSync,
    isSynced: totalPendingSync === 0 && !isSyncing,
  };

  // Map API assignments to card props
  const assignmentCards = assignments.map((a) => ({
    id: a.assignment_id,
    title: a.survey_title,
    category: a.assigned_location ?? "Sin ubicación",
    completed: localSurveyProgress[String(a.assignment_id)] ?? 0,
    total: a.latest_version.questions.length || 1,
    dueDate: "–",
    priority: "medium" as const,
    synced:
      (localSurveyProgress[String(a.assignment_id)] ?? 0) >=
      (a.latest_version.questions.length || 1),
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

  const matchedBottomBarAssignments = (() => {
    if (bottomBarMenuItems.length === 0) return [];

    const uniqueBySurvey = new Map<number, AssignedSurveyResponse>();
    for (const assignment of assignments) {
      if (!uniqueBySurvey.has(assignment.survey_id)) {
        uniqueBySurvey.set(assignment.survey_id, assignment);
      }
      if (!uniqueBySurvey.has(assignment.assignment_id)) {
        uniqueBySurvey.set(assignment.assignment_id, assignment);
      }
    }

    return bottomBarMenuItems
      .map((menuItem) => {
        const assignment = uniqueBySurvey.get(menuItem.survey_id);
        if (!assignment) return null;
        return {
          key: menuItem.survey_id,
          assignment,
          title: menuItem.title || assignment.survey_title,
          icon: menuItem.icon,
        };
      })
      .filter(
        (
          item,
        ): item is {
          key: number;
          assignment: AssignedSurveyResponse;
          title: string;
          icon: BottomBarMenuItem["icon"];
        } => Boolean(item),
      );
  })();

  const bottomBarAssignments = matchedBottomBarAssignments.slice(0, 6);

  const unavailableBottomItemsCount = Math.max(
    0,
    bottomBarMenuItems.length - matchedBottomBarAssignments.length,
  );

  // Calculate extra surveys (assigned but not in bottom menu)
  const extraSurveys = assignments
    .filter((a) => {
      const isInMenu = bottomBarMenuItems.some(
        (m) => m.survey_id === a.survey_id || m.survey_id === a.assignment_id,
      );
      return !isInMenu;
    })
    .map((a) => ({
      id: a.survey_id,
      title: a.survey_title,
    }));

  const handleExtraSurveyPress = (surveyId: number) => {
    const assignment = assignments.find((a) => a.survey_id === surveyId);
    if (!assignment?.latest_version?.id) {
      router.push("/(brigadista)/my-surveys" as any);
      return;
    }

    router.push({
      pathname: "/(brigadista)/surveys/fill",
      params: {
        surveyId: String(assignment.survey_id),
        surveyTitle: assignment.survey_title,
        versionId: String(assignment.latest_version.id),
        questionsJson: JSON.stringify(
          assignment.latest_version.questions ?? [],
        ),
      },
    });
  };

  const handleReportIssue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url =
      "mailto:brigadadigitalmorena@gmail.com?subject=Reporte%20de%20error%20-%20Brigada%20Digital";
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        "No disponible",
        "No se pudo abrir el correo en este dispositivo.",
      );
      return;
    }
    await Linking.openURL(url);
  };

  const handleOpenNetworks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (socialLinks.length === 0) {
      Alert.alert(
        "Sin enlaces disponibles",
        "Todavia no hay redes configuradas para mostrar.",
      );
      return;
    }
    setActiveQrUrl(null);
    setShowNetworksModal(true);
  };

  const handleOpenSocialUrl = async (url: string | null) => {
    if (!url) {
      Alert.alert("Sin enlace", "Esta red no tiene enlace configurado.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        "Enlace no disponible",
        "No se pudo abrir este enlace en el dispositivo.",
      );
      return;
    }

    await Linking.openURL(url);
  };

  const handleShowQr = (qrUrl: string | null) => {
    if (!qrUrl) {
      Alert.alert("Sin QR", "Esta red no tiene QR configurado.");
      return;
    }

    setActiveQrUrl((current) => (current === qrUrl ? null : qrUrl));
  };

  const handleCloseNetworksModal = () => {
    setActiveQrUrl(null);
    setShowNetworksModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <BrigadistaTopBar
        extraSurveys={extraSurveys}
        onExtraSurveyPress={handleExtraSurveyPress}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPadding + 96 },
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
        {/* Main Menu */}
        <BrigadistaMainMenu
          onExtraPress={() => {
            // Show extras modal or navigate
          }}
          onNetworksPress={handleOpenNetworks}
          onReportIssuePress={handleReportIssue}
          onExitAppPress={handleLogout}
        />

      </ScrollView>

      <Modal
        visible={showNetworksModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseNetworksModal}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.networksModal,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.networksModalHeader}>
              <View>
                <Text style={[styles.networksModalTitle, { color: colors.text }]}>Redes</Text>
                <Text
                  style={[
                    styles.networksModalSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Selecciona una red para abrir enlace o mostrar QR
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseNetworksModal}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {socialLinks.map((social, index) => {
              const hasUrl = Boolean(social.url);
              const resolvedQrUrl = social.qr_url || buildGeneratedQrUrl(social.url);
              const hasQr = Boolean(resolvedQrUrl);
              const isQrActive = Boolean(hasQr && activeQrUrl === resolvedQrUrl);

              return (
                <View
                  key={`${social.platform}-${index}`}
                  style={[
                    styles.socialItem,
                    { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.socialHeader}>
                    <Text style={[styles.socialLabel, { color: colors.text }]}>
                      {social.label}
                    </Text>
                    <Text
                      style={[
                        styles.socialPlatform,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {social.platform}
                    </Text>
                  </View>

                  <View style={styles.socialActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.socialActionButton,
                        {
                          backgroundColor: hasUrl
                            ? colors.primary + "18"
                            : colors.border + "66",
                          borderColor: hasUrl
                            ? colors.primary + "33"
                            : colors.border,
                        },
                      ]}
                      disabled={!hasUrl}
                      onPress={() => handleOpenSocialUrl(social.url)}
                    >
                      <Ionicons
                        name="open-outline"
                        size={16}
                        color={hasUrl ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.socialActionText,
                          {
                            color: hasUrl ? colors.primary : colors.textSecondary,
                          },
                        ]}
                      >
                        Abrir enlace
                      </Text>
                    </TouchableOpacity>

                    {SHOW_SOCIAL_QR ? (
                      <TouchableOpacity
                        style={[
                          styles.socialActionButton,
                          {
                            backgroundColor: hasQr
                              ? colors.success + "18"
                              : colors.border + "66",
                            borderColor: hasQr
                              ? colors.success + "33"
                              : colors.border,
                          },
                        ]}
                        disabled={!hasQr}
                        onPress={() => handleShowQr(resolvedQrUrl)}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={16}
                          color={hasQr ? colors.success : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.socialActionText,
                            {
                              color: hasQr ? colors.success : colors.textSecondary,
                            },
                          ]}
                        >
                          {isQrActive ? "Ocultar QR" : "Mostrar QR"}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {SHOW_SOCIAL_QR && activeQrUrl ? (
              <View
                style={[
                  styles.qrPreviewCard,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.qrTitle, { color: colors.text }]}>Codigo QR</Text>
                <Image
                  source={{ uri: activeQrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {bottomBarMenuItems.length > 0 && (
        <View
          style={[
            styles.bottomSurveyBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          {unavailableBottomItemsCount > 0 && (
            <Text
              style={[
                styles.bottomSurveyHintText,
                { color: colors.textSecondary },
              ]}
            >
              {unavailableBottomItemsCount} acceso(s) no disponible(s) por
              asignación o falta de publicación
            </Text>
          )}
          {bottomBarAssignments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomSurveyBarContent}
            >
              {bottomBarAssignments.map((item) => (
                <TouchableOpacity
                  key={`home-bottom-link-${item.key}`}
                  style={[
                    styles.bottomSurveyButton,
                    {
                      backgroundColor: colors.primary + "14",
                      borderColor: colors.primary + "28",
                    },
                  ]}
                  onPress={() => {
                    if (!item.assignment.latest_version?.id) {
                      router.push("/(brigadista)/my-surveys" as any);
                      return;
                    }
                    router.push({
                      pathname: "/(brigadista)/surveys/fill",
                      params: {
                        surveyId: String(item.assignment.survey_id),
                        surveyTitle: item.assignment.survey_title,
                        versionId: String(item.assignment.latest_version.id),
                        questionsJson: JSON.stringify(
                          item.assignment.latest_version.questions ?? [],
                        ),
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bottomSurveyButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text
              style={[
                styles.bottomSurveyHintText,
                { color: colors.textSecondary },
              ]}
            >
              No hay accesos disponibles por asignación o falta de versión
              publicada
            </Text>
          )}
        </View>
      )}
    </View>
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
  bottomSurveyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 14,
  },
  bottomSurveyBarContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bottomSurveyHintText: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bottomSurveyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 200,
  },
  bottomSurveyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 170,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  networksModal: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    maxHeight: "86%",
  },
  networksModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  networksModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  networksModalSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  socialItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  socialPlatform: {
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "600",
  },
  socialActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  socialActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  socialActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  qrPreviewCard: {
    marginTop: 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
});
