/**
 * 🎯 SELECT QUESTION - Placeholder
 * TODO: Implementar con Picker o Modal
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type SelectQuestionProps = {
  value: string | null;
  onChange: (value: string) => void;
  question: SurveyQuestion;
};

export function SelectQuestion({ value }: SelectQuestionProps) {
  return <Text style={styles.placeholder}>Selector (TODO)</Text>;
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
