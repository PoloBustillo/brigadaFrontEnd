/**
 * Encargado Responses - Team Responses
 * Shows: All responses submitted by team members
 * Access: Encargados only (Rule 10)
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { getTeamResponses, type TeamResponse } from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
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

export default function EncargadoResponses() {
  const colors = useThemeColors();
  const [responses, setResponses] = useState<TeamResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResponses = async () => {
    setFetchError(false);
    try {
      const data = await getTeamResponses();
      setResponses(data);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchResponses();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  const formatLocation = (loc: object | null) => {
    if (!loc) return null;
    const l = loc as Record<string, unknown>;
    if (l.address) return String(l.address);
    if (l.latitude && l.longitude) return `${l.latitude}, ${l.longitude}`;
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Respuestas del Equipo" />

      <View style={styles.noticeContainer}>
        <CMSNotice message="Vista informativa. El análisis avanzado y gestión se realizan en el CMS web." />
      </View>

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
          contentContainerStyle={styles.content}
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
              <Ionicons name="chatbox" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {responses.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="checkmark-done-circle"
                size={24}
                color={colors.success}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {responses.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sincronizadas
              </Text>
            </View>
          </View>

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
                  Las respuestas del equipo aparecerán aquí
                </Text>
              </View>
            ) : (
              responses.map((response) => {
                return (
                  <View
                    key={response.id}
                    style={[
                      styles.responseCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <Text
                        style={[styles.surveyTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {response.survey_title}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.success}
                      />
                    </View>

                    {/* Brigadista Info */}
                    <View style={styles.brigadistaInfo}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colors.success + "20" },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={20}
                          color={colors.success}
                        />
                      </View>
                      <View style={styles.brigadistaDetails}>
                        <Text
                          style={[
                            styles.brigadistaLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Brigadista
                        </Text>
                        <Text
                          style={[
                            styles.brigadistaName,
                            { color: colors.text },
                          ]}
                        >
                          {response.brigadista_name}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View
                      style={[
                        styles.cardFooter,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.footerInfo}>
                        {formatLocation(response.location) && (
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
                              {formatLocation(response.location)}
                            </Text>
                          </View>
                        )}
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
                            {formatDate(response.completed_at)}
                          </Text>
                        </View>
                        <View style={styles.footerItem}>
                          <Ionicons
                            name="list-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.footerText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {response.answer_count} respuestas
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="eye-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
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
  noticeContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    padding: 20,
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
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  brigadistaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  brigadistaDetails: {
    flex: 1,
  },
  brigadistaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  brigadistaName: {
    fontSize: 14,
    fontWeight: "600",
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
