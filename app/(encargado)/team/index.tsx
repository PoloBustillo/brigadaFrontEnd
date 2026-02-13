import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";

/**
 * Encargado Team - Team Management
 * Shows: Team members (brigadistas), assignments
 */
export default function EncargadoTeam() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mi Equipo" />
      <View style={styles.content}>
        <Text style={[styles.emptyState, { color: colors.textSecondary }]}>
          TODO: Miembros del equipo
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
