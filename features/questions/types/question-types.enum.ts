/**
 * Enum de tipos de preguntas soportadas en el sistema de encuestas dinámicas
 * Valores sincronizados con el backend/CMS (backend QuestionType enum)
 */
export enum QuestionType {
  // Text inputs
  TEXT = "text",
  TEXTAREA = "textarea",
  EMAIL = "email",
  PHONE = "phone",
  // Numeric
  NUMBER = "number",
  SLIDER = "slider",
  SCALE = "scale",
  RATING = "rating",
  // Choice
  SINGLE_CHOICE = "single_choice",
  MULTIPLE_CHOICE = "multiple_choice",
  YES_NO = "yes_no",
  // Legacy aliases kept for backwards compat
  SELECT = "select",
  RADIO = "radio",
  MULTI_SELECT = "multi_select",
  CHECKBOX = "checkbox",
  // Date/Time
  DATE = "date",
  TIME = "time",
  DATETIME = "datetime",
  // Media & special
  PHOTO = "photo",
  FILE = "file",
  SIGNATURE = "signature",
  LOCATION = "location",
  INE_OCR = "ine_ocr",
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
