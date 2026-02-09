/**
 * 🔢 NUMBER QUESTION - Componente para preguntas numéricas
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, TextInput } from "react-native";

type NumberQuestionProps = {
  value: number | null;
  onChange: (value: number) => void;
  question: SurveyQuestion;
};

export function NumberQuestion({
  value,
  onChange,
  question,
}: NumberQuestionProps) {
  return (
    <TextInput
      style={styles.input}
      value={value?.toString() || ""}
      onChangeText={(text) => {
        const num = parseInt(text, 10);
        if (!isNaN(num)) {
          onChange(num);
        }
      }}
      keyboardType="numeric"
      placeholder="0"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
});
