/**
 * 🪪 INE QUESTION — Credential capture placeholder
 * Shows a clear "coming soon" card with themed styling.
 * Phase 2 will add OCR scanning via expo-camera.
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface INEQuestionProps {
  value: any;
  onChange: (value: any) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function INEQuestion({ colors: colorsProp }: INEQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.warning + "20" }]}
      >
        <Ionicons name="id-card-outline" size={32} color={colors.warning} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Captura de INE</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Esta funcionalidad estará disponible próximamente con escaneo OCR
        automático.
      </Text>
      <View style={[styles.badge, { backgroundColor: colors.warning + "18" }]}>
        <Ionicons name="time-outline" size={14} color={colors.warning} />
        <Text style={[styles.badgeText, { color: colors.warning }]}>
          Fase 2
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
