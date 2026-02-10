import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Brigadista Home - Main Screen
 * Shows: Assigned surveys, completion progress, sync status
 * Access: Field workers only (Rule 11)
 */
export default function BrigadistaHome() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Mis Encuestas
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Completa tus encuestas asignadas
        </Text>
      </View>

      {/* TODO: Add sync status indicator */}
      <View style={[styles.syncCard, { backgroundColor: colors.tint + "15" }]}>
        <Text style={[styles.syncStatus, { color: colors.tint }]}>
          ✓ Sincronizado
        </Text>
        <Text style={[styles.syncDetails, { color: colors.icon }]}>
          Última sincronización: Ahora
        </Text>
      </View>

      {/* TODO: Add progress cards */}
      <View style={styles.progressGrid}>
        <View
          style={[styles.progressCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.progressValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            Completadas
          </Text>
        </View>
        <View
          style={[styles.progressCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.progressValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            Pendientes
          </Text>
        </View>
        <View
          style={[styles.progressCard, { backgroundColor: colors.tint + "20" }]}
        >
          <Text style={[styles.progressValue, { color: colors.tint }]}>0</Text>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            Sin Sincronizar
          </Text>
        </View>
      </View>

      {/* TODO: Add assigned surveys list */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Encuestas Asignadas
        </Text>
        <Text style={[styles.emptyState, { color: colors.icon }]}>
          No tienes encuestas asignadas
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
  syncCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  syncStatus: {
    ...typography.h3,
    marginBottom: 4,
  },
  syncDetails: {
    ...typography.bodySmall,
  },
  progressGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  progressCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  progressValue: {
    ...typography.h2,
    marginBottom: 4,
  },
  progressLabel: {
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
