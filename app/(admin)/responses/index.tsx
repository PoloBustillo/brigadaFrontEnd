import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";

/**
 * Admin Responses - All System Responses
 * Shows: All responses from all surveys, analytics
 */
export default function AdminResponses() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Respuestas" />
      <View style={styles.content}>
        <Text style={[styles.emptyState, { color: colors.textSecondary }]}>
          TODO: Todas las respuestas
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
