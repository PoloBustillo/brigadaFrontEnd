/**
 * Re-exportar todos los tipos para fácil importación
 */

// Question types
export * from "../features/questions/types/question-base.types";
export * from "../features/questions/types/question-types.enum";

// Survey types
export * from "../features/surveys/types/survey.types";

// Survey Schema types (JSON format) - Exportar con alias para evitar conflictos
export type {
  Condition,
  ConditionalRule,
  IneOcrConfig,
  LocationConfig,
  Option,
  PhotoConfig,
  QuestionConfig,
  Question as QuestionJSON,
  QuestionMetadata,
  RatingConfig,
  ResponseMetadata,
  Section as SectionJSON,
  SelectConfig,
  SignatureConfig,
  SliderConfig,
  SurveyMetadata,
  SurveySchema as SurveySchemaJSON,
  SurveySettings,
  ValidationRules,
} from "./survey-schema.types";

export {
  ConditionalOperator,
  LogicalOperator,
  QuestionType as QuestionTypeJSON,
  compareVersions,
  isIneOcrConfig,
  isRatingConfig,
  isSelectConfig,
  isValidSemanticVersion,
} from "./survey-schema.types";

// Sync types
// NOTE: sync.types module not yet created — export removed to fix TS2307
