/**
 * ✍️ SIGNATURE QUESTION - Placeholder
 * TODO: Implementar con canvas
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type SignatureQuestionProps = {
  value: any;
  onChange: (value: any) => void;
  question: SurveyQuestion;
  responseId: string;
};

export function SignatureQuestion({ value }: SignatureQuestionProps) {
  return (
    <Text style={styles.placeholder}>Canvas de firma (TODO - Fase 2)</Text>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
