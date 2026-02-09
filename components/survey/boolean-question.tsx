/**
 * ☑️ BOOLEAN QUESTION - Componente para preguntas Sí/No
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BooleanQuestionProps = {
  value: boolean | null;
  onChange: (value: boolean) => void;
  question: SurveyQuestion;
};

export function BooleanQuestion({ value, onChange }: BooleanQuestionProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, value === true && styles.buttonActive]}
        onPress={() => onChange(true)}
      >
        <Text
          style={[styles.buttonText, value === true && styles.buttonTextActive]}
        >
          Sí
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, value === false && styles.buttonActive]}
        onPress={() => onChange(false)}
      >
        <Text
          style={[
            styles.buttonText,
            value === false && styles.buttonTextActive,
          ]}
        >
          No
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  buttonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  buttonTextActive: {
    color: "#fff",
  },
});
