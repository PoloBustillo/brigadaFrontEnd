/**
 * useFillSurvey — manages draft persistence and answer state for the survey fill screen.
 * Extracted from app/(brigadista)/surveys/fill.tsx.
 *
 * Responsibilities:
 * - Create or resume an existing SQLite draft on mount
 * - Auto-save each answer to SQLite (fire-and-track)
 * - Expose failure counter and warning flag for the save-warning banner
 *
 * NOTE: Advance / navigation logic stays in the screen component because it depends
 * on derived values (visibleQuestions, currentIndex) that live there.
 */

import { offlineSyncService } from "@/lib/services/offline-sync";
import type { FillQuestion } from "@/types/survey-schema.types";
import type { User } from "@/types/user";
import { useCallback, useEffect, useRef, useState } from "react";

type Answers = Record<number, any>;

function shouldShowQuestion(q: FillQuestion, answers: Answers): boolean {
  if (!q.conditional) return true;
  const { questionId, operator, value } = q.conditional;
  const answer = answers[questionId];
  if (answer === undefined || answer === null) return false;
  if (operator === "equals") return String(answer) === String(value);
  if (operator === "not_equals") return String(answer) !== String(value);
  return true;
}

interface UseFillSurveyOptions {
  allQuestions: FillQuestion[];
  surveyId: string;
  versionId: string;
  user: User | null;
}

export function useFillSurvey({
  allQuestions,
  surveyId,
  versionId,
  user,
}: UseFillSurveyOptions) {
  const [answers, setAnswers] = useState<Answers>({});
  const [draftLoading, setDraftLoading] = useState(true);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const draftIdRef = useRef<string | null>(null);
  const saveFailCountRef = useRef(0);

  // ── Create / resume draft on mount ─────────────────────────────────────────
  useEffect(() => {
    if (allQuestions.length === 0) {
      setDraftLoading(false);
      return;
    }

    (async () => {
      try {
        const userId = user?.id ? String(user.id) : "anonymous";
        const sid = surveyId || versionId || "unknown";

        const drafts = await offlineSyncService.getDraftResponses(userId);
        const existingDraft = drafts.find(
          (d) => d.survey_id === sid && d.status === "draft",
        );

        if (existingDraft) {
          draftIdRef.current = existingDraft.response_id;
          try {
            const savedAnswers = JSON.parse(existingDraft.answers_json || "{}");
            const numericAnswers: Record<number, any> = {};
            for (const [key, val] of Object.entries(savedAnswers)) {
              numericAnswers[Number(key)] = val;
            }
            if (Object.keys(numericAnswers).length > 0) {
              setAnswers(numericAnswers);
              const visibleWithAnswers = allQuestions.filter((q) =>
                shouldShowQuestion(q, numericAnswers),
              );
              const firstUnanswered = visibleWithAnswers.findIndex(
                (q) => numericAnswers[q.id] === undefined,
              );
              if (firstUnanswered > 0) {
                setInitialIndex(firstUnanswered);
              } else if (
                firstUnanswered === -1 &&
                visibleWithAnswers.length > 0
              ) {
                setInitialIndex(visibleWithAnswers.length - 1);
              }
            }
          } catch {
            /* ignore JSON parse errors */
          }
          console.log("📋 Resumed draft:", existingDraft.response_id);
          setDraftLoading(false);
          return;
        }

        const id = await offlineSyncService.createDraftResponse({
          surveyId: sid,
          surveyVersion: versionId || "1",
          userId,
          userName: user?.name ?? "Brigadista",
          userRole: user?.role ?? "BRIGADISTA",
        });
        draftIdRef.current = id;
        console.log("💾 Draft created:", id);
      } catch (err) {
        console.error("⚠️ Failed to create/resume local draft:", err);
      } finally {
        setDraftLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allQuestions.length]);

  // ── Persistence helper ──────────────────────────────────────────────────────
  /**
   * Save a single answer to the local SQLite draft.
   * Fire-and-forget: tracks consecutive failures and raises showSaveWarning at ≥3.
   */
  const saveAnswer = useCallback((questionId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!draftIdRef.current) return;

    offlineSyncService
      .saveAnswer({ responseId: draftIdRef.current, questionId, value })
      .then(() => {
        saveFailCountRef.current = 0;
        setShowSaveWarning(false);
      })
      .catch(() => {
        saveFailCountRef.current += 1;
        if (saveFailCountRef.current >= 3) setShowSaveWarning(true);
      });
  }, []);

  return {
    answers,
    setAnswers,
    draftIdRef,
    draftLoading,
    showSaveWarning,
    saveAnswer,
    initialIndex,
  };
}
