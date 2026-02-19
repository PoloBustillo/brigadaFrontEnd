/**
 * Brigadista Responses - My Responses
 * Shows: Own responses to assigned surveys
 * Access: Brigadistas only (Rule 11)
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { getMyResponses } from "@/lib/api/mobile";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
}

export default function BrigadistaResponses() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const [responses, setResponses] = useState<MyResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchResponses = async () => {
    setFetchError(false);
    try {
      const data = await getMyResponses(0, 100);
      const mapped: MyResponse[] = data.map((r) => {
        const answersCount = Array.isArray(r.answers) ? r.answers.length : 0;
        return {
          id: r.id,
          surveyTitle: `Encuesta #${r.survey_id}`,
          completedAt: r.submitted_at ?? r.created_at,
          questionsAnswered: answersCount,
          totalQuestions: answersCount,
          location: "Sin ubicación",
          syncStatus: r.submitted_at ? "synced" : "pending",
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
    // TODO: Navigate to response detail
    console.log("View response:", response.id);
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
});
