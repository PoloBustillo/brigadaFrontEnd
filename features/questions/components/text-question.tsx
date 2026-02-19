import { useThemeColors } from "@/contexts/theme-context";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type {
  QuestionAnswer,
  TextAreaQuestion,
  TextQuestion as TextQ,
} from "../types/question-base.types";

interface Props {
  question: TextQ | TextAreaQuestion;
  value?: string;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function TextQuestion({
  question,
  value = "",
  onChange,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  const isMultiline = question.type === "textarea";
  const maxLen = (question as any).maxLength as number | undefined;

  const handleChange = (text: string) => {
    onChange({ questionId: question.id, value: text, answeredAt: Date.now() });
  };

  return (
    <View>
      <TextInput
        style={[
          styles.input,
          isMultiline && styles.textarea,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          },
          disabled && { opacity: 0.5 },
        ]}
        value={value}
        onChangeText={handleChange}
        placeholder={
          question.placeholder ??
          (isMultiline ? "Escribe tu respuesta..." : "Ingresa tu respuesta")
        }
        placeholderTextColor={colors.textSecondary}
        editable={!disabled}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 4 : 1}
        maxLength={maxLen}
        textAlignVertical={isMultiline ? "top" : "center"}
      />
      {maxLen !== undefined && (
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {value.length} / {maxLen}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    height: 50,
  },
  textarea: {
    height: 110,
    paddingTop: 12,
  },
  counter: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
});
