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
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

// ── Inline validators ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-() ]{7,20}$/;

function getValidationHint(
  keyboardType: string,
  value: string,
): { message: string; isError: boolean } | null {
  if (!value || value.length < 3) return null;
  if (keyboardType === "email-address" && !EMAIL_RE.test(value)) {
    return { message: "Formato de correo inválido", isError: true };
  }
  if (keyboardType === "phone-pad" && !PHONE_RE.test(value)) {
    return { message: "Formato de teléfono inválido", isError: true };
  }
  if (keyboardType === "email-address" && EMAIL_RE.test(value)) {
    return { message: "Correo válido", isError: false };
  }
  if (keyboardType === "phone-pad" && PHONE_RE.test(value)) {
    return { message: "Teléfono válido", isError: false };
  }
  return null;
}

interface TextQuestionProps {
  value: string | null;
  onChange: (value: string) => void;
  colors?: ReturnType<typeof useThemeColors>;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  maxLength?: number;
  optional?: boolean;
  placeholder?: string;
  /** When true, the input focuses and opens the keyboard automatically */
  autoFocus?: boolean;
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
  autoFocus = false,
}: TextQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const inputRef = useRef<TextInput>(null);

  const current = value ?? "";
  const remaining = maxLength - current.length;
  const showCounter = remaining <= 40;

  const validationHint = useMemo(
    () => getValidationHint(keyboardType, current),
    [keyboardType, current],
  );

  // Auto-focus: use a short delay so the screen transition/layout settles,
  // then programmatically focus to guarantee keyboard opens.
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const defaultPlaceholder =
    keyboardType === "email-address"
      ? "correo@ejemplo.com"
      : keyboardType === "phone-pad"
        ? "+52 123 456 7890"
        : optional
          ? "Opcional..."
          : "Escribe aquí...";

  const borderColor =
    validationHint?.isError === true
      ? colors.error
      : validationHint?.isError === false
        ? colors.success
        : colors.border;

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: colors.surface,
            borderColor,
            color: colors.text,
          },
        ]}
        value={current}
        onChangeText={onChange}
        placeholder={placeholder ?? defaultPlaceholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        autoCorrect={keyboardType === "default"}
        returnKeyType={multiline ? "default" : "done"}
        autoComplete={
          keyboardType === "email-address"
            ? "email"
            : keyboardType === "phone-pad"
              ? "tel"
              : "off"
        }
        accessibilityLabel={
          keyboardType === "email-address"
            ? "Correo electrónico"
            : keyboardType === "phone-pad"
              ? "Número de teléfono"
              : multiline
                ? "Respuesta de texto largo"
                : "Respuesta de texto"
        }
        accessibilityHint={optional ? "Campo opcional" : "Campo obligatorio"}
      />
      {/* Validation hint */}
      {validationHint && (
        <View style={styles.validationRow}>
          <Ionicons
            name={
              validationHint.isError
                ? "alert-circle-outline"
                : "checkmark-circle-outline"
            }
            size={14}
            color={validationHint.isError ? colors.error : colors.success}
          />
          <Text
            style={[
              styles.validationText,
              {
                color: validationHint.isError ? colors.error : colors.success,
              },
            ]}
          >
            {validationHint.message}
          </Text>
        </View>
      )}

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
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
