/**
 * 🎨 Theme Settings Screen
 * Página de personalización de tema y esquema de colores
 */

import { ColorSchemeSelector } from "@/components/ui/color-scheme-selector";
import { ScreenHeader } from "@/components/shared";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ThemeSettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const router = useRouter();

  const themeModes = [
    { id: "light", name: "Claro", icon: "sunny" },
    { id: "dark", name: "Oscuro", icon: "moon" },
    { id: "auto", name: "Auto", icon: "phone-portrait" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title="Personalización"
        centerTitle
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Modo de tema
          </Text>
          <View style={styles.modeGrid}>
            {themeModes.map((mode) => {
              const isActive = themeMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: isActive
                        ? colors.primary + "15"
                        : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setThemeMode(mode.id)}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={28}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeName,
                      {
                        color: isActive ? colors.primary : colors.text,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {mode.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color Scheme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Esquema de colores
          </Text>
          <ColorSchemeSelector />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  modeGrid: { flexDirection: "row", gap: 12 },
  modeCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  modeName: { fontSize: 14 },
});
