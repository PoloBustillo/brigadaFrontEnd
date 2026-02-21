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
import { DateQuestion } from "@/components/survey/date-question";
import { INEQuestion } from "@/components/survey/ine-question";
import { MultiSelectQuestion } from "@/components/survey/multi-select-question";
import { NumberQuestion } from "@/components/survey/number-question";
import { PhotoQuestion } from "@/components/survey/photo-question";
import { SelectQuestion } from "@/components/survey/select-question";
import { SignatureQuestion } from "@/components/survey/signature-question";
import { TextQuestion as TextQuestionComp } from "@/components/survey/text-question";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useFillSurvey } from "@/hooks/use-fill-survey";
import type { AnswerOptionResponse, QuestionResponse } from "@/lib/api/mobile";
import { offlineSyncService } from "@/lib/services/offline-sync";
import type { FillQuestion } from "@/types/survey-schema.types";
import { getErrorMessage } from "@/utils/translate-error";
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
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Internal types ───────────────────────────────────────────────────────────

// Re-export so any existing consumers importing FillQuestion from this file keep working.
export type { FillQuestion } from "@/types/survey-schema.types";

type Answers = Record<number, any>; // questionId → value

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AUTO_ADVANCE_TYPES = new Set([
  "yes_no",
  "boolean",
  "single_choice",
  "select",
  "radio",
]);

/** Question types that use a text input and should auto-focus keyboard */
const TEXT_INPUT_TYPES = new Set(["text", "textarea", "email", "phone"]);

/** Validators by question type — return error string or null */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-() ]{7,20}$/;

