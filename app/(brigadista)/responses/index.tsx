/**
 * Brigadista Responses - My Responses
 * Shows: Own responses to assigned surveys
 * Access: Brigadistas only (Rule 11)
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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MyResponse {
  id: number;
  surveyTitle: string;
  completedAt: string;
  questionsAnswered: number;
  totalQuestions: number;
  location: string;
  syncStatus: "synced" | "pending";
  raw: SurveyResponseDetail;
}

export default function BrigadistaResponses() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const [responses, setResponses] = useState<MyResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<MyResponse | null>(
    null,
  );

  const fetchResponses = async () => {
    setFetchError(false);
    try {
      const data = await getMyResponses(0, 100);
      const mapped: MyResponse[] = data.map((r) => {
        const answersCount = Array.isArray(r.answers) ? r.answers.length : 0;
        return {
          id: r.id,
          surveyTitle: `Encuesta #${r.version_id}`,
          completedAt: r.synced_at ?? r.completed_at,
          questionsAnswered: answersCount,
          totalQuestions: answersCount,
          location: "Sin ubicación",
          syncStatus: r.synced_at ? "synced" : "pending",
          raw: r,
        };
      });
      setResponses(mapped);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchResponses();
  };

  const handleResponsePress = (response: MyResponse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedResponse(response);
  };

  const formatAnswerValue = (answer: QuestionAnswerDetail): string => {
    const val = answer.answer_value;
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Sí" : "No";
    if (typeof val === "object") {
      if (Array.isArray(val)) return val.join(", ");
      return JSON.stringify(val, null, 2);
    }
    return String(val);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays}d`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Respuestas" />

      {fetchError && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchResponses}>
          <Text style={styles.errorBannerText}>
            No se pudo cargar. Toca para reintentar.
          </Text>
        </TouchableOpacity>
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
          {/* Responses List */}
          <View style={styles.listContainer}>
            {responses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbox-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No hay respuestas
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Tus respuestas aparecerán aquí cuando completes encuestas
                </Text>
              </View>
            ) : (
              responses.map((response) => {
                return (
                  <TouchableOpacity
                    key={response.id}
                    style={[
                      styles.responseCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleResponsePress(response)}
                    activeOpacity={0.7}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <Text
                        style={[styles.surveyTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {response.surveyTitle}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                      />
                    </View>

                    {/* Footer */}
                    <View
                      style={[
                        styles.cardFooter,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.footerInfo}>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.footerText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {response.location}
                          </Text>
                        </View>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.footerText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatDate(response.completedAt)}
                          </Text>
                        </View>
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

      {/* Response Detail Modal */}
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
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedResponse.surveyTitle}
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {new Date(selectedResponse.completedAt).toLocaleDateString(
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

            {/* Status badges */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      selectedResponse.syncStatus === "synced"
                        ? colors.success + "20"
                        : colors.warning + "20",
                  },
                ]}
              >
                <Ionicons
                  name={
                    selectedResponse.syncStatus === "synced"
                      ? "cloud-done"
                      : "cloud-upload"
                  }
                  size={14}
                  color={
                    selectedResponse.syncStatus === "synced"
                      ? colors.success
                      : colors.warning
                  }
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color:
                      selectedResponse.syncStatus === "synced"
                        ? colors.success
                        : colors.warning,
                  }}
                >
                  {selectedResponse.syncStatus === "synced"
                    ? "Sincronizada"
                    : "Pendiente"}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
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
                  {selectedResponse.questionsAnswered} respuestas
                </Text>
              </View>
            </View>

            {/* Answers list */}
            <ScrollView
              style={styles.answersScroll}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {selectedResponse.raw.answers.length === 0 ? (
                <View style={styles.emptyAnswers}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyAnswersText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No hay respuestas detalladas disponibles
                  </Text>
                </View>
              ) : (
                selectedResponse.raw.answers.map(
                  (answer: QuestionAnswerDetail, idx: number) => (
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
                      <Text
                        style={[
                          styles.answerLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Pregunta {idx + 1} (ID: {answer.question_id})
                      </Text>
                      <Text
                        style={[styles.answerValue, { color: colors.text }]}
                      >
                        {formatAnswerValue(answer)}
                      </Text>
                      {answer.media_url && (
                        <View style={styles.mediaRow}>
                          <Ionicons
                            name="image-outline"
                            size={14}
                            color={colors.info}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.info,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            Archivo adjunto
                          </Text>
                        </View>
                      )}
                    </View>
                  ),
                )
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    padding: 20,
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
    textAlign: "center",
    paddingHorizontal: 32,
  },
  responseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  surveyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerInfo: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  answersScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyAnswers: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyAnswersText: {
    fontSize: 14,
    textAlign: "center",
  },
  answerCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  answerValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
