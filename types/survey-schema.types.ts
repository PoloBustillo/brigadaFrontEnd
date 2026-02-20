/**
 * Survey Schema Types
 *
 * Tipos TypeScript para el schema JSON de encuestas dinámicas.
 *
 * @see docs/SURVEY_SCHEMA.md para documentación completa
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Tipos de pregunta soportados
 *
 * @see docs/SURVEY_SCHEMA.md - Sección "QuestionType enum"
 */
export enum QuestionType {
  TEXT = "text",
  TEXTAREA = "textarea",
  NUMBER = "number",
  EMAIL = "email",
  PHONE = "phone",
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
  INE_OCR = "ine_ocr", // 🔥 Campo especial para captura de INE con OCR
}

/**
 * Operadores para lógica condicional
 */
export enum ConditionalOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  IS_EMPTY = "is_empty",
  IS_NOT_EMPTY = "is_not_empty",
}

/**
 * Operadores lógicos para combinar condiciones
 */
export enum LogicalOperator {
  AND = "AND",
  OR = "OR",
}

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Schema completo de una encuesta
 *
 * @example
 * ```json
 * {
 *   "id": "censo-2026-v1",
 *   "version": "1.0.0",
 *   "title": "Censo Poblacional 2026",
 *   "sections": [...]
 * }
 * ```
 */
export interface SurveySchema {
  /** UUID único de la encuesta */
  id: string;

  /** Versión semántica (major.minor.patch) */
  version: string;

  /** Título de la encuesta */
  title: string;

  /** Descripción opcional */
  description?: string;

  /** Metadata de la encuesta */
  metadata: SurveyMetadata;

  /** Configuración global */
  settings: SurveySettings;

  /** Secciones de la encuesta */
  sections: Section[];
}

/**
 * Metadata de la encuesta
 */
export interface SurveyMetadata {
  /** Fecha de creación (ISO 8601) */
  createdAt: string;

  /** Fecha de última actualización (ISO 8601) */
  updatedAt: string;

  /** Autor/creador de la encuesta */
  author: string;

  /** Categoría (censo, satisfacción, salud, etc.) */
  category: string;

  /** Duración estimada en minutos */
  estimatedDuration: number;

  /** Tags para búsqueda y categorización */
  tags: string[];
}

/**
 * Configuración global de la encuesta
 */
export interface SurveySettings {
  /** Permitir guardar respuesta incompleta */
  allowPartialSave: boolean;

  /** Requiere validación por encargado */
  requiresValidation: boolean;

  /** Capturar coordenadas GPS automáticamente */
  enableGeolocation: boolean;

  /** Permitir captura de fotos */
  enablePhotos: boolean;

  /** Límite máximo de fotos (opcional) */
  maxPhotos?: number;

  /** Funciona 100% offline */
  offlineMode: boolean;
}

/**
 * Sección de la encuesta
 *
 * Agrupa preguntas relacionadas
 */
export interface Section {
  /** ID único de la sección */
  id: string;

  /** Título de la sección */
  title: string;

  /** Descripción opcional */
  description?: string;

  /** Orden de la sección (1-based) */
  order: number;

  /** Reglas para mostrar/ocultar esta sección */
  conditionalLogic?: ConditionalRule;

  /** Preguntas de esta sección */
  questions: Question[];
}

/**
 * Pregunta individual
 *
 * @see docs/SURVEY_SCHEMA.md para ejemplos completos
 */
export interface Question {
  /** ID único de la pregunta */
  id: string;

  /** Tipo de pregunta */
  type: QuestionType;

  /** Texto de la pregunta */
  label: string;

  /** Ayuda/descripción adicional */
  description?: string;

  /** ¿Es obligatoria? */
  required: boolean;

  /** Orden dentro de la sección (1-based) */
  order: number;

  /** Reglas de validación */
  validation?: ValidationRules;

  /** Lógica condicional para mostrar/ocultar */
  conditionalLogic?: ConditionalRule;

