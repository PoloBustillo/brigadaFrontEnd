import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NumberQuestion as NumberQ, QuestionAnswer } from "../types/question-base.types";

interface Props {
  question: NumberQ;
  value?: number | string;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function NumberQuestion({ question, value = "", onChange, disabled = false }: Props) {
  const colors = useThemeColors();
  const step = question.step ?? 1;

  const numericValue = value === "" ? null : Number(value);

  const emit = (val: number | null) => {
    onChange({ questionId: question.id, value: val, answeredAt: Date.now() });
  };

  const increment = () => {
    const next = (numericValue ?? (question.min ?? 0)) + step;
    if (question.max === undefined || next <= question.max) emit(next);
  };

  const decrement = () => {
    const next = (numericValue ?? (question.min ?? 0)) - step;
    if (question.min === undefined || next >= question.min) emit(next);
  };

  const handleText = (text: string) => {
    if (text === "" || text === "-") {
      onChange({ questionId: question.id, value: text, answeredAt: Date.now() });
      return;
    }
    const n = parseFloat(text);
    if (!isNaN(n)) emit(n);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={decrement}
        disabled={disabled}
        style={[
          styles.stepper,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.stepperLabel, { color: colors.primary }]}>−</Text>
      </TouchableOpacity>

      <View style={styles.inputWrap}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
            },
            disabled && { opacity: 0.5 },
          ]}
          value={value !== null && value !== undefined ? String(value) : ""}
          onChangeText={handleText}
          placeholder={question.placeholder ?? "0"}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          editable={!disabled}
          textAlign="center"
        />
        {question.unit && (
          <Text style={[styles.unit, { color: colors.textSecondary }]}>{question.unit}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={increment}
        disabled={disabled}
        style={[
          styles.stepper,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.stepperLabel, { color: colors.primary }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperLabel: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 26,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    fontSize: 18,
    fontWeight: "600",
  },
  unit: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});
