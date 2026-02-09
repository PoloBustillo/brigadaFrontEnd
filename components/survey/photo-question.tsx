/**
 * 📷 PHOTO QUESTION - Placeholder
 * TODO: Implementar con expo-camera
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text } from "react-native";

type PhotoQuestionProps = {
  value: any;
  onChange: (value: any) => void;
  question: SurveyQuestion;
  responseId: string;
};

export function PhotoQuestion({ value }: PhotoQuestionProps) {
  return (
    <Text style={styles.placeholder}>Captura de foto (TODO - Fase 2)</Text>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    padding: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
