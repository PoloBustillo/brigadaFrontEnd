import { create } from "zustand";
import {
  SurveyResponse,
  SurveyResponseStatus,
  SurveySchema,
} from "../features/surveys/types/survey.types";
import { SurveyEngine } from "../features/surveys/utils/survey-engine";

interface SurveyState {
  // Estado actual
  currentSchema: SurveySchema | null;
  currentResponse: SurveyResponse | null;
  currentSection: number;
  engine: SurveyEngine | null;

  // Acciones
  startSurvey: (schema: SurveySchema, userId: string) => void;
  resumeSurvey: (schema: SurveySchema, response: SurveyResponse) => void;
  setAnswer: (questionId: string, value: any) => void;
  nextSection: () => void;
  previousSection: () => void;
  goToSection: (index: number) => void;
  completeSurvey: () => void;
  resetSurvey: () => void;
}

/**
 * Store de Zustand para manejar el estado de encuestas en progreso
 */
export const useSurveyStore = create<SurveyState>((set, get) => ({
  currentSchema: null,
  currentResponse: null,
  currentSection: 0,
  engine: null,

  startSurvey: (schema: SurveySchema, userId: string) => {
    const response: SurveyResponse = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      schemaId: schema.id,
      userId,
      status: SurveyResponseStatus.IN_PROGRESS,
      answers: {},
      startedAt: Date.now(),
    };

    const engine = new SurveyEngine(schema, {});

    set({
      currentSchema: schema,
      currentResponse: response,
      currentSection: 0,
      engine,
    });
  },

  resumeSurvey: (schema: SurveySchema, response: SurveyResponse) => {
    const engine = new SurveyEngine(schema, response.answers);

    set({
      currentSchema: schema,
      currentResponse: response,
      currentSection: 0,
      engine,
    });
  },

  setAnswer: (questionId: string, value: any) => {
    const { engine, currentResponse } = get();
    if (!engine || !currentResponse) return;

    engine.setAnswer(questionId, value);

    set({
      currentResponse: {
        ...currentResponse,
        answers: engine.getAllAnswers(),
      },
    });
  },

  nextSection: () => {
    const { currentSection, currentSchema } = get();
    if (!currentSchema) return;

    const maxSection = currentSchema.sections.length - 1;
    if (currentSection < maxSection) {
      set({ currentSection: currentSection + 1 });
    }
  },

  previousSection: () => {
    const { currentSection } = get();
    if (currentSection > 0) {
      set({ currentSection: currentSection - 1 });
    }
  },

  goToSection: (index: number) => {
    const { currentSchema } = get();
    if (!currentSchema) return;

    const maxSection = currentSchema.sections.length - 1;
    if (index >= 0 && index <= maxSection) {
      set({ currentSection: index });
    }
  },

  completeSurvey: () => {
    const { currentResponse, engine } = get();
    if (!currentResponse || !engine) return;

    const duration = currentResponse.startedAt
      ? Date.now() - currentResponse.startedAt
      : undefined;

    set({
      currentResponse: {
        ...currentResponse,
        status: SurveyResponseStatus.COMPLETED,
        completedAt: Date.now(),
        duration,
        answers: engine.getAllAnswers(),
      },
    });
  },

  resetSurvey: () => {
    set({
      currentSchema: null,
      currentResponse: null,
      currentSection: 0,
      engine: null,
    });
  },
}));
