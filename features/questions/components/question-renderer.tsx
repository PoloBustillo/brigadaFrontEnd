import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Question, QuestionAnswer } from "../types/question-base.types";
import { QuestionType } from "../types/question-types.enum";

// Importar componentes de preguntas (crearemos estos después)
// import { TextQuestion } from "./text-question";
// import { TextAreaQuestion } from "./textarea-question";
// ... etc

interface QuestionRendererProps {
  question: Question;
  value?: any;
  onChange: (answer: QuestionAnswer) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Renderizador principal de preguntas dinámicas
 * Factory pattern que selecciona el componente correcto según el tipo
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  disabled = false,
}: QuestionRendererProps) {
  // TODO: Usar este handler cuando se implementen los componentes de preguntas
  // const handleChange = (newValue: any) => {
  //   onChange({
  //     questionId: question.id,
  //     value: newValue,
  //     answeredAt: Date.now(),
  //   });
  // };

  // Renderizar componente según tipo
  const renderQuestion = () => {
    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <View>
            <Text>TODO: TextQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );
      // return (
      //   <TextQuestion
      //     question={question}
      //     value={value}
      //     onChange={handleChange}
      //     disabled={disabled}
      //   />
      // );

      case QuestionType.TEXTAREA:
        return (
          <View>
            <Text>TODO: TextAreaQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.NUMBER:
        return (
          <View>
            <Text>TODO: NumberQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.SELECT:
      case QuestionType.RADIO:
        return (
          <View>
            <Text>TODO: SelectQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.MULTI_SELECT:
      case QuestionType.CHECKBOX:
        return (
          <View>
            <Text>TODO: MultiSelectQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.DATE:
      case QuestionType.TIME:
      case QuestionType.DATETIME:
        return (
          <View>
            <Text>TODO: DateTimeQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.RATING:
        return (
          <View>
            <Text>TODO: RatingQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.SLIDER:
        return (
          <View>
            <Text>TODO: SliderQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.LOCATION:
        return (
          <View>
            <Text>TODO: LocationQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.PHOTO:
        return (
          <View>
            <Text>TODO: PhotoQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.SIGNATURE:
        return (
          <View>
            <Text>TODO: SignatureQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      case QuestionType.FILE:
        return (
          <View>
            <Text>TODO: FileQuestion component</Text>
            <Text style={styles.placeholder}>Type: {question.type}</Text>
          </View>
        );

      default:
        return (
          <View>
            <Text style={styles.error}>Tipo de pregunta no soportado</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Label de la pregunta */}
      <View style={styles.header}>
        <Text style={styles.label}>
          {question.label}
          {question.required && <Text style={styles.required}> *</Text>}
        </Text>
        {question.description && (
          <Text style={styles.description}>{question.description}</Text>
        )}
      </View>

      {/* Componente de pregunta */}
      <View style={styles.questionContent}>{renderQuestion()}</View>

      {/* Error de validación */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  required: {
    color: "#ef4444",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  questionContent: {
    // Espacio para el componente de pregunta
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginTop: 8,
  },
  placeholder: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  error: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
});
