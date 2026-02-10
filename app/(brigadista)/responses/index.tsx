import { Colors } from "@/constants/theme";
import { typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

/**
 * Brigadista Responses - My Responses
 * Shows: Own responses to assigned surveys
 */
export default function BrigadistaResponses() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Mis Respuestas
        </Text>
      </View>
      <Text style={[styles.emptyState, { color: colors.icon }]}>
        TODO: Mis respuestas
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
