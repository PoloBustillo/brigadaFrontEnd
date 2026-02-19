/**
 * 📝 TEXT QUESTION
 * UX:
 * - Generous padding (thumb-friendly)
 * - Character counter when approaching limit
 * - Optional skip note when field is not required
 * - Keyboard type adapts to email / phone / default
 * - Multiline mode for long-form answers
 */

import { useThemeColors } from "@/contexts/theme-context";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface TextQuestionProps {
  value: string | null;
  onChange: (value: string) => void;
  colors?: ReturnType<typeof useThemeColors>;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  maxLength?: number;
  optional?: boolean;
  placeholder?: string;
}

export function TextQuestion({
  value,
  onChange,
  colors: colorsProp,
  multiline = false,
  keyboardType = "default",
  maxLength = 200,
  optional = false,
  placeholder,
}: TextQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;

  const current = value ?? "";
  const remaining = maxLength - current.length;
  const showCounter = remaining <= 40;

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        value={current}
        onChangeText={onChange}
        placeholder={placeholder ?? (optional ? "Opcional..." : "Escribe aquí...")}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        autoCorrect={keyboardType === "default"}
      />
      <View style={styles.footer}>
        {optional && (
          <Text style={[styles.optionalHint, { color: colors.textTertiary }]}>
            Puedes omitir esta respuesta
          </Text>
        )}
        {showCounter && (
          <Text
            style={[
              styles.counter,
              { color: remaining <= 10 ? colors.warning : colors.textTertiary },
            ]}
          >
            {remaining} restantes
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 56,
  },
  inputMultiline: {
    minHeight: 130,
    paddingTop: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  optionalHint: {
    fontSize: 12,
    fontStyle: "italic",
  },
  counter: {
    fontSize: 12,
    fontWeight: "500",
  },
});
