/**
 * ✅ BOOLEAN QUESTION
 * UX: Two full-width cards — Sí / No
 * - Min 80dp height (Ley de Fitts: fat-finger safe)
 * - Icon + text for quick recognition even in bright sunlight
 * - Immediate visual feedback; auto-advance triggered by parent
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BooleanQuestionProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function BooleanQuestion({
  value,
  onChange,
  colors: colorsProp,
}: BooleanQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  const opts = [
    {
      v: true,
      label: "Sí",
      icon: "checkmark-circle" as const,
      selectedBg: colors.success + "22",
      selectedBorder: colors.success,
    },
    {
      v: false,
      label: "No",
      icon: "close-circle" as const,
      selectedBg: colors.error + "18",
      selectedBorder: colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      {opts.map(({ v, label, icon, selectedBg, selectedBorder }) => {
        const selected = value === v;
        return (
          <TouchableOpacity
            key={label}
            style={[
              styles.card,
              {
                backgroundColor: selected ? selectedBg : colors.surface,
                borderColor: selected ? selectedBorder : colors.border,
                borderWidth: selected ? 2 : 1.5,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(v);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={selected ? icon : (`${icon}-outline` as any)}
              size={36}
              color={selected ? selectedBorder : colors.textTertiary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.text : colors.textSecondary,
                  fontWeight: selected ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
            {selected && (
              <View style={[styles.dot, { backgroundColor: selectedBorder }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 20,
    position: "relative",
  },
  label: {
    flex: 1,
    fontSize: 18,
    textAlign: "left",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