function validateAnswer(
  type: string,
  value: any,
  required: boolean,
): string | null {
  // Required check (all types)
  if (required && (value === undefined || value === null || value === "")) {
    return "Este campo es obligatorio";
  }

  // If optional and empty, no further validation
  if (!required && (value === undefined || value === null || value === "")) {
    return null;
  }

  switch (type) {
    case "email":
      if (typeof value === "string" && !EMAIL_RE.test(value)) {
        return "Ingresa un correo electrónico válido";
      }
      break;
    case "phone":
      if (typeof value === "string" && !PHONE_RE.test(value)) {
        return "Ingresa un número de teléfono válido (7-20 dígitos)";
      }
      break;
    case "text":
      if (typeof value === "string" && value.trim().length < 2) {
        return "La respuesta debe tener al menos 2 caracteres";
      }
      break;
    case "number":
    case "slider":
    case "scale":
    case "rating":
      if (typeof value !== "number" || isNaN(value)) {
        return "Ingresa un número válido";
      }
      break;
    case "multiple_choice":
    case "multi_select":
    case "checkbox":
      if (required && Array.isArray(value) && value.length === 0) {
        return "Selecciona al menos una opción";
      }
      break;
  }

  return null;
}

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addPendingItem, isOnline } = useSync();
  const params = useLocalSearchParams<{
    surveyTitle: string;
    surveyId: string;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncedOnSubmit, setSyncedOnSubmit] = useState(false);

  // ── Offline draft management (via hook) ────────────────────────────────────
  const {
    answers,
    setAnswers,
    draftIdRef,
    draftLoading,
    showSaveWarning,
    saveAnswer,
    discardDraft,
    initialIndex,
  } = useFillSurvey({
    allQuestions,
    surveyId: params.surveyId ?? "",
    versionId: params.versionId ?? "",
    user,
  });

  // When a draft is resumed, jump to the saved position
  useEffect(() => {
    if (initialIndex > 0) setCurrentIndex(initialIndex);
  }, [initialIndex]);

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

  // Android hardware back button → same as handleBack
  useEffect(() => {
    if (Platform.OS !== "android" || showSuccess) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true; // prevent default
    });
    return () => sub.remove();
  }, [isFirst, showSuccess]);

  // Countdown: remaining questions
  const remaining = total - currentIndex - 1;
  const showCountdown = remaining > 0 && remaining <= 3;

  // ── Answer handling ────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (value: any, advance = false) => {
      setFieldError(null);
      if (!current) return;

      // Persist answer to SQLite draft (state update is inside saveAnswer)
      saveAnswer(current.id, value);

      if (advance && !isLast) {
        // Slight delay so user sees their selection highlighted before moving
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCurrentIndex((i) => i + 1);
        }, 380);
      }
    },
    [current, isLast, saveAnswer],
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

    // Type-specific validation
    const value = answers[current.id];
    const error = validateAnswer(current.type, value, current.required);
    if (error) {
      setFieldError(error);
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

  const handleCancel = () => {
    Alert.alert(
      "¿Cancelar encuesta?",
      "Se descartarán todas las respuestas ingresadas.",
      [
        { text: "Seguir llenando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            await discardDraft();
            router.back();
          },
        },
      ],
    );
  };

  const handleBack = () => {
    if (isFirst) {
      handleCancel();
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
      Alert.alert(
        "Sin respuestas",
        "Por favor responde al menos una pregunta.",
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const responseId = draftIdRef.current ?? "no-draft";

      const result = await offlineSyncService.submitResponse({
        responseId,
        versionId,
        startedAt,
        answers: answersPayload,
      });

      if (result.synced) {
        // Online — sent to server
        setSyncedOnSubmit(true);
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Offline — saved locally, will sync later
        addPendingItem({
          id: responseId,
          type: "response",
        });
        setSyncedOnSubmit(false);
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      Alert.alert("No se pudo enviar", msg, [{ text: "OK" }]);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const currentValue = current ? (answers[current.id] ?? null) : null;

  if (allQuestions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Esta encuesta no tiene preguntas disponibles.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backBtnText, { color: "#fff" }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (draftLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Cargando encuesta...
        </Text>
      </View>
    );
  }

  if (showSuccess) {
    const answeredCount = Object.keys(answers).filter(
      (k) => answers[Number(k)] !== undefined && answers[Number(k)] !== null,
    ).length;
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons
          name={syncedOnSubmit ? "checkmark-circle" : "cloud-offline-outline"}
          size={80}
          color={
            syncedOnSubmit ? colors.success : (colors.warning ?? "#f59e0b")
          }
        />
        <Text style={[styles.successTitle, { color: colors.text }]}>
          ¡Encuesta completada!
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          {params.surveyTitle ?? "Encuesta"}
        </Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          {answeredCount} respuesta{answeredCount !== 1 ? "s" : ""}{" "}
          {syncedOnSubmit
            ? "enviadas correctamente"
            : "guardadas localmente — se enviarán con conexión"}
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={[styles.backBtnText, { color: "#fff" }]}>
            Volver a encuestas
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.cancelBtn}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {params.surveyTitle ?? "Encuesta"}
          </Text>
        </View>

        {/* Cancel — discards all answers */}
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelBtn}
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      <View
        style={[styles.progressContainer, { backgroundColor: colors.surface }]}
      >
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
        {showCountdown && (
          <Text style={[styles.countdownText, { color: colors.success }]}>
            {remaining === 1
              ? "¡Última pregunta!"
              : `¡Solo faltan ${remaining} preguntas!`}
          </Text>
        )}
      </View>

      {/* ── Offline banner ──────────────────────────────────────────────── */}
      {!isOnline && (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: colors.warning ?? "#f59e0b" },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>
            Sin conexión — las respuestas se guardan localmente
          </Text>
        </View>
      )}

      {/* ── Auto-save failure warning ─────────────────────────────────── */}
      {showSaveWarning && (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: colors.error ?? "#ef4444" },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>
            No se pudo guardar automáticamente. Tus respuestas podrían perderse.
          </Text>
        </View>
      )}

      {/* ── Question area ────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {current && (
          <>
            {/* Required badge */}
            {current.required && (
              <View
                style={[
                  styles.requiredBadge,
                  { backgroundColor: colors.overlay },
                ]}
              >
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
              <Text
                style={[
                  styles.questionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {current.description}
              </Text>
            ) : null}

            {/* ── Question input ──────────────────────────────────────── */}
            <View style={styles.inputArea}>
              <QuestionInput
                key={current.id}
                question={current}
                value={currentValue}
                colors={colors}
                onChange={(val) => handleAnswer(val, false)}
                onAutoAdvance={
                  isAutoAdvanceType(current.type)
                    ? handleAutoAdvance
                    : undefined
                }
                autoFocus={TEXT_INPUT_TYPES.has(current.type)}
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
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.error}
                />
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
            paddingBottom: Math.max(insets.bottom, 16),
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
          <Text
            style={[
              styles.navBtnSecondaryText,
              { color: colors.textSecondary },
            ]}
          >
            {isFirst ? "Salir" : "Anterior"}
          </Text>
        </TouchableOpacity>

        {/* Next / Submit */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={submitLoading}
          style={[
            styles.navBtnPrimary,
            {
              backgroundColor: isLast ? colors.success : colors.primary,
            },
          ]}
          activeOpacity={0.85}
        >
          {submitLoading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <Text
                style={[styles.navBtnPrimaryText, { color: colors.background }]}
              >
                {isLast ? "Enviar" : "Siguiente"}
              </Text>
              <Ionicons
                name={isLast ? "send" : "arrow-forward"}
                size={18}
                color={colors.background}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Question dispatcher ──────────────────────────────────────────────────────

interface QuestionInputProps {
  question: FillQuestion;
  value: any;
  colors: ReturnType<typeof useThemeColors>;
  onChange: (val: any) => void;
  onAutoAdvance?: () => void;
  autoFocus?: boolean;
}

function QuestionInput({
  question,
  value,
  colors,
  onChange,
  onAutoAdvance,
  autoFocus,
}: QuestionInputProps) {
  const { type } = question;

  const handleTap = (val: any) => {
    onChange(val);
    onAutoAdvance?.();
  };

  if (type === "yes_no" || type === "boolean") {
    return (
      <BooleanQuestion value={value} colors={colors} onChange={handleTap} />
    );
  }

  if (type === "single_choice" || type === "select" || type === "radio") {
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

  if (type === "date" || type === "datetime" || type === "time") {
    return <DateQuestion value={value} colors={colors} onChange={onChange} />;
  }

  if (type === "photo" || type === "image" || type === "file") {
    return <PhotoQuestion value={value} colors={colors} onChange={onChange} />;
  }

  if (type === "ine" || type === "ine_ocr" || type === "credential") {
    return <INEQuestion value={value} colors={colors} onChange={onChange} />;
  }

  if (type === "signature") {
    return (
      <SignatureQuestion value={value} colors={colors} onChange={onChange} />
    );
  }

  if (type === "location") {
    // TODO: implement LocationQuestion with expo-location
    return (
      <TextQuestionComp
        value={value}
        colors={colors}
        onChange={onChange}
        multiline={false}
        keyboardType="default"
        maxLength={200}
        optional={!question.required}
        autoFocus={false}
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
        type === "email"
          ? "email-address"
          : type === "phone"
            ? "phone-pad"
            : "default"
      }
      maxLength={type === "textarea" ? 500 : 200}
      optional={!question.required}
      autoFocus={autoFocus}
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
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "700",
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
  countdownText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 2,
  },
  // Question
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
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
  },
  // Offline banner
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
