import { UserHeader } from "@/components/shared";
import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Admin Dashboard - Main Screen
 * Shows: System metrics, recent activity, quick actions
 * Access: Administrators only (Rule 6)
 */
export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <UserHeader title="Panel de Administración" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* TODO: Add metric cards */}
        <View style={styles.metricsGrid}>
          <View
            style={[styles.metricCard, { backgroundColor: colors.tint + "20" }]}
          >
            <Text style={[styles.metricValue, { color: colors.tint }]}>0</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              Encuestas Activas
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.tint + "20" }]}
          >
            <Text style={[styles.metricValue, { color: colors.tint }]}>0</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              Usuarios
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.tint + "20" }]}
          >
            <Text style={[styles.metricValue, { color: colors.tint }]}>0</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              Respuestas
            </Text>
          </View>
          <View
            style={[styles.metricCard, { backgroundColor: colors.tint + "20" }]}
          >
            <Text style={[styles.metricValue, { color: colors.tint }]}>0</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              Equipos
            </Text>
          </View>
        </View>

        {/* TODO: Add recent activity list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actividad Reciente
          </Text>
          <Text style={[styles.emptyState, { color: colors.icon }]}>
            No hay actividad reciente
          </Text>
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  metricValue: {
    ...typography.h1,
    marginBottom: 4,
  },
  metricLabel: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 16,
  },
  emptyState: {
    ...typography.body,
    textAlign: "center",
    paddingVertical: 40,
  },
});
