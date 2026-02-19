/**
 * 🔢 NUMBER QUESTION
 * UX:
 * - Large centred numeric display (easy to read outdoors)
 * - − / + stepper buttons (fat-finger safe, 56dp)
 * - Direct text input on tap of number
 * - Respects min / max constraints
 */

import { useThemeColors } from "@/contexts/theme-context";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NumberQuestionProps {
  value: number | null;
  onChange: (value: number) => void;
  colors?: ReturnType<typeof useThemeColors>;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberQuestion({
  value,
  onChange,
  colors: colorsProp,
  min,
  max,
  step = 1,
}: NumberQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const current = value ?? 0;

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const increment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamp(current + step));
  };

  const decrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(clamp(current - step));
  };

  const commitDraft = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    setDraft("");
  };

  return (
    <View style={styles.container}>
      {/* Stepper row */}
      <View
        style={[
          styles.stepper,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        {/* Decrement */}
        <TouchableOpacity
          style={[
            styles.stepBtn,
            {
              borderRightColor: colors.border,
              opacity: min !== undefined && current <= min ? 0.35 : 1,
            },
          ]}
          onPress={decrement}
          disabled={min !== undefined && current <= min}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: colors.primary }]}>−</Text>
        </TouchableOpacity>

        {/* Value display / edit */}
        {editing ? (
          <TextInput
            style={[styles.valueInput, { color: colors.text }]}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="numeric"
            autoFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.valueDisplay}
            onPress={() => {
              setDraft(String(current));
              setEditing(true);
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.valueText, { color: colors.text }]}>
              {current}
            </Text>
          </TouchableOpacity>
        )}

        {/* Increment */}
        <TouchableOpacity
          style={[
            styles.stepBtn,
            {
              borderLeftColor: colors.border,
              opacity: max !== undefined && current >= max ? 0.35 : 1,
            },
          ]}
          onPress={increment}
          disabled={max !== undefined && current >= max}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Range hint */}
      {(min !== undefined || max !== undefined) && (
        <Text style={[styles.rangeHint, { color: colors.textTertiary }]}>
          {min !== undefined && max !== undefined
            ? `Rango: ${min} – ${max}`
            : min !== undefined
            ? `Mínimo: ${min}`
            : `Máximo: ${max}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  stepper: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
    height: 72,
  },
  stepBtn: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  stepBtnText: {
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  valueDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  valueInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  rangeHint: {
    fontSize: 12,
    textAlign: "center",
  },
});
