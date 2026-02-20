/**
 * ☑️ MULTI-SELECT QUESTION
 * UX:
 * - Checkmark cards, full-width rows
 * - Selection count badge: "2 seleccionadas"
 * - No auto-advance (requires explicit Siguiente)
 * - Cognitive load: max 7 visible; scroll for more with hint
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectQuestionProps {
  value: string[] | null;
  options: Option[];
  onChange: (value: string[]) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function MultiSelectQuestion({
  value,
  options,
  onChange,
  colors: colorsProp,
}: MultiSelectQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  const selected = value ?? [];

  const toggle = (optValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  };

  if (!options || options.length === 0) {
    return (
      <Text style={{ color: colors.textTertiary, fontStyle: "italic" }}>
        Sin opciones disponibles
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selection count */}
      {selected.length > 0 && (
        <View style={[styles.countBadge, { backgroundColor: colors.overlay }]}>
          <Ionicons name="checkmark-done" size={14} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.primary }]}>
            {selected.length} seleccionada{selected.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.row,
                {
                  backgroundColor: isSelected ? colors.overlay : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1.5,
                },
              ]}
              onPress={() => toggle(opt.value)}
              activeOpacity={0.7}
              accessibilityLabel={opt.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? colors.primary
                      : "transparent",
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: isSelected ? colors.text : colors.textSecondary,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {options.length > 6 && (
        <Text style={[styles.scrollHint, { color: colors.textTertiary }]}>
          Desliza para ver más opciones
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionsContainer: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    minHeight: 56,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  scrollHint: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
});
