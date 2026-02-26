/**
 * Brigadista Responses – My Responses
 * Paginated infinite-scroll list with detail modal
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getMyResponses,
  type QuestionAnswerDetail,
  type SurveyResponseDetail,
} from "@/lib/api/mobile";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 20;

export default function BrigadistaResponses() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const [responses, setResponses] = useState<SurveyResponseDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [selectedResponse, setSelectedResponse] =
    useState<SurveyResponseDetail | null>(null);
  const hasMore = useRef(true);

  const fetchPage = useCallback(async (skip: number, append: boolean) => {
    try {
      const res = await getMyResponses(skip, PAGE_SIZE);
      if (append) {
        setResponses((prev) => [...prev, ...res.items]);
      } else {
        setResponses(res.items);
      }
      setTotal(res.total);
      hasMore.current = res.has_more;
      setFetchError(false);
    } catch {
      if (!append) setFetchError(true);
    }
  }, []);

  useEffect(() => {
    fetchPage(0, false).finally(() => setIsLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(0, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore.current) return;
    setLoadingMore(true);
    await fetchPage(responses.length, true);
    setLoadingMore(false);
  };

  // ── Helpers ──────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "Hace <1 h";
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} d`;
  };

  const formatLocation = (loc: Record<string, any> | null) => {
    if (!loc) return null;
    if (loc.address) return String(loc.address);
    if (loc.latitude && loc.longitude)
      return `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}`;
    return null;
  };

  const formatAnswer = (a: QuestionAnswerDetail): string => {
    const v = a.answer_value;
    if (v == null) return "—";
    if (typeof v === "boolean") return v ? "Sí" : "No";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v, null, 2);
    return String(v);
  };

  // ── Card ─────────────────────────────────────────────────────

  const renderCard = ({ item: r }: { item: SurveyResponseDetail }) => {
    const loc = formatLocation(r.location as Record<string, any> | null);
    const answersCount = r.answers?.length ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedResponse(r);
        }}
      >
        {/* Top row: title + badge */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.cardTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              Encuesta v{r.version_id}
            </Text>
            <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
              {formatRelative(r.synced_at ?? r.completed_at)}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: r.synced_at
                  ? colors.success + "18"
                  : colors.warning + "18",
              },
            ]}
          >
            <Ionicons
              name={r.synced_at ? "cloud-done" : "cloud-upload"}
              size={14}
              color={r.synced_at ? colors.success : colors.warning}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: r.synced_at ? colors.success : colors.warning,
              }}
            >
              {r.synced_at ? "Sync" : "Pendiente"}
            </Text>
          </View>
        </View>

        {/* Meta chips */}
        <View style={styles.chipRow}>
          <View
            style={[styles.chip, { backgroundColor: colors.primary + "12" }]}
          >
            <Ionicons name="chatbox-outline" size={13} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {answersCount} respuesta{answersCount !== 1 ? "s" : ""}
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
        </View>

        {/* Footer */}
        <View
          style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}
        >
          <Text style={[styles.footerDate, { color: colors.textTertiary }]}>
            {formatDate(r.completed_at)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main ─────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Mis Respuestas"
        subtitle={total > 0 ? `${total} total` : undefined}
      />

      {fetchError && responses.length === 0 && !isLoading && (
        <TouchableOpacity
          style={[styles.errorBanner, { backgroundColor: colors.error + "15" }]}
          onPress={() => {
            setIsLoading(true);
            fetchPage(0, false).finally(() => setIsLoading(false));
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
                Sin respuestas
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Completa encuestas para verlas aquí
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

      {/* ── Detail Modal ── */}
      <Modal
        visible={selectedResponse !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedResponse(null)}
      >
        {selectedResponse && (
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Encuesta v{selectedResponse.version_id}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {new Date(selectedResponse.completed_at).toLocaleDateString(
                    "es-MX",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedResponse(null);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: selectedResponse.synced_at
                      ? colors.success + "18"
                      : colors.warning + "18",
                  },
                ]}
              >
                <Ionicons
                  name={
                    selectedResponse.synced_at ? "cloud-done" : "cloud-upload"
                  }
                  size={14}
                  color={
                    selectedResponse.synced_at ? colors.success : colors.warning
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: selectedResponse.synced_at
                      ? colors.success
                      : colors.warning,
                  }}
                >
                  {selectedResponse.synced_at ? "Sincronizada" : "Pendiente"}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="chatbox" size={14} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.primary,
                  }}
                >
                  {selectedResponse.answers?.length ?? 0} respuestas
                </Text>
              </View>
            </View>

            {/* Answers */}
            <ScrollView
              style={styles.answersScroll}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {!selectedResponse.answers?.length ? (
                <View style={styles.empty}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Sin respuestas detalladas
                  </Text>
                </View>
              ) : (
                (selectedResponse.answers ?? []).map((answer, idx) => (
                  <View
                    key={answer.id}
                    style={[
                      styles.answerCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <View
                        style={[
                          styles.answerBadge,
                          { backgroundColor: colors.primary + "12" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.answerBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          P{idx + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.answerQid,
                          { color: colors.textTertiary },
                        ]}
                      >
                        ID {answer.question_id}
                      </Text>
                    </View>
                    <Text style={[styles.answerValue, { color: colors.text }]}>
                      {formatAnswer(answer)}
                    </Text>
                    {answer.media_url && (
                      <View
                        style={[
                          styles.mediaRow,
                          { borderTopColor: colors.borderLight },
                        ]}
                      >
                        <Ionicons
                          name="image-outline"
                          size={14}
                          color={colors.info}
                        />
                        <Text
                          style={{ fontSize: 12, color: colors.info, flex: 1 }}
                          numberOfLines={1}
                        >
                          Archivo adjunto
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, gap: 10 },
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

  /* Card */
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDate: { fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerDate: { fontSize: 11 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  /* Empty */
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },

  /* Footer loader */
  footer: { paddingVertical: 16, alignItems: "center" },

  /* Modal */
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 13, marginTop: 4 },
  answersScroll: { flex: 1, paddingHorizontal: 20 },

  /* Answer card */
  answerCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  answerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  answerBadgeText: { fontSize: 12, fontWeight: "700" },
  answerQid: { fontSize: 11 },
  answerValue: { fontSize: 14, lineHeight: 21 },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
