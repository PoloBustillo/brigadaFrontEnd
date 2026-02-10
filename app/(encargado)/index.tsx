import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Encargado Home - Main Screen
 * Shows: Assigned surveys, team status, pending tasks
 * Access: Team managers only (Rules 9-10)
 */
export default function EncargadoHome() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Inicio</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Gestiona tus encuestas y equipo
        </Text>
      </View>

      {/* TODO: Add summary cards */}
      <View style={styles.summaryGrid}>
        <View
          style={[styles.summaryCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.summaryValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>
            Encuestas Asignadas
          </Text>
        </View>
        <View
          style={[styles.summaryCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.summaryValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>
            Miembros del Equipo
          </Text>
        </View>
        <View
          style={[styles.summaryCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.summaryValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>
            Respuestas Completadas
          </Text>
        </View>
      </View>

      {/* TODO: Add pending assignments */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tareas Pendientes
        </Text>
        <Text style={[styles.emptyState, { color: colors.icon }]}>
          No tienes tareas pendientes
        </Text>
      </View>

      {/* TODO: Add team activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Actividad del Equipo
        </Text>
        <Text style={[styles.emptyState, { color: colors.icon }]}>
          No hay actividad reciente
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    paddingTop: 60,
  },
  title: {
    ...typography.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    minWidth: "30%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  summaryValue: {
    ...typography.h2,
    marginBottom: 4,
  },
  summaryLabel: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  emptyState: {
    ...typography.body,
    textAlign: "center",
    paddingVertical: 40,
  },
});
