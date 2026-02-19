/**
 * 🎯 SELECT QUESTION — Single choice
 * UX:
 * - ≤5 options: full-width tap cards (no scroll needed)
 * - >5 options: scrollable list with radio indicator
 * - Selected state clearly distinct from unselected
 * - Auto-advance is triggered by onChange (parent decides timing)
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface SelectQuestionProps {
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function SelectQuestion({ value, options, onChange, colors: colorsProp }: SelectQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  const handlePress = (opt: Option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(opt.value);
  };

  if (!options || options.length === 0) {
    return (
      <Text style={{ color: colors.textTertiary, fontStyle: "italic" }}>
        Sin opciones disponibles
      </Text>
    );
  }

  const useCards = options.length <= 5;

  if (useCards) {
    return (
      <View style={styles.cardsContainer}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.card,
                {
                  backgroundColor: selected ? colors.overlay : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  borderWidth: selected ? 2 : 1.5,
                },
              ]}
              onPress={() => handlePress(opt)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : "transparent",
                  },
                ]}
              >
                {selected && <View style={styles.radioInner} />}
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  {
                    color: selected ? colors.text : colors.textSecondary,
                    fontWeight: selected ? "600" : "400",
                  },
                ]}
              >
                {opt.label}
              </Text>
              {selected && (
                <Ionicons name="checkmark" size={18} color={colors.primary} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // List mode for many options
  return (
    <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.listItem,
              {
                borderBottomColor: colors.border,
                backgroundColor: selected ? colors.overlay : "transparent",
              },
            ]}
            onPress={() => handlePress(opt)}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : "transparent",
                },
              ]}
            >
              {selected && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[
                styles.listLabel,
                {
                  color: selected ? colors.text : colors.textSecondary,
                  fontWeight: selected ? "600" : "400",
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 56,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  checkIcon: {
    marginLeft: "auto",
  },
  listScroll: {
    maxHeight: 320,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listLabel: {
    flex: 1,
    fontSize: 16,
  },
});
