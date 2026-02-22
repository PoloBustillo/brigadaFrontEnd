/**
 * 🔢 NUMBER QUESTION
 * UX:
 * - Scale mode: When range ≤ 10, show tappable numbered circles (ideal for ratings/scales)
 * - Stepper mode: Large centred numeric display with − / + buttons (fat-finger safe)
 * - Direct text input on tap of number in stepper mode
 * - Haptic feedback on every interaction
 * - Respects min / max constraints
 */

import { useThemeColors } from "@/contexts/theme-context";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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

  const current = value ?? min ?? 0;

  // Seed the initial display value so that showing "0" is a valid answer.
  // Without this, the stepper shows 0 but value stays null until user interacts.
  // Only applies to stepper mode — scale/rating requires an explicit tap selection.
  useEffect(() => {
    if (value === null || value === undefined) {
      const isScaleMode =
        min !== undefined && max !== undefined && max - min <= 10 && max > min;
      if (!isScaleMode) {
        onChange(min ?? 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  // If min & max are defined and range is small → scale / rating mode
  const useScaleMode =
    min !== undefined && max !== undefined && max - min <= 10 && max > min;

  // ── Scale mode ──────────────────────────────────────────────────────────
  if (useScaleMode) {
    const items: number[] = [];
    for (let i = min!; i <= max!; i += step) items.push(i);

    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleRow}>
          {items.map((n) => {
            const isSelected = value === n;
            return (
              <TouchableOpacity
                key={n}
                style={[
                  styles.scaleItem,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1.5,
                    flex: 1,
                    maxWidth: 64,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange(n);
                }}
                activeOpacity={0.7}
                accessibilityLabel={`Valor ${n}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.scaleNumber,
                    { color: isSelected ? "#fff" : colors.text },
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Range labels */}
        <View style={styles.scaleLabels}>
          <Text style={[styles.scaleLabelText, { color: colors.textTertiary }]}>
            {min}
          </Text>
          <Text style={[styles.scaleLabelText, { color: colors.textTertiary }]}>
            {max}
          </Text>
        </View>
      </View>
    );
  }

  // ── Stepper mode ────────────────────────────────────────────────────────
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
          accessibilityLabel="Disminuir valor"
          accessibilityRole="button"
        >
          <Text style={[styles.stepBtnText, { color: colors.primary }]}>−</Text>
        </TouchableOpacity>

        {/* Value display / direct edit */}
        {editing ? (
          <TextInput
            style={[styles.valueInput, { color: colors.text }]}
            value={draft}
            onChangeText={setDraft}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.valueDisplay}
            onPress={() => {
              setDraft(String(current));
              setEditing(true);
            }}
            activeOpacity={0.6}
            accessibilityLabel={`Valor actual: ${current}. Toca para editar`}
            accessibilityRole="button"
          >
            <Text style={[styles.valueText, { color: colors.text }]}>
              {current}
            </Text>
            <Text style={[styles.tapHint, { color: colors.textTertiary }]}>
              Toca para editar
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
          accessibilityLabel="Aumentar valor"
          accessibilityRole="button"
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
  // ── Scale mode ──────────────────────────────────────────
  scaleContainer: {
    gap: 8,
  },
  scaleRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  scaleItem: {
    minWidth: 48,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  scaleLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Stepper mode ────────────────────────────────────────
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
    paddingHorizontal: 16,
    gap: 2,
  },
  valueText: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  tapHint: {
    fontSize: 11,
    fontWeight: "400",
  },
  valueInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  rangeHint: {
    fontSize: 12,
    textAlign: "left",
    paddingHorizontal: 4,
  },
});
