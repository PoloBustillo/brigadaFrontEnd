import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MultiSelectQuestion as MultiSelectQ, QuestionAnswer } from "../types/question-base.types";

interface Props {
  question: MultiSelectQ;
  value?: (string | number)[];
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function MultiSelectQuestion({ question, value = [], onChange, disabled = false }: Props) {
  const colors = useThemeColors();

  const toggle = (optValue: string | number) => {
    if (disabled) return;
    Haptics.selectionAsync();
    const current: (string | number)[] = Array.isArray(value) ? value : [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];

    // Respect maxSelections
    if (question.maxSelections !== undefined && next.length > question.maxSelections) return;

    onChange({ questionId: question.id, value: next, answeredAt: Date.now() });
  };

  const selected: (string | number)[] = Array.isArray(value) ? value : [];

  return (
    <View style={styles.container}>
      {question.minSelections !== undefined && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Selecciona mínimo {question.minSelections}
          {question.maxSelections !== undefined ? ` y máximo ${question.maxSelections}` : ""}
        </Text>
      )}

      {question.options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => toggle(opt.value)}
            activeOpacity={0.75}
            disabled={disabled}
            style={[
              styles.option,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary + "18" : colors.surface,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : "transparent",
                },
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.primary : colors.text,
                  fontWeight: isSelected ? "600" : "400",
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
          onPress={() => toggle("__other__")}
          activeOpacity={0.75}
          disabled={disabled}
          style={[
            styles.option,
            {
              borderColor: selected.includes("__other__") ? colors.primary : colors.border,
              backgroundColor: selected.includes("__other__") ? colors.primary + "18" : colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: selected.includes("__other__") ? colors.primary : colors.border,
                backgroundColor: selected.includes("__other__") ? colors.primary : "transparent",
              },
            ]}
          >
            {selected.includes("__other__") && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Otro...</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.counter, { color: colors.textSecondary }]}>
        {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
        {question.maxSelections !== undefined ? ` / ${question.maxSelections}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  hint: {
    fontSize: 13,
    marginBottom: 2,
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
  counter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
});
