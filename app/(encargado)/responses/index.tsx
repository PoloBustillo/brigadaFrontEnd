import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

/**
 * Encargado Responses - Team Responses
 * Shows: Responses from assigned surveys by team members
 */
export default function EncargadoResponses() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Respuestas</Text>
      </View>
      <Text style={[styles.emptyState, { color: colors.icon }]}>
        TODO: Respuestas del equipo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingTop: 60,
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
  },
  emptyState: {
    ...typography.body,
    textAlign: "center",
    paddingVertical: 40,
  },
});
