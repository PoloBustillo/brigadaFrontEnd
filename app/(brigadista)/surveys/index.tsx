import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";

/**
 * Brigadista Surveys - Assigned Surveys
 * Shows: Only surveys assigned to this brigadista
 */
export default function BrigadistaSurveys() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mis Encuestas" />
      <View style={styles.content}>
        <Text style={[styles.emptyState, { color: colors.textSecondary }]}>
          TODO: Encuestas asignadas
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
