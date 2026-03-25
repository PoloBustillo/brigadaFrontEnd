/**
 * Encargado Responses – Team Responses
 * Paginated infinite-scroll list with stat header
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getAllTeamResponses,
  getTeamResponses,
  type TeamResponse,
} from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 20;

type ResponseStats = {
  totalSubmissions: number;
  totalAnswers: number;
  uniqueMembers: number;
  averageAnswersPerSubmission: number;
};

const EMPTY_STATS: ResponseStats = {
  totalSubmissions: 0,
  totalAnswers: 0,
  uniqueMembers: 0,
  averageAnswersPerSubmission: 0,
};

export default function EncargadoResponses() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const [responses, setResponses] = useState<TeamResponse[]>([]);
  const [stats, setStats] = useState<ResponseStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasMore = useRef(true);

  const fetchPage = useCallback(async (skip: number, append: boolean) => {
    try {
      const res = await getTeamResponses(skip, PAGE_SIZE);
      if (append) {
        setResponses((prev) => [...prev, ...res.items]);
      } else {
        setResponses(res.items);
        setStats((prev) => {
          if (prev.totalSubmissions > 0) return prev;
          const fallbackAnswers = res.items.reduce(
            (sum, response) => sum + Number(response.answer_count || 0),
            0,
          );
          const fallbackSubmissions =
            typeof res.total === "number" ? res.total : res.items.length;
          return {
            totalSubmissions: fallbackSubmissions,
            totalAnswers: fallbackAnswers,
            uniqueMembers: new Set(res.items.map((response) => response.user_id))
              .size,
            averageAnswersPerSubmission:
              fallbackSubmissions > 0
                ? fallbackAnswers / fallbackSubmissions
                : 0,
          };
        });
      }
      hasMore.current = res.has_more;
      setFetchError(false);
    } catch {
      if (!append) setFetchError(true);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const all = await getAllTeamResponses();
      const totalSubmissions = all.length;
      const totalAnswers = all.reduce(
        (sum, response) => sum + Number(response.answer_count || 0),
        0,
      );
      const uniqueMembers = new Set(all.map((response) => response.user_id))
        .size;

      setStats({
        totalSubmissions,
        totalAnswers,
        uniqueMembers,
        averageAnswersPerSubmission:
          totalSubmissions > 0 ? totalAnswers / totalSubmissions : 0,
      });
    } catch {
      // Keep previous stats if global stats request fails.
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPage(0, false), fetchStats()]).finally(() =>
      setIsLoading(false),
    );
  }, [fetchPage, fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPage(0, false), fetchStats()]);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore.current) return;
    setLoadingMore(true);
    await fetchPage(responses.length, true);
    setLoadingMore(false);
  };

  // ── Helpers ──────────────────────────────────────────────────

  const formatRelative = (iso: string | null) => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "Hace <1 h";
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} d`;
  };

  const formatLocation = (loc: object | null) => {
    if (!loc) return null;
    const l = loc as Record<string, unknown>;
    if (l.address) return String(l.address);
    if (l.latitude && l.longitude)
      return `${Number(l.latitude).toFixed(4)}, ${Number(l.longitude).toFixed(4)}`;
    return null;
  };

  // ── Header (stats + notice) ──────────────────────────────────

  const ListHeader = () => (
    <View>
      <View style={styles.noticeContainer}>
        <CMSNotice message="Vista informativa. El análisis avanzado se realiza en el CMS web." />
      </View>
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chatbox" size={22} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalSubmissions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Envios
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="list" size={22} color={colors.info} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalAnswers}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Preguntas
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="people" size={22} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}> 
            {stats.uniqueMembers}
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
            name="analytics"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={[styles.statValue, { color: colors.text }]}> 
            {stats.averageAnswersPerSubmission.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Preguntas/envio
          </Text>
        </View>
      </View>
    </View>
  );

  // ── Card ─────────────────────────────────────────────────────

  const renderCard = ({ item: r }: { item: TeamResponse }) => {
    const loc = formatLocation(r.location);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Top: survey title */}
        <Text
          style={[styles.cardTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {r.survey_title}
        </Text>

        {/* Brigadista row */}
        <View style={styles.brigadistaRow}>
          <View
            style={[styles.avatar, { backgroundColor: colors.success + "18" }]}
          >
            <Ionicons name="person" size={16} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.brigadistaName, { color: colors.text }]}
              numberOfLines={1}
            >
              {r.brigadista_name}
            </Text>
          </View>
        </View>

        {/* Chips */}
        <View style={styles.chipRow}>
          <View
            style={[styles.chip, { backgroundColor: colors.primary + "12" }]}
          >
            <Ionicons name="list-outline" size={13} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {r.answer_count} resp.
            </Text>
          </View>
          {loc && (
            <View
              style={[styles.chip, { backgroundColor: colors.info + "12" }]}
            >
              <Ionicons name="location-outline" size={13} color={colors.info} />
              <Text
                style={[styles.chipText, { color: colors.info }]}
                numberOfLines={1}
              >
                {loc}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.chip,
              { backgroundColor: colors.textTertiary + "12" },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={13}
              color={colors.textTertiary}
            />
            <Text style={[styles.chipText, { color: colors.textTertiary }]}>
              {formatRelative(r.completed_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Main ─────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Respuestas del Equipo"
        subtitle={
          stats.totalSubmissions > 0
            ? `${stats.totalSubmissions} envios`
            : undefined
        }
      />

      {fetchError && responses.length === 0 && !isLoading && (
        <TouchableOpacity
          style={[styles.errorBanner, { backgroundColor: colors.error + "15" }]}
          onPress={() => {
            setIsLoading(true);
            Promise.all([fetchPage(0, false), fetchStats()]).finally(() =>
              setIsLoading(false),
            );
          }}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={18}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            No se pudo cargar. Toca para reintentar.
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={responses}
          keyExtractor={(r) => String(r.id)}
          renderItem={renderCard}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: contentPadding + 20 },
            responses.length === 0 && styles.centered,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="chatbox-outline"
                size={56}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin respuestas aún
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Las respuestas de tu equipo aparecerán aquí
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, gap: 10 },
  noticeContainer: { marginBottom: 8 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13, fontWeight: "600" },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11 },

  /* Card */
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  brigadistaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  brigadistaName: { fontSize: 13, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  /* Empty */
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },

  /* Footer loader */
  footer: { paddingVertical: 16, alignItems: "center" },
});
