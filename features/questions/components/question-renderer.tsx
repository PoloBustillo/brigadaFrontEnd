import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { Question, QuestionAnswer } from "../types/question-base.types";
import { QuestionType } from "../types/question-types.enum";
import { DateQuestion } from "./date-question";
import { LocationQuestion } from "./location-question";
import { MultiSelectQuestion } from "./multi-select-question";
import { NumberQuestion } from "./number-question";
import { PhotoQuestion } from "./photo-question";
import { RatingQuestion, ScaleQuestion } from "./rating-question";
import { SelectQuestion, YesNoQuestion } from "./select-question";
import { SignatureQuestion } from "./signature-question";
import { SliderQuestion } from "./slider-question";
import { TextQuestion } from "./text-question";

interface QuestionRendererProps {
  question: Question;
  value?: any;
  onChange: (answer: QuestionAnswer) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Renderizador principal de preguntas dinámicas.
 * Factory pattern — selecciona el componente correcto según question.type.
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  disabled = false,
}: QuestionRendererProps) {
  const colors = useThemeColors();

  const renderQuestion = () => {
    switch (question.type) {
      // ── Text / Email / Phone ──────────────────────────────────────────────
      case QuestionType.TEXT:
      case QuestionType.TEXTAREA:
      case QuestionType.EMAIL:
      case QuestionType.PHONE:
        return (
          <TextQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Number ────────────────────────────────────────────────────────────
      case QuestionType.NUMBER:
        return (
          <NumberQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Single select / Radio ─────────────────────────────────────────────
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.SELECT:
      case QuestionType.RADIO:
        return (
          <SelectQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Multi-select / Checkbox ────────────────────────────────────────────
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.MULTI_SELECT:
      case QuestionType.CHECKBOX:
        return (
          <MultiSelectQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Yes / No ──────────────────────────────────────────────────────────
      case QuestionType.YES_NO:
        return (
          <YesNoQuestion
            questionId={question.id}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Date / Time / DateTime ─────────────────────────────────────────────
      case QuestionType.DATE:
      case QuestionType.TIME:
      case QuestionType.DATETIME:
        return (
          <DateQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Rating ────────────────────────────────────────────────────────────
      case QuestionType.RATING:
        return (
          <RatingQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Scale (numeric labeled scale) ─────────────────────────────────────
      case QuestionType.SCALE:
        return (
          <ScaleQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Slider ────────────────────────────────────────────────────────────
      case QuestionType.SLIDER:
        return (
          <SliderQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Location ──────────────────────────────────────────────────────────
      case QuestionType.LOCATION:
        return (
          <LocationQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Photo ─────────────────────────────────────────────────────────────
      case QuestionType.PHOTO:
        return (
          <PhotoQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── Signature ─────────────────────────────────────────────────────────
      case QuestionType.SIGNATURE:
        return (
          <SignatureQuestion
            question={question as any}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      // ── INE OCR (not supported — requires native OCR module) ─────────────
      case QuestionType.INE_OCR:
        return (
          <View
            style={[
              styles.unsupported,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="card-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.unsupportedText, { color: colors.textSecondary }]}
            >
              La verificación de INE no está disponible en esta versión.
            </Text>
          </View>
        );

      // ── File (not supported — no document-picker package) ─────────────────
      case QuestionType.FILE:
        return (
          <View
            style={[
              styles.unsupported,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="document-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.unsupportedText, { color: colors.textSecondary }]}
            >
              La carga de archivos no está disponible en esta versión.
            </Text>
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.unsupported,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.unsupportedText, { color: colors.error }]}>
              Tipo de pregunta no soportado: {(question as any).type}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>
          {question.label}
          {question.required && <Text style={styles.required}> *</Text>}
        </Text>
        {question.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {question.description}
          </Text>
        )}
      </View>

      {/* Question component */}
      <View style={styles.questionContent}>{renderQuestion()}</View>

      {/* Validation error */}
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  required: {
    color: "#ef4444",
  },
  description: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  questionContent: {},
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
  },
  unsupported: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  unsupportedText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
  },
});
