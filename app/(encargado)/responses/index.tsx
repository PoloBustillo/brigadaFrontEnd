/**
 * Encargado Responses - Team Responses
 * Shows: All responses submitted by team members
 * Access: Encargados only (Rule 10)
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TeamResponse {
  id: number;
  surveyTitle: string;
  brigadistaName: string;
  completedAt: string;
  questionsAnswered: number;
  totalQuestions: number;
  location: string;
  syncStatus: "synced" | "pending";
}

// Mock data
const mockTeamResponses: TeamResponse[] = [
  {
    id: 1,
    surveyTitle: "Encuesta de Satisfacción Ciudadana 2024",
    brigadistaName: "Juan Pérez",
    completedAt: "2024-02-13T10:30:00",
    questionsAnswered: 15,
    totalQuestions: 15,
    location: "Zona Norte",
    syncStatus: "synced",
  },
  {
    id: 2,
    surveyTitle: "Censo de Infraestructura Urbana",
    brigadistaName: "María López",
    completedAt: "2024-02-13T09:15:00",
    questionsAnswered: 22,
    totalQuestions: 22,
    location: "Zona Sur",
    syncStatus: "synced",
  },
  {
    id: 3,
    surveyTitle: "Encuesta de Satisfacción Ciudadana 2024",
    brigadistaName: "Carlos García",
    completedAt: "2024-02-12T16:45:00",
    questionsAnswered: 14,
    totalQuestions: 15,
    location: "Zona Este",
    syncStatus: "pending",
  },
  {
    id: 4,
    surveyTitle: "Evaluación de Programas Sociales",
    brigadistaName: "Ana Martínez",
    completedAt: "2024-02-12T14:20:00",
    questionsAnswered: 18,
    totalQuestions: 18,
    location: "Zona Oeste",
    syncStatus: "synced",
  },
];

export default function EncargadoResponses() {
  const colors = useThemeColors();
  const router = useRouter();
  const [responses, setResponses] = useState<TeamResponse[]>(mockTeamResponses);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch team responses from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleResponsePress = (response: TeamResponse) => {
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

  const completedResponses = responses.filter(
    (r) => r.questionsAnswered === r.totalQuestions,
  ).length;
  const pendingSync = responses.filter(
    (r) => r.syncStatus === "pending",
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Respuestas del Equipo" />

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
              {completedResponses}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Completas
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="cloud-upload"
              size={24}
              color={pendingSync > 0 ? colors.warning : colors.info}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {pendingSync}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pendientes
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
              const isComplete =
                response.questionsAnswered === response.totalQuestions;
              const isSynced = response.syncStatus === "synced";

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
                      numberOfLines={1}
                    >
                      {response.surveyTitle}
                    </Text>
                    <View style={styles.badges}>
                      {isComplete ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success}
                        />
                      ) : (
                        <Ionicons
                          name="time"
                          size={20}
                          color={colors.warning}
                        />
                      )}
                      {!isSynced && (
                        <Ionicons
                          name="cloud-upload-outline"
                          size={20}
                          color={colors.warning}
                        />
                      )}
                    </View>
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
                        style={[styles.brigadistaName, { color: colors.text }]}
                      >
                        {response.brigadistaName}
                      </Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text
                        style={[
                          styles.progressText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Progreso
                      </Text>
                      <Text
                        style={[
                          styles.progressValue,
                          {
                            color: isComplete ? colors.success : colors.warning,
                          },
                        ]}
                      >
                        {response.questionsAnswered}/{response.totalQuestions}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: isComplete
                              ? colors.success
                              : colors.warning,
                            width: `${(response.questionsAnswered / response.totalQuestions) * 100}%`,
                          },
                        ]}
                      />
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
