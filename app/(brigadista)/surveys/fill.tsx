/**
 * 📋 SURVEY FILL SCREEN
 * UX Principles applied:
 * - One question per screen (no scroll wall)
 * - Progress by question count + linear bar
 * - Auto-advance for tap responses (yes_no, single_choice)
 * - Non-blocking offline banner
 * - Answers stored progressively (no data loss on interruption)
 * - Skip logic evaluated between screens
 * - Soft error messaging on required fields
 */

import { BooleanQuestion } from "@/components/survey/boolean-question";
import { MultiSelectQuestion } from "@/components/survey/multi-select-question";
import { NumberQuestion } from "@/components/survey/number-question";
import { SelectQuestion } from "@/components/survey/select-question";
import { TextQuestion as TextQuestionComp } from "@/components/survey/text-question";
import { useThemeColors } from "@/contexts/theme-context";
import type { AnswerOptionResponse, QuestionResponse } from "@/lib/api/mobile";
import { submitBatchResponses } from "@/lib/api/mobile";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Internal types ───────────────────────────────────────────────────────────

/** Normalised question used throughout the fill flow */
export interface FillQuestion {
  id: number;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options: { label: string; value: string }[];
  /** If all required answers to a conditional are satisfied */
  conditional?: {
    questionId: number;
    operator: "equals" | "not_equals";
    value: any;
  };
}

type Answers = Record<number, any>; // questionId → value

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AUTO_ADVANCE_TYPES = new Set(["yes_no", "boolean", "single_choice", "select", "radio"]);

function mapApiQuestion(q: QuestionResponse): FillQuestion {
  return {
    id: q.id,
    type: q.question_type,
    label: q.question_text,
    required: q.is_required,
    options: (q.options ?? []).map((o: AnswerOptionResponse) => ({
      label: o.option_text,
      value: String(o.id),
    })),
  };
}

function shouldShowQuestion(q: FillQuestion, answers: Answers): boolean {
  if (!q.conditional) return true;
  const { questionId, operator, value } = q.conditional;
  const answer = answers[questionId];
  if (answer === undefined || answer === null) return false;
  if (operator === "equals") return String(answer) === String(value);
  if (operator === "not_equals") return String(answer) !== String(value);
  return true;
}

