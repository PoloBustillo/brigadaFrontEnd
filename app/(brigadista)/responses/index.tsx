import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";

/**
 * Brigadista Responses - My Responses
 * Shows: Own responses to assigned surveys
 */
export default function BrigadistaResponses() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Respuestas" />
      <View style={styles.content}>
        <Text style={[styles.emptyState, { color: colors.textSecondary }]}>
          TODO: Mis respuestas
        </Text>
      </View>
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
  emptyState: {
    textAlign: "center",
    paddingVertical: 40,
  },
});
