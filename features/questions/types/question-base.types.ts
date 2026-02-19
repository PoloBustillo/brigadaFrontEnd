import { QuestionType, ValidationType } from "./question-types.enum";

/**
 * Regla de validación para una pregunta
 */
export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

/**
 * Lógica condicional para mostrar/ocultar preguntas
 */
export interface ConditionalLogic {
  questionId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
}

/**
 * Opción para preguntas de selección (select, radio, checkbox, etc)
 */
export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
  metadata?: Record<string, any>;
}

/**
 * Base común para todas las preguntas
 */
export interface QuestionBase {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  metadata?: Record<string, any>;
}

/**
 * Pregunta de texto corto
 */
export interface TextQuestion extends QuestionBase {
  type: QuestionType.TEXT;
  maxLength?: number;
}

/**
 * Pregunta de texto largo (textarea)
 */
export interface TextAreaQuestion extends QuestionBase {
  type: QuestionType.TEXTAREA;
  maxLength?: number;
  rows?: number;
}

/**
 * Pregunta numérica
 */
export interface NumberQuestion extends QuestionBase {
  type: QuestionType.NUMBER;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Pregunta de selección única (backend: single_choice)
 */
export interface SelectQuestion extends QuestionBase {
  type: QuestionType.SINGLE_CHOICE | QuestionType.SELECT | QuestionType.RADIO;
  options: QuestionOption[];
  allowOther?: boolean;
}

/**
 * Pregunta de selección múltiple (backend: multiple_choice)
 */
export interface MultiSelectQuestion extends QuestionBase {
  type: QuestionType.MULTIPLE_CHOICE | QuestionType.MULTI_SELECT | QuestionType.CHECKBOX;
  options: QuestionOption[];
  minSelections?: number;
  maxSelections?: number;
  allowOther?: boolean;
}

/**
 * Pregunta de fecha/hora
 */
export interface DateTimeQuestion extends QuestionBase {
  type: QuestionType.DATE | QuestionType.TIME | QuestionType.DATETIME;
  minDate?: string;
  maxDate?: string;
  defaultToNow?: boolean;
}

/**
 * Pregunta de calificación/rating
 */
export interface RatingQuestion extends QuestionBase {
  type: QuestionType.RATING;
  maxRating: number;
  icon?: "star" | "heart" | "thumb";
}

/**
 * Pregunta de slider
 */
export interface SliderQuestion extends QuestionBase {
  type: QuestionType.SLIDER;
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
}

/**
 * Pregunta de ubicación (GPS)
 */
export interface LocationQuestion extends QuestionBase {
  type: QuestionType.LOCATION;
  captureAddress?: boolean;
  requiredAccuracy?: number;
}

/**
 * Pregunta de foto
 */
export interface PhotoQuestion extends QuestionBase {
  type: QuestionType.PHOTO;
  maxPhotos?: number;
  quality?: number;
  allowGallery?: boolean;
}

/**
 * Pregunta de firma
 */
export interface SignatureQuestion extends QuestionBase {
  type: QuestionType.SIGNATURE;
}

/**
 * Pregunta de correo electrónico
 */
export interface EmailQuestion extends QuestionBase {
  type: QuestionType.EMAIL;
  maxLength?: number;
}

/**
 * Pregunta de teléfono
 */
export interface PhoneQuestion extends QuestionBase {
  type: QuestionType.PHONE;
  maxLength?: number;
}

/**
 * Pregunta de archivo
 */
export interface FileQuestion extends QuestionBase {
  type: QuestionType.FILE;
  acceptedTypes?: string[];
  maxSize?: number;
}

/**
 * Pregunta de captura INE (OCR)
 */
export interface IneOcrQuestion extends QuestionBase {
  type: QuestionType.INE_OCR;
}

/**
 * Unión de todos los tipos de preguntas
 */
export type Question =
  | TextQuestion
  | TextAreaQuestion
  | EmailQuestion
  | PhoneQuestion
  | NumberQuestion
  | SelectQuestion
  | MultiSelectQuestion
  | DateTimeQuestion
  | RatingQuestion
  | SliderQuestion
  | LocationQuestion
  | PhotoQuestion
  | SignatureQuestion
  | FileQuestion
  | IneOcrQuestion;

/**
 * Respuesta a una pregunta
 */
export interface QuestionAnswer {
  questionId: string;
  value: any;
  answeredAt: number;
  metadata?: Record<string, any>;
}