  /** Configuración específica según el tipo */
  config?: QuestionConfig;

  /** Metadata adicional */
  metadata?: QuestionMetadata;
}

/**
 * Metadata opcional de la pregunta
 */
export interface QuestionMetadata {
  /** Categoría de la pregunta */
  category?: string;

  /** Tags para análisis */
  tags?: string[];

  /** URL a ayuda externa */
  helpUrl?: string;
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Reglas de validación declarativas
 *
 * @example
 * ```json
 * {
 *   "minLength": 5,
 *   "maxLength": 100,
 *   "pattern": "^[a-zA-Z]+$",
 *   "customMessage": "Solo letras permitidas"
 * }
 * ```
 */
export interface ValidationRules {
  /** Longitud mínima (text, textarea) */
  minLength?: number;

  /** Longitud máxima (text, textarea) */
  maxLength?: number;

  /** Valor mínimo (number, slider) */
  min?: number;

  /** Valor máximo (number, slider) */
  max?: number;

  /** Regex pattern para validación */
  pattern?: string;

  /** Mensaje de error personalizado */
  customMessage?: string;

  /** Extensiones permitidas (file) */
  allowedExtensions?: string[];

  /** Tamaño máximo en KB (file, photo) */
  maxFileSize?: number;
}

// ============================================================================
// LÓGICA CONDICIONAL
// ============================================================================

/**
 * Regla condicional para mostrar/ocultar preguntas o secciones
 *
 * @example
 * ```json
 * {
 *   "operator": "AND",
 *   "conditions": [
 *     { "questionId": "q1", "operator": "equals", "value": true },
 *     { "questionId": "q2", "operator": "greater_than", "value": 18 }
 *   ]
 * }
 * ```
 */
export interface ConditionalRule {
  /** Operador lógico para combinar condiciones */
  operator: LogicalOperator;

  /** Lista de condiciones a evaluar */
  conditions: Condition[];
}

/**
 * Condición individual
 */
export interface Condition {
  /** ID de la pregunta a evaluar */
  questionId: string;

  /** Operador de comparación */
  operator: ConditionalOperator;

  /** Valor a comparar (opcional para is_empty, is_not_empty) */
  value?: any;
}

// ============================================================================
// CONFIGURACIONES POR TIPO DE PREGUNTA
// ============================================================================

/**
 * Configuración específica según el tipo de pregunta
 *
 * Union type que incluye todas las configuraciones posibles
 */
export type QuestionConfig =
  | SelectConfig
  | RatingConfig
  | SliderConfig
  | LocationConfig
  | PhotoConfig
  | SignatureConfig
  | IneOcrConfig;

/**
 * Configuración para preguntas de tipo SELECT, MULTI_SELECT, RADIO, CHECKBOX
 */
export interface SelectConfig {
  /** Opciones disponibles */
  options: Option[];

  /** Permitir opción "Otro" */
  allowOther?: boolean;

  /** Label para la opción "Otro" */
  otherLabel?: string;
}

/**
 * Opción individual para selects
 */
export interface Option {
  /** Valor interno */
  value: string;

  /** Label visible al usuario */
  label: string;

  /** Orden de la opción */
  order: number;
}

/**
 * Configuración para preguntas de tipo RATING
 */
export interface RatingConfig {
  /** Máximo rating (ej: 5 estrellas) */
  maxRating: number;

  /** Ícono a usar */
  icon?: "star" | "heart" | "thumb";

  /** Labels opcionales */
  labels?: {
    /** Label para valor mínimo */
    min?: string;

    /** Label para valor máximo */
    max?: string;
  };
}

/**
 * Configuración para preguntas de tipo SLIDER
 */
export interface SliderConfig {
  /** Valor mínimo */
  min: number;

  /** Valor máximo */
  max: number;

  /** Incremento */
  step: number;

  /** Mostrar valor actual */
  showValue: boolean;

