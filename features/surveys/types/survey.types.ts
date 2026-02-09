import { Question } from "../../questions/types/question-base.types";

/**
 * Sección de una encuesta
 */
export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

/**
 * Schema completo de una encuesta (estructura JSON)
 */
export interface SurveySchema {
  id: string;
  name: string;
  description?: string;
  version: number;
  sections: SurveySection[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Estado de una respuesta de encuesta
 */
export enum SurveyResponseStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SYNCED = "synced",
  ERROR = "error",
}

/**
 * Respuesta completa a una encuesta
 */
export interface SurveyResponse {
  id: string;
  schemaId: string;
  userId: string;
  status: SurveyResponseStatus;
  answers: Record<string, any>; // questionId -> value
  startedAt?: number;
  completedAt?: number;
  syncedAt?: number;
  duration?: number;
  locationCapturedAt?: { latitude: number; longitude: number };
  address?: string;
  deviceInfo?: Record<string, any>;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Progreso de una encuesta
 */
export interface SurveyProgress {
  currentSection: number;
  totalSections: number;
  answeredQuestions: number;
  totalQuestions: number;
  percentage: number;
}
