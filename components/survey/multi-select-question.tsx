/**
 * ☑️ MULTI SELECT QUESTION - Placeholder
 * TODO: Implementar con checkboxes
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type MultiSelectQuestionProps = {
  value: string[] | null;
  onChange: (value: string[]) => void;
  question: SurveyQuestion;
};

export function MultiSelectQuestion({ value }: MultiSelectQuestionProps) {
  return <Text style={styles.placeholder}>Multi-selector (TODO)</Text>;
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