function isAutoAdvanceType(type: string): boolean {
  return AUTO_ADVANCE_TYPES.has(type);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FillSurveyScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    surveyTitle: string;
    versionId: string;
    questionsJson: string;
  }>();

  // ── Parse questions ────────────────────────────────────────────────────────
  const allQuestions = useMemo<FillQuestion[]>(() => {
    try {
      const raw: QuestionResponse[] = JSON.parse(params.questionsJson ?? "[]");
      return raw.map(mapApiQuestion);
    } catch {
      return [];
    }
  }, [params.questionsJson]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animated progress value
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Derived ────────────────────────────────────────────────────────────────
  /** Only the questions that pass conditional logic  */
  const visibleQuestions = useMemo(
    () => allQuestions.filter((q) => shouldShowQuestion(q, answers)),
    [allQuestions, answers],
  );

  const total = visibleQuestions.length;
  const current = visibleQuestions[currentIndex] ?? null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progressPercent = total > 0 ? (currentIndex + 1) / total : 0;

  // Animate progress bar on question change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  // ── Answer handling ────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (value: any, advance = false) => {
      setFieldError(null);
      if (!current) return;

      setAnswers((prev) => ({ ...prev, [current.id]: value }));

      if (advance && !isLast) {
        // Slight delay so user sees their selection highlighted before moving
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCurrentIndex((i) => i + 1);
        }, 380);
      }
    },
    [current, isLast],
  );

  const handleAutoAdvance = useCallback(() => {
    if (!current) return;
    const value = answers[current.id];
    if (value !== undefined && value !== null && !isLast) {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentIndex((i) => i + 1);
      }, 380);
    }
  }, [current, answers, isLast]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (!current) return;

    // Validate required
    const value = answers[current.id];
    if (current.required && (value === undefined || value === null || value === "")) {
      setFieldError("Este campo es obligatorio");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Keyboard.dismiss();
    setFieldError(null);

    if (isLast) {
      handleSubmit();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (isFirst) {
      Alert.alert(
        "¿Salir de la encuesta?",
        "Tus respuestas parciales no se guardarán.",
        [
          { text: "Continuar llenando", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: () => router.back() },
        ],
      );
    } else {
      Keyboard.dismiss();
      setFieldError(null);
      setCurrentIndex((i) => i - 1);
    }
  };

  // ── Submission ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const versionId = Number(params.versionId ?? 0);
    if (!versionId) {
      Alert.alert("Error", "No se pudo identificar la encuesta.");
      return;
    }

    // Build answers array
    const answeredAt = new Date().toISOString();
    const answersPayload = visibleQuestions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== null)
      .map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id],
        answered_at: answeredAt,
      }));

    if (answersPayload.length === 0) {
      Alert.alert("Sin respuestas", "Por favor responde al menos una pregunta.");
      return;
    }

    setSubmitLoading(true);
    try {
      await submitBatchResponses({
        client_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        version_id: versionId,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        answers: answersPayload,
      });

      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.back();
      }, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message;
      Alert.alert(
        "No se pudo enviar",
        msg ??
          "Se guardará localmente y se enviará cuando tengas conexión.",
        [
          { text: "OK" },
        ],
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const currentValue = current ? answers[current.id] ?? null : null;

  if (allQuestions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Esta encuesta no tiene preguntas disponibles.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        <Text style={[styles.successTitle, { color: colors.text }]}>
          ¡Encuesta completada!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          Respuestas enviadas correctamente
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.cancelBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {params.surveyTitle ?? "Encuesta"}
          </Text>
        </View>

        {/* Spacer to balance the back button */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {currentIndex + 1} de {total}
        </Text>
      </View>

      {/* ── Question area ────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {current && (
          <>
            {/* Required badge */}
            {current.required && (
              <View style={[styles.requiredBadge, { backgroundColor: colors.overlay }]}>
                <Text style={[styles.requiredText, { color: colors.primary }]}>
                  Obligatoria
                </Text>
              </View>
            )}

            {/* Question label */}
            <Text style={[styles.questionLabel, { color: colors.text }]}>
              {current.label}
            </Text>

            {/* Optional description */}
            {current.description ? (
              <Text style={[styles.questionDescription, { color: colors.textSecondary }]}>
                {current.description}
              </Text>
            ) : null}

            {/* ── Question input ──────────────────────────────────────── */}
            <View style={styles.inputArea}>
              <QuestionInput
                question={current}
                value={currentValue}
                colors={colors}
                onChange={(val) => handleAnswer(val, false)}
                onAutoAdvance={
                  isAutoAdvanceType(current.type) ? handleAutoAdvance : undefined
                }
              />
            </View>

            {/* Field error */}
            {fieldError ? (
              <View
                style={[
                  styles.fieldErrorRow,
                  { backgroundColor: colors.error + "18" },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                  {fieldError}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* ── Bottom navigation ────────────────────────────────────────────── */}
      <View
        style={[
          styles.navBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: Platform.OS === "ios" ? 28 : 16,
          },
        ]}
      >
        {/* Back / Cancel */}
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.navBtnSecondary, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={[styles.navBtnSecondaryText, { color: colors.textSecondary }]}>
            {isFirst ? "Salir" : "Anterior"}
          </Text>
        </TouchableOpacity>

        {/* Next / Submit */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={submitLoading}
          style={[styles.navBtnPrimary, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.navBtnPrimaryText}>
                {isLast ? "Enviar" : "Siguiente"}
              </Text>
              <Ionicons
                name={isLast ? "send" : "arrow-forward"}
                size={18}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Question dispatcher ──────────────────────────────────────────────────────

interface QuestionInputProps {
  question: FillQuestion;
  value: any;
  colors: ReturnType<typeof useThemeColors>;
  onChange: (val: any) => void;
  onAutoAdvance?: () => void;
}

function QuestionInput({ question, value, colors, onChange, onAutoAdvance }: QuestionInputProps) {
  const { type } = question;

  const handleTap = (val: any) => {
    onChange(val);
    onAutoAdvance?.();
  };

  if (type === "yes_no" || type === "boolean") {
    return (
      <BooleanQuestion
        value={value}
        colors={colors}
        onChange={handleTap}
      />
    );
  }

  if (
    type === "single_choice" ||
    type === "select" ||
    type === "radio"
  ) {
    return (
      <SelectQuestion
        value={value}
        colors={colors}
        options={question.options}
        onChange={handleTap}
      />
    );
  }

  if (
    type === "multiple_choice" ||
    type === "multi_select" ||
    type === "checkbox"
  ) {
    return (
      <MultiSelectQuestion
        value={value}
        colors={colors}
        options={question.options}
        onChange={onChange}
      />
    );
  }

  if (
    type === "number" ||
    type === "slider" ||
    type === "scale" ||
    type === "rating"
  ) {
    return (
      <NumberQuestion
        value={value}
        colors={colors}
        onChange={onChange}
        min={type === "scale" ? 1 : type === "rating" ? 1 : undefined}
        max={type === "scale" ? 5 : type === "rating" ? 5 : undefined}
      />
    );
  }

  // text / textarea / email / phone / fallback
  return (
    <TextQuestionComp
      value={value}
      colors={colors}
      onChange={onChange}
      multiline={type === "textarea"}
      keyboardType={
        type === "email" ? "email-address" : type === "phone" ? "phone-pad" : "default"
      }
      maxLength={type === "textarea" ? 500 : 200}
      optional={!question.required}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500",
    minWidth: 46,
    textAlign: "right",
  },
  // Question
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    flexGrow: 1,
  },
  requiredBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  questionLabel: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    marginBottom: 8,
  },
  questionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputArea: {
    marginTop: 8,
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fieldErrorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Bottom nav
  navBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  navBtnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  navBtnPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  navBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
