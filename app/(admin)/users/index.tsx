import { AppHeader } from "@/components/shared";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";

/**
 * Admin Users - User Management
 * Shows: All users, roles, activation status
 */
export default function AdminUsers() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Usuarios" />
      <View style={styles.content}>
        <Text style={[styles.emptyState, { color: colors.textSecondary }]}>
          TODO: Lista de usuarios
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
