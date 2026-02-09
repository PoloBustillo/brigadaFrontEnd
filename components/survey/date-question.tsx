/**
 * 📅 DATE QUESTION - Placeholder
 * TODO: Implementar con DateTimePicker
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type DateQuestionProps = {
  value: string | null;
  onChange: (value: string) => void;
  question: SurveyQuestion;
};

export function DateQuestion({ value }: DateQuestionProps) {
  return <Text style={styles.placeholder}>Selector de fecha (TODO)</Text>;
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