  /** Unidad de medida (ej: "km", "%", "años") */
  unit?: string;
}

/**
 * Configuración para preguntas de tipo LOCATION
 */
export interface LocationConfig {
  /** Habilitar selector en mapa */
  enableMapPicker: boolean;

  /** Precisión requerida */
  accuracy: "high" | "medium" | "low";

  /** Timeout en segundos */
  timeout: number;
}

/**
 * Configuración para preguntas de tipo PHOTO
 */
export interface PhotoConfig {
  /** Número máximo de fotos */
  maxPhotos: number;

  /** Calidad de la imagen (0-1) */
  quality: number;

  /** Permitir seleccionar desde galería */
  allowGallery: boolean;

  /** Permitir captura con cámara */
  allowCamera: boolean;

  /** Requiere descripción/caption */
  requireCaption: boolean;
}

/**
 * Configuración para preguntas de tipo SIGNATURE
 */
export interface SignatureConfig {
  /** Color del trazo */
  strokeColor: string;

  /** Color de fondo */
  backgroundColor: string;

  /** Grosor del trazo */
  penSize: number;
}

/**
 * Configuración para preguntas de tipo INE_OCR
 *
 * Campo especial para captura de INE con OCR automático
 *
 * @example
 * ```json
 * {
 *   "enableOcr": true,
 *   "captureMode": "both",
 *   "autoPopulateFields": {
 *     "name": "q2-nombre-completo",
 *     "curp": "q3-curp",
 *     "address": "q4-direccion",
 *     "claveElector": "q5-clave-elector",
 *     "seccion": "q6-seccion",
 *     "distrito": "q7-distrito",
 *     "estado": "q8-estado",
 *     "registro": "q9-registro",
 *     "birthdate": "q10-fecha-nacimiento",
 *     "sex": "q11-sexo"
 *   },
 *   "fallbackToManual": true
 * }
 * ```
 */
export interface IneOcrConfig {
  /** Habilitar OCR automático */
  enableOcr: boolean;

  /** Modo de captura */
  captureMode: "front" | "back" | "both";

  /** Mapeo de campos a poblar automáticamente desde el INE */
  autoPopulateFields: {
    /** ID de pregunta para nombre completo */
    name?: string;

    /** ID de pregunta para CURP */
    curp?: string;

    /** ID de pregunta para dirección */
    address?: string;

    /** ID de pregunta para fecha de nacimiento */
    birthdate?: string;

    /** ID de pregunta para clave de elector (18 dígitos) */
    claveElector?: string;

    /** ID de pregunta para sección electoral */
    seccion?: string;

    /** ID de pregunta para distrito electoral (federal o local) */
    distrito?: string;

    /** ID de pregunta para estado (entidad federativa) */
    estado?: string;

    /** ID de pregunta para año de registro */
    registro?: string;

    /** ID de pregunta para sexo (H/M) */
    sex?: string;

    /** ID de pregunta para municipio */
    municipio?: string;

    /** ID de pregunta para localidad */
    localidad?: string;

    /** ID de pregunta para emisión (año de emisión de la credencial) */
    emision?: string;

    /** ID de pregunta para vigencia (año de vigencia) */
    vigencia?: string;

    /** Otros campos personalizados */
    [key: string]: string | undefined;
  };

  /** Si OCR falla, permitir captura manual */
  fallbackToManual: boolean;
}

// ============================================================================
// RESPUESTAS DE ENCUESTAS
// ============================================================================

/**
 * Respuesta completa de una encuesta
 *
 * Formato JSON inmutable para guardar respuestas de encuestas.
 * Una vez guardada, no se puede modificar (solo crear nueva versión).
 *
 * @example
 * ```json
 * {
 *   "id": "resp-uuid-1234",
 *   "surveyId": "censo-2026-v1",
 *   "surveyVersion": "1.0.0",
 *   "status": "completed",
 *   "answers": {
 *     "q1-nombre": { "questionId": "q1-nombre", "value": "Juan Pérez", "answeredAt": "2026-02-09T10:30:00Z" },
 *     "q2-edad": { "questionId": "q2-edad", "value": 35, "answeredAt": "2026-02-09T10:30:15Z" }
 *   },
 *   "metadata": { ... },
 *   "createdAt": "2026-02-09T10:30:00Z",
 *   "completedAt": "2026-02-09T10:35:00Z",
 *   "immutable": true
 * }
 * ```
 */
export interface SurveyResponse {
  /** UUID único de la respuesta (inmutable) */
  id: string;

