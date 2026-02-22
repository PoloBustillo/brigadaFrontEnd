/**
 * App Header Component
 * Simple title/subtitle header with safe area support.
 * Actions (profile, logout, theme) are accessible via the Profile tab.
 */

import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** @deprecated – kept for backward compatibility, no longer rendered */
  showLogout?: boolean;
  /** @deprecated – kept for backward compatibility, no longer rendered */
  showProfile?: boolean;
  /** @deprecated – kept for backward compatibility, no longer rendered */
  profileRoute?: string;
}

export function AppHeader({
  title,
  subtitle,
}: AppHeaderProps) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { top: topInset } = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(topInset, 20) + 8 }]}>
      <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
        {subtitle || user?.email}
      </Text>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
});
