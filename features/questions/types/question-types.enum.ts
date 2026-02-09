/**
 * Enum de tipos de preguntas soportadas en el sistema de encuestas dinámicas
 * Estos tipos se usan en el JSON schema de las encuestas
 */
export enum QuestionType {
  TEXT = "text",
  TEXTAREA = "textarea",
  NUMBER = "number",
  SELECT = "select",
  MULTI_SELECT = "multi_select",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  DATE = "date",
  TIME = "time",
  DATETIME = "datetime",
  RATING = "rating",
  SLIDER = "slider",
  LOCATION = "location",
  PHOTO = "photo",
  SIGNATURE = "signature",
  FILE = "file",
  YES_NO = "yes_no",
  SCALE = "scale",
}

/**
 * Tipos de validación disponibles
 */
export enum ValidationType {
  REQUIRED = "required",
  MIN_LENGTH = "min_length",
  MAX_LENGTH = "max_length",
  MIN = "min",
  MAX = "max",
  PATTERN = "pattern",
  EMAIL = "email",
  URL = "url",
  PHONE = "phone",
}
