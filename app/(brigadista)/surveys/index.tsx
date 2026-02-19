import { useThemeColors } from "@/contexts/theme-context";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Legacy alias route.
 * Canonical brigadista surveys flow lives in /(brigadista)/my-surveys.
 */
export default function BrigadistaSurveysRedirect() {
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    router.replace("/(brigadista)/my-surveys" as any);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
