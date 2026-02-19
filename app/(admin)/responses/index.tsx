/**
 * Admin Responses - All System Responses
 * Read-only responses overview for mobile
 * Filters and response management are handled in web CMS
 */

import { AppHeader, CMSNotice } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import {
  getAdminResponsesSummary,
  type AdminResponsesSummaryItem,
} from "@/lib/api/admin";
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

export default function AdminResponses() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const [responses, setResponses] = useState<AdminResponsesSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    setFetchError(false);
    try {
      const data = await getAdminResponsesSummary();
      setResponses(data);
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchSummary();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sin respuestas";
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

  const activeSurveysWithResponses = responses.filter(
    (r) => r.is_active && r.total_responses > 0,
  ).length;
  const totalResponses = responses.reduce(
    (sum, r) => sum + r.total_responses,
    0,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Respuestas" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPadding },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <CMSNotice message="Vista de solo lectura. Filtros avanzados y detalle de respuestas se gestionan en el CMS web." />

        {fetchError && (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchSummary}>
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
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="chatbox" size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalResponses}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Respuestas
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={24}
                  color={colors.success}
                />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {activeSurveysWithResponses}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Activas con respuestas
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="cloud-upload" size={24} color={colors.info} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {responses.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Encuestas
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
                    style={[
                      styles.emptySubtext,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Las respuestas por encuesta aparecerán aquí
                  </Text>
                </View>
              ) : (
                responses.map((response) => {
                  const statusColor = response.is_active
                    ? colors.success
                    : colors.textSecondary;

                  return (
                    <View
                      key={response.survey_id}
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
                        <View style={styles.badges}>
                          <Ionicons
                            name={
                              response.is_active
                                ? "checkmark-circle"
                                : "pause-circle"
                            }
                            size={20}
                            color={statusColor}
                          />
                        </View>
                      </View>

                      {/* Survey status */}
                      <View style={styles.respondentInfo}>
                        <View
                          style={[
                            styles.avatar,
                            { backgroundColor: statusColor + "20" },
                          ]}
                        >
                          <Ionicons
                            name="layers-outline"
                            size={20}
                            color={statusColor}
                          />
                        </View>
                        <View style={styles.respondentDetails}>
                          <Text
                            style={[
                              styles.respondentName,
                              { color: colors.text },
                            ]}
                          >
                            {response.total_responses} respuesta
                            {response.total_responses !== 1 ? "s" : ""}
                          </Text>
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: statusColor + "20" },
                            ]}
                          >
                            <Text
                              style={[styles.roleText, { color: statusColor }]}
                            >
                              {response.is_active ? "Activa" : "Inactiva"}
                            </Text>
                          </View>
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
                              Última respuesta:{" "}
                              {formatDate(response.last_response_at)}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  errorBanner: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
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
  respondentInfo: {
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
  respondentDetails: {
    flex: 1,
  },
  respondentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
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
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
