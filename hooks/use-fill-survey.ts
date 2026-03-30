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
  const hasUserInteractedRef = useRef(false);
  const pendingAnswersRef = useRef<Record<number, any>>({});

  // ── Create / resume draft on mount ─────────────────────────────────────────
  useEffect(() => {
    if (allQuestions.length === 0) {
      setDraftLoading(false);
      return;
    }

    (async () => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const flushPendingAnswers = async () => {
        if (!draftIdRef.current) return;

        const pending = { ...pendingAnswersRef.current };
        const entries = Object.entries(pending);
        if (entries.length === 0) return;

        for (const [questionId, value] of entries) {
          try {
            await offlineSyncService.saveAnswer({
              responseId: draftIdRef.current,
              questionId: Number(questionId),
              value,
            });
            delete pendingAnswersRef.current[Number(questionId)];
          } catch {
            // Keep unsaved pending values for future attempts.
          }
        }
      };

      const isDbLockedError = (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        return /database is locked|database is busy|SQLITE_BUSY|finalizeAsync/i.test(
          message,
        );
      };

      const initializeDraft = async () => {
        const userId = user?.id ? String(user.id) : "unknown-user";
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
            if (
              Object.keys(numericAnswers).length > 0 &&
              !hasUserInteractedRef.current
            ) {
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
          await flushPendingAnswers();
          console.log("📋 Resumed draft:", existingDraft.response_id);
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
        await flushPendingAnswers();
        console.log("💾 Draft created:", id);
      };

      let uiReleasedByTimeout = false;
      const releaseUiTimer = setTimeout(() => {
        uiReleasedByTimeout = true;
        setDraftLoading(false);
        setShowSaveWarning(true);
      }, 2200);

      try {
        const maxAttempts = 4;
        let initialized = false;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            await initializeDraft();
            initialized = true;
            break;
          } catch (err) {
            const isLock = isDbLockedError(err);
            const hasMore = attempt < maxAttempts;

            if (!isLock || !hasMore) {
              throw err;
            }

            const delayMs = Math.min(120 * Math.pow(2, attempt - 1), 900);
            console.warn(
              `⏳ SQLite locked while create/resume draft (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`,
            );
            await sleep(delayMs);
          }
        }

        if (!initialized) {
          throw new Error("Could not initialize local draft after retries");
        }

        setShowSaveWarning(false);
      } catch (err) {
        console.error("⚠️ Failed to create/resume local draft:", err);
        setShowSaveWarning(true);
      } finally {
        clearTimeout(releaseUiTimer);
        if (!uiReleasedByTimeout) {
          setDraftLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allQuestions.length]);

  // ── Persistence helper ──────────────────────────────────────────────────────
  /**
   * Discard the entire draft (user pressed Cancel).
   * Deletes the SQLite record and resets state.
   */
  const discardDraft = useCallback(async () => {
    if (draftIdRef.current) {
      await offlineSyncService.deleteDraft(draftIdRef.current);
      draftIdRef.current = null;
    }
    setAnswers({});
  }, []);

  /**
   * Save a single answer to the local SQLite draft.
   * Fire-and-forget: tracks consecutive failures and raises showSaveWarning at ≥3.
   */
  const saveAnswer = useCallback((questionId: number, value: any) => {
    hasUserInteractedRef.current = true;
    pendingAnswersRef.current[questionId] = value;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!draftIdRef.current) return;

    offlineSyncService
      .saveAnswer({ responseId: draftIdRef.current, questionId, value })
      .then(() => {
        delete pendingAnswersRef.current[questionId];
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
    discardDraft,
    initialIndex,
  };
}
