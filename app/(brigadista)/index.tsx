import { BrigadistaMainMenu, BrigadistaTopBar } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  fetchPublicAppConfig,
  resolveBottomBarMenuItems,
  type BottomBarMenuItem,
} from "@/lib/api/app-config";
import {
  getAssignedSurveys,
  getMyLatestScore,
  type AssignedSurveyResponse,
  type LatestUserScoreResponse,
} from "@/lib/api/mobile";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BrigadistaHome() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<AssignedSurveyResponse[]>([]);
  const [latestScore, setLatestScore] =
    useState<LatestUserScoreResponse["snapshot"]>(null);
  const [isScoreLoading, setIsScoreLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const ASSIGNMENTS_CACHE_KEY = "assignments_active";
  const ASSIGNMENTS_CACHE_TTL = 30 * 60 * 1000;

  const [bottomBarMenuItems, setBottomBarMenuItems] = useState<
    BottomBarMenuItem[]
  >([]);

  const loadBottomBarConfig = async () => {
    const config = await fetchPublicAppConfig();
    setBottomBarMenuItems(resolveBottomBarMenuItems(config));
  };

  const fetchLatestScore = async () => {
    setIsScoreLoading(true);
    try {
      const data = await getMyLatestScore();
      setLatestScore(data.snapshot);
    } catch (err) {
      console.error("Error fetching brigadista score:", err);
      setLatestScore(null);
    } finally {
      setIsScoreLoading(false);
    }
  };

  const fetchAssignments = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    let hasAnyAssignments = false;

    try {
      const cached = await cacheRepository.get<AssignedSurveyResponse[]>(
        ASSIGNMENTS_CACHE_KEY,
        true,
      );
      if (cached && cached.length > 0) {
        hasAnyAssignments = true;
        setAssignments(cached);
        if (showLoading) {
          setIsLoading(false);
        }
      }
    } catch {
      // Ignore cache read errors; we'll still try API.
    }

    try {
      const data = await getAssignedSurveys("active");
      hasAnyAssignments = hasAnyAssignments || data.length > 0;
      setAssignments(data);

      void cacheRepository
        .set(ASSIGNMENTS_CACHE_KEY, data, ASSIGNMENTS_CACHE_TTL)
        .catch(() => {
          // Non-blocking cache persistence.
        });
    } catch (err) {
      console.error("Error fetching brigadista assignments:", err);
      if (!hasAnyAssignments) {
        setAssignments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments().catch((err) => {
      console.error("Error bootstrapping brigadista home:", err);
      setIsLoading(false);
    });

    fetchLatestScore().catch((err) => {
      console.error("Error bootstrapping brigadista score:", err);
      setIsScoreLoading(false);
    });

    loadBottomBarConfig().catch((err) => {
      console.error("Error loading bottom menu config:", err);
      setBottomBarMenuItems([]);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.allSettled([fetchAssignments(false), fetchLatestScore()]);
    setRefreshing(false);
  };

  const scoreSummary = useMemo(() => {
    if (!latestScore) {
      return {
        label: "Sin score",
        value: "-",
        color: colors.textSecondary,
        helper: "Aun no hay score calculado para este periodo",
      };
    }

    const score = Number(latestScore.score_global || 0);
    if (score < 50) {
      return {
        label: "Riesgo alto",
        value: score.toFixed(1),
        color: colors.error,
        helper: "Prioriza capturas y sincronizacion oportuna",
      };
    }

    if (score < 75) {
      return {
        label: "En seguimiento",
        value: score.toFixed(1),
        color: colors.warning,
        helper: "Vas bien, aun hay margen de mejora",
      };
    }

    return {
      label: "Buen nivel",
      value: score.toFixed(1),
      color: colors.success,
      helper: "Mantienes un desempeno solido",
    };
  }, [
    colors.error,
    colors.success,
    colors.textSecondary,
    colors.warning,
    latestScore,
  ]);

  const temporalSummary = useMemo(() => {
    const now = new Date();
    let active = 0;
    let upcoming = 0;
    let expired = 0;

    for (const assignment of assignments) {
      const startsAt = assignment.starts_at
        ? new Date(assignment.starts_at)
        : null;
      const endsAt = assignment.ends_at ? new Date(assignment.ends_at) : null;

      if (startsAt && startsAt > now) {
        upcoming += 1;
        continue;
      }

      if (endsAt && endsAt < now) {
        expired += 1;
        continue;
      }

      active += 1;
    }

    return { active, upcoming, expired };
  }, [assignments]);

  const handleTemporalPress = (window: "active" | "upcoming" | "expired") => {
    router.push({
      pathname: "/(brigadista)/questionnaires",
      params: { temporal: window },
    });
  };

  const handleScoreCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(brigadista)/score-details");
  };

  const handleExitApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Cerrar Sesion",
      "Estas seguro que deseas cerrar sesion?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Cerrar Sesion",
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

  const matchedBottomBarAssignments = useMemo(() => {
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
  }, [assignments, bottomBarMenuItems]);

  const bottomBarAssignments = matchedBottomBarAssignments.slice(0, 6);

  const unavailableBottomItemsCount = Math.max(
    0,
    bottomBarMenuItems.length - matchedBottomBarAssignments.length,
  );

  const handleBottomMenuAssignmentPress = (
    assignment: AssignedSurveyResponse,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!assignment.latest_version?.id) {
      Alert.alert(
        "Encuesta no disponible",
        "Esta encuesta todavia no tiene una version publicada.",
      );
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrigadistaTopBar
        temporalSummary={temporalSummary}
        onTemporalPress={handleTemporalPress}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              28 +
              (bottomBarMenuItems.length > 0
                ? 96 + Math.max(insets.bottom, 10)
                : 0),
          },
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
        <BrigadistaMainMenu onExitAppPress={handleExitApp} />

        <TouchableOpacity
          style={[
            styles.scoreCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={handleScoreCardPress}
          activeOpacity={0.85}
        >
          <View style={styles.scoreCardHeader}>
            <Text style={[styles.scoreCardTitle, { color: colors.text }]}>
              Mi Score Quincenal
            </Text>
            <View style={styles.scoreCardActions}>
              <Ionicons name="analytics" size={18} color={scoreSummary.color} />
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </View>

          {isScoreLoading ? (
            <Text
              style={[styles.scoreCardLoading, { color: colors.textSecondary }]}
            >
              Cargando score...
            </Text>
          ) : (
            <>
              <View style={styles.scoreRow}>
                <Text
                  style={[styles.scoreValue, { color: scoreSummary.color }]}
                >
                  {scoreSummary.value}
                </Text>
                <Text
                  style={[
                    styles.scoreBadge,
                    {
                      color: scoreSummary.color,
                      borderColor: scoreSummary.color,
                    },
                  ]}
                >
                  {scoreSummary.label}
                </Text>
              </View>
              <Text
                style={[styles.scoreHelper, { color: colors.textSecondary }]}
              >
                {scoreSummary.helper}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isLoading ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Cargando informacion temporal...
          </Text>
        ) : null}
      </ScrollView>

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
              asignacion o falta de publicacion
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
                    handleBottomMenuAssignmentPress(item.assignment);
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
              No hay accesos disponibles por asignacion o falta de version
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
  content: {
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 14,
  },
  scoreCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  scoreCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  scoreCardLoading: {
    fontSize: 13,
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  scoreBadge: {
    fontSize: 12,
    fontWeight: "700",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreHelper: {
    fontSize: 12,
    lineHeight: 17,
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
});