  /** ID de la encuesta respondida */
  surveyId: string;

  /** Versión exacta del schema usado (major.minor.patch) */
  surveyVersion: string;

  /** Estado de la respuesta */
  status: "draft" | "completed" | "validated" | "rejected";

  /** Mapa de respuestas por questionId */
  answers: Record<string, Answer>;

  /** Metadata automática de la respuesta */
  metadata: ResponseMetadata;

  /** Fecha/hora de creación (ISO 8601) - inmutable */
  createdAt: string;

  /** Fecha/hora de última modificación (ISO 8601) */
  updatedAt: string;

  /** Fecha/hora de completado (ISO 8601) */
  completedAt: string | null;

  /** Fecha/hora de validación (ISO 8601) */
  validatedAt: string | null;

  /** Marca de inmutabilidad (true = no se puede editar) */
  immutable: boolean;

  /** Hash de integridad (SHA-256 de todo el objeto) */
  integrityHash?: string;
}

/**
 * Respuesta individual a una pregunta
 *
 * @example
 * ```json
 * {
 *   "questionId": "q1-nombre",
 *   "questionType": "text",
 *   "value": "Juan Pérez",
 *   "answeredAt": "2026-02-09T10:30:00Z",
 *   "metadata": {
 *     "editCount": 2,
 *     "timeSpentSeconds": 15
 *   }
 * }
 * ```
 */
export interface Answer {
  /** ID de la pregunta respondida */
  questionId: string;

  /** Tipo de pregunta (para validación) */
  questionType: QuestionType;

  /** Valor de la respuesta (tipo depende de questionType) */
  value: AnswerValue;

  /** Fecha/hora en que se respondió (ISO 8601) */
  answeredAt: string;

  /** Metadata adicional de la respuesta */
  metadata?: AnswerMetadata;
}

/**
 * Valor de respuesta (union type según el tipo de pregunta)
 */
export type AnswerValue =
  | string // TEXT, TEXTAREA, EMAIL, PHONE, DATE, TIME, DATETIME
  | number // NUMBER, RATING, SLIDER
  | boolean // YES_NO, CHECKBOX (individual)
  | string[] // MULTI_SELECT, CHECKBOX (multiple)
  | FileAnswer // PHOTO, SIGNATURE, FILE, INE_OCR
  | LocationAnswer // LOCATION
  | null; // Sin respuesta

/**
 * Respuesta para preguntas de tipo archivo/foto/firma
 */
export interface FileAnswer {
  /** URI local del archivo */
  uri: string;

  /** Tipo MIME */
  mimeType: string;

  /** Tamaño en bytes */
  size: number;

  /** Nombre del archivo */
  filename: string;

  /** URL remota (después de sincronizar) */
  remoteUrl?: string;

  /** Caption/descripción opcional */
  caption?: string;

  /** Thumbnail/preview (base64 o URI) */
  thumbnail?: string;

  /** Datos OCR extraídos (solo para INE_OCR) */
  ocrData?: IneOcrData;
}

/**
 * Datos extraídos del INE mediante OCR
 */
export interface IneOcrData {
  /** Nombre completo */
  name?: string;

  /** CURP */
  curp?: string;

  /** Dirección */
  address?: string;

  /** Fecha de nacimiento (ISO 8601) */
  birthdate?: string;

  /** Clave de elector */
  claveElector?: string;

  /** Sección electoral */
  seccion?: string;

  /** Distrito electoral */
  distrito?: string;

  /** Estado */
  estado?: string;

