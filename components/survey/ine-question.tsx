/**
 * 🪪 INE QUESTION - Placeholder
 * TODO: Implementar con OCR en Fase 2
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type INEQuestionProps = {
  value: any;
  onChange: (value: any) => void;
  question: SurveyQuestion;
  responseId: string;
};

export function INEQuestion({ value }: INEQuestionProps) {
  return (
    <Text style={styles.placeholder}>
      Captura de INE con OCR (TODO - Fase 2)
    </Text>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
