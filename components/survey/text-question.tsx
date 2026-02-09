/**
 * 📝 TEXT QUESTION - Componente para preguntas de texto
 *
 * Ejemplo de implementación de un tipo de pregunta
 * Otros componentes seguirán el mismo patrón
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, TextInput } from "react-native";

type TextQuestionProps = {
  value: string | null;
  onChange: (value: string) => void;
  question: SurveyQuestion;
};

export function TextQuestion({ value, onChange, question }: TextQuestionProps) {
  const validation = question.validation || {};
  const maxLength = validation.maxLength as number | undefined;

  return (
    <TextInput
      style={styles.input}
      value={value || ""}
      onChangeText={onChange}
      placeholder={`Escribe ${question.label.toLowerCase()}...`}
      maxLength={maxLength}
      multiline={maxLength ? maxLength > 100 : false}
      numberOfLines={maxLength && maxLength > 100 ? 4 : 1}
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
