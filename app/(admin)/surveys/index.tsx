/**
 * Admin Surveys - Survey Management
 * Shows: All surveys, create/edit, assignments overview
 * Access: Administrators only (Rule 6)
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

interface Survey {
  id: number;
  title: string;
  category: string;
  questionsCount: number;
  responsesCount: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  createdAt: string;
}

// Mock data
const mockSurveys: Survey[] = [
  {
    id: 1,
    title: "Encuesta de Satisfacción Ciudadana 2024",
    category: "Servicios Públicos",
    questionsCount: 15,
    responsesCount: 234,
    status: "ACTIVE",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Censo de Infraestructura Urbana",
    category: "Infraestructura",
    questionsCount: 22,
    responsesCount: 156,
    status: "ACTIVE",
    createdAt: "2024-01-20",
  },
  {
    id: 3,
    title: "Evaluación de Programas Sociales",
    category: "Programas Sociales",
    questionsCount: 18,
    responsesCount: 89,
    status: "DRAFT",
    createdAt: "2024-02-01",
  },
];

export default function AdminSurveys() {
  const colors = useThemeColors();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>(mockSurveys);
  const [refreshing, setRefreshing] = useState(false);

  const statusConfig = {
    ACTIVE: {
      label: "Activa",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    DRAFT: {
      label: "Borrador",
      color: colors.warning,
      icon: "create-outline" as const,
    },
    ARCHIVED: {
      label: "Archivada",
      color: colors.textSecondary,
      icon: "archive-outline" as const,
    },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch surveys from database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCreateSurvey = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to create survey screen
    console.log("Create new survey");
  };

  const handleSurveyPress = (survey: Survey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to survey detail
    console.log("View survey:", survey.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Encuestas" />

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
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {surveys.length}
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
            <Ionicons name="pulse" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {surveys.filter((s) => s.status === "ACTIVE").length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Activas
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="chatbox" size={24} color={colors.info} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {surveys.reduce((acc, s) => acc + s.responsesCount, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Respuestas
            </Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateSurvey}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Nueva Encuesta</Text>
        </TouchableOpacity>

        {/* Surveys List */}
        <View style={styles.listContainer}>
          {surveys.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No hay encuestas
              </Text>
              <Text
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Crea tu primera encuesta para empezar
              </Text>
            </View>
          ) : (
            surveys.map((survey) => {
              const config = statusConfig[survey.status];
              return (
                <TouchableOpacity
                  key={survey.id}
                  style={[
                    styles.surveyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSurveyPress(survey)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleSection}>
                      <Text
                        style={[styles.cardTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {survey.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardCategory,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {survey.category}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: config.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={config.icon}
                        size={14}
                        color={config.color}
                      />
                      <Text
                        style={[styles.statusText, { color: config.color }]}
                      >
                        {config.label}
                      </Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="help-circle-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {survey.questionsCount} preguntas
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="chatbox-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.infoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {survey.responsesCount} respuestas
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
                    <Text
                      style={[styles.dateText, { color: colors.textSecondary }]}
                    >
                      Creada: {new Date(survey.createdAt).toLocaleDateString()}
                    </Text>
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
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
  },
  surveyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 12,
  },
});
