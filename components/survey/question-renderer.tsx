/**
 * 🎯 QUESTION RENDERER - Componente Maestro
 *
 * Renderiza cualquier tipo de pregunta basado en el schema
 * Guardado automático al cambiar valor
 */

import type { SurveyQuestion } from "@/lib/db/schema";
import { SurveyRepository } from "@/lib/repositories/survey-repository";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Importar componentes específicos por tipo
import { BooleanQuestion } from "./boolean-question";
import { DateQuestion } from "./date-question";
import { FileQuestion } from "./file-question";
import { INEQuestion } from "./ine-question";
import { LocationQuestion } from "./location-question";
import { MultiSelectQuestion } from "./multi-select-question";
import { NumberQuestion } from "./number-question";
import { PhotoQuestion } from "./photo-question";
import { SelectQuestion } from "./select-question";
import { SignatureQuestion } from "./signature-question";
import { TextQuestion } from "./text-question";

type QuestionRendererProps = {
  question: SurveyQuestion;
  responseId: string;
  onAnswerSaved?: () => void;
};

export function QuestionRenderer({
  question,
  responseId,
  onAnswerSaved,
}: QuestionRendererProps) {
  const [value, setValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar respuesta existente (si ya se respondió antes)
  useEffect(() => {
    async function loadAnswer() {
      try {
        setLoading(true);
        const answer = await SurveyRepository.getQuestionAnswer(
          responseId,
          question.id,
        );
        if (answer) {
          setValue(answer.value);
        }
      } catch (err) {
        console.error("Failed to load answer:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnswer();
  }, [question.id, responseId]);

  async function handleValueChange(newValue: any) {
    // Actualizar UI inmediatamente
    setValue(newValue);

    // Guardar en SQLite
    try {
      setSaving(true);
      setError(null);

      await SurveyRepository.saveQuestionAnswer({
        responseId,
        questionId: question.id,
        questionPath: `${question.id}`, // TODO: calcular path real
        questionType: question.type,
        value: newValue,
      });

      console.log(`✅ Saved answer for: ${question.id}`);
      onAnswerSaved?.();
    } catch (err) {
      console.error("Failed to save answer:", err);
      setError("Error al guardar respuesta");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Label de la pregunta */}
      <View style={styles.header}>
        <Text style={styles.label}>
          {question.label}
          {question.required && <Text style={styles.required}> *</Text>}
        </Text>
        {saving && <ActivityIndicator size="small" />}
      </View>

      {/* Descripción (opcional) */}
      {question.description && (
        <Text style={styles.description}>{question.description}</Text>
      )}

      {/* Componente específico según tipo */}
      {renderQuestionInput()}

      {/* Mensaje de error */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  function renderQuestionInput() {
    const commonProps = {
      value,
      onChange: handleValueChange,
      question,
    };

    switch (question.type) {
      case "text":
        return <TextQuestion {...commonProps} />;

      case "number":
        return <NumberQuestion {...commonProps} />;

      case "date":
        return <DateQuestion {...commonProps} />;

      case "select":
        return <SelectQuestion {...commonProps} />;

      case "multi_select":
        return <MultiSelectQuestion {...commonProps} />;

      case "boolean":
        return <BooleanQuestion {...commonProps} />;

      case "photo":
        return (
          <PhotoQuestion
            {...commonProps}
            responseId={responseId}
            mode={
              (question.validation_rules as any)?.mode === "document"
                ? "document"
                : "field"
            }
          />
        );

      case "signature":
        return <SignatureQuestion {...commonProps} responseId={responseId} />;

      case "ine":
        return <INEQuestion {...commonProps} responseId={responseId} />;

      case "file":
        return <FileQuestion {...commonProps} />;

      case "location":
        return <LocationQuestion {...commonProps} />;

      default:
        return (
          <Text style={styles.error}>
            Tipo de pregunta no soportado: {question.type}
          </Text>
        );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  required: {
    color: "#ff3b30",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    color: "#ff3b30",
    marginTop: 8,
  },
});
