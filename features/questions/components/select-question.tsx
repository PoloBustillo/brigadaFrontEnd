import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SelectQuestion as SelectQ, QuestionAnswer } from "../types/question-base.types";

interface Props {
  question: SelectQ;
  value?: string | number;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

// Also handles YES_NO (passed as synthetic SelectQ with 2 options)
export function SelectQuestion({ question, value, onChange, disabled = false }: Props) {
  const colors = useThemeColors();

  const select = (optValue: string | number) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange({ questionId: question.id, value: optValue, answeredAt: Date.now() });
  };

  return (
    <View style={styles.container}>
      {question.options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => select(opt.value)}
            activeOpacity={0.75}
            disabled={disabled}
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary + "18" : colors.surface,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              {selected && (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.primary : colors.text,
                  fontWeight: selected ? "600" : "400",
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {question.allowOther && (
        <TouchableOpacity
          onPress={() => select("__other__")}
          activeOpacity={0.75}
          disabled={disabled}
          style={[
            styles.option,
            {
              borderColor: value === "__other__" ? colors.primary : colors.border,
              backgroundColor: value === "__other__" ? colors.primary + "18" : colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.radio,
              { borderColor: value === "__other__" ? colors.primary : colors.border },
            ]}
          >
            {value === "__other__" && (
              <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Otro...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── YES / NO convenience wrapper ────────────────────────────────────────────

interface YesNoProps {
  questionId: string;
  value?: boolean;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function YesNoQuestion({ questionId, value, onChange, disabled = false }: YesNoProps) {
  const colors = useThemeColors();

  const select = (v: boolean) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange({ questionId, value: v, answeredAt: Date.now() });
  };

  const options: { label: string; val: boolean; icon: any; color: string }[] = [
    { label: "Sí", val: true, icon: "checkmark-circle", color: colors.success },
    { label: "No", val: false, icon: "close-circle", color: colors.error },
  ];

  return (
    <View style={styles.yesNoRow}>
      {options.map(({ label, val, icon, color }) => {
        const selected = value === val;
        return (
          <TouchableOpacity
            key={String(val)}
            onPress={() => select(val)}
            activeOpacity={0.75}
            disabled={disabled}
            style={[
              styles.yesNoBtn,
              {
                borderColor: selected ? color : colors.border,
                backgroundColor: selected ? color + "20" : colors.surface,
                flex: 1,
              },
            ]}
          >
            <Ionicons name={icon} size={24} color={selected ? color : colors.textSecondary} />
            <Text style={[styles.yesNoLabel, { color: selected ? color : colors.textSecondary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
  yesNoRow: {
    flexDirection: "row",
    gap: 12,
  },
  yesNoBtn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 6,
  },
  yesNoLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