  /** Año de registro */
  registro?: string;

  /** Sexo (H/M) */
  sex?: string;

  /** Municipio */
  municipio?: string;

  /** Localidad */
  localidad?: string;

  /** Año de emisión */
  emision?: string;

  /** Año de vigencia */
  vigencia?: string;

  /** Nivel de confianza del OCR (0-1) */
  confidence: number;

  /** Timestamp de procesamiento OCR */
  processedAt: string;
}

/**
 * Respuesta para preguntas de tipo LOCATION
 */
export interface LocationAnswer {
  /** Latitud */
  latitude: number;

  /** Longitud */
  longitude: number;

  /** Precisión en metros */
  accuracy: number;

  /** Altitud (opcional) */
  altitude?: number;

  /** Dirección formateada (geocoding inverso) */
  address?: string;

  /** Timestamp de captura */
  capturedAt: string;
}

/**
 * Metadata adicional de una respuesta individual
 */
export interface AnswerMetadata {
  /** Número de veces que se editó */
  editCount: number;

  /** Tiempo invertido en responder (segundos) */
  timeSpentSeconds: number;

  /** Fue auto-poblado por OCR */
  autoPopulated?: boolean;

  /** ID de la pregunta que auto-pobló este valor */
  autoPopulatedFrom?: string;

  /** La respuesta fue validada manualmente */
  manuallyValidated?: boolean;

  /** Notas del brigadista */
  notes?: string;
}

// ============================================================================
// METADATA DE RESPUESTAS
// ============================================================================

/**
 * Metadata automática capturada con cada respuesta
 *
 * @see docs/SURVEY_SCHEMA.md - Sección "Metadata Automática"
 */
export interface ResponseMetadata {
  /** Fecha/hora de inicio (ISO 8601) */
  started_at: string;

  /** Fecha/hora de completado (ISO 8601) */
  completed_at: string;

  /** Duración en segundos */
  duration_seconds: number;

  /** Información del dispositivo */
  device_info: {
    platform: "android" | "ios" | "web";
    os_version: string;
    app_version: string;
  };

  /** Geolocalización capturada */
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    captured_at: string;
  };

  /** Información del brigadista */
  brigadista: {
    user_id: string;
    name: string;
    role: string;
  };

  /** Estado de sincronización */
  sync_status: "pending" | "syncing" | "synced" | "error";

  /** Modo offline */
  offline_mode: boolean;

  /** Estado de validación */
  validation_status: "pending" | "validated" | "rejected";

  /** Validado por (user_id) */
  validated_by: string | null;

  /** Fecha de validación */
  validated_at: string | null;
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

/**
 * Type guard para verificar si una config es SelectConfig
 */
export function isSelectConfig(config: QuestionConfig): config is SelectConfig {
  return "options" in config;
}

/**
 * Type guard para verificar si una config es RatingConfig
 */
export function isRatingConfig(config: QuestionConfig): config is RatingConfig {
  return "maxRating" in config;
}

/**
 * Type guard para verificar si una config es IneOcrConfig
 */
export function isIneOcrConfig(config: QuestionConfig): config is IneOcrConfig {
  return "enableOcr" in config && "captureMode" in config;
}

/**
 * Validar versión semántica
 */
export function isValidSemanticVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Comparar versiones semánticas
 *
 * @returns -1 si v1 < v2, 0 si v1 === v2, 1 si v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ─── Fill-screen question model ───────────────────────────────────────────────

/**
 * Normalised question data used throughout the survey fill flow.
 * Derived from the API QuestionResponse and stored in the fill screen + hook.
 */
export interface FillQuestion {
  id: number;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  options: { label: string; value: string }[];
  conditional?: {
    questionId: number;
    operator: "equals" | "not_equals";
    value: any;
  };
}

export default {
  QuestionType,
  ConditionalOperator,
  LogicalOperator,
  isSelectConfig,
  isRatingConfig,
  isIneOcrConfig,
  isValidSemanticVersion,
  compareVersions,
};
