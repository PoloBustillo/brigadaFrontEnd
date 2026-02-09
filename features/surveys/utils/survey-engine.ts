import { Question } from "../../questions/types/question-base.types";
import {
  SurveyProgress,
  SurveySchema,
  SurveySection,
} from "../types/survey.types";

/**
 * Motor de encuestas - Lógica central para manejar el flujo de encuestas
 */
export class SurveyEngine {
  private schema: SurveySchema;
  private answers: Map<string, any>;

  constructor(schema: SurveySchema, existingAnswers?: Record<string, any>) {
    this.schema = schema;
    this.answers = new Map(Object.entries(existingAnswers || {}));
  }

  /**
   * Obtiene todas las secciones de la encuesta
   */
  getSections(): SurveySection[] {
    return [...this.schema.sections].sort((a, b) => a.order - b.order);
  }

  /**
   * Obtiene una sección específica por índice
   */
  getSection(index: number): SurveySection | null {
    const sections = this.getSections();
    return sections[index] || null;
  }

  /**
   * Obtiene todas las preguntas de una sección (respetando lógica condicional)
   */
  getVisibleQuestions(sectionIndex: number): Question[] {
    const section = this.getSection(sectionIndex);
    if (!section) return [];

    return section.questions.filter((question) =>
      this.shouldShowQuestion(question),
    );
  }

  /**
   * Verifica si una pregunta debe mostrarse según lógica condicional
   */
  shouldShowQuestion(question: Question): boolean {
    if (!question.conditionalLogic || question.conditionalLogic.length === 0) {
      return true;
    }

    // Todas las condiciones deben cumplirse (AND logic)
    return question.conditionalLogic.every((condition) => {
      const answer = this.answers.get(condition.questionId);

      switch (condition.operator) {
        case "equals":
          return answer === condition.value;
        case "not_equals":
          return answer !== condition.value;
        case "contains":
          return Array.isArray(answer) && answer.includes(condition.value);
        case "greater_than":
          return typeof answer === "number" && answer > condition.value;
        case "less_than":
          return typeof answer === "number" && answer < condition.value;
        default:
          return true;
      }
    });
  }

  /**
   * Guarda una respuesta
   */
  setAnswer(questionId: string, value: any): void {
    this.answers.set(questionId, value);
  }

  /**
   * Obtiene una respuesta
   */
  getAnswer(questionId: string): any {
    return this.answers.get(questionId);
  }

  /**
   * Obtiene todas las respuestas
   */
  getAllAnswers(): Record<string, any> {
    return Object.fromEntries(this.answers);
  }

  /**
   * Calcula el progreso de la encuesta
   */
  calculateProgress(): SurveyProgress {
    const sections = this.getSections();
    let totalQuestions = 0;
    let answeredQuestions = 0;

    sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (this.shouldShowQuestion(question)) {
          totalQuestions++;
          if (this.answers.has(question.id)) {
            answeredQuestions++;
          }
        }
      });
    });

    return {
      currentSection: 0, // Se actualiza externamente
      totalSections: sections.length,
      answeredQuestions,
      totalQuestions,
      percentage:
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  }

  /**
   * Valida si una sección está completa
   */
  isSectionComplete(sectionIndex: number): boolean {
    const questions = this.getVisibleQuestions(sectionIndex);

    return questions.every((question) => {
      if (!question.required) return true;
      const answer = this.answers.get(question.id);
      return answer !== undefined && answer !== null && answer !== "";
    });
  }

  /**
   * Valida si toda la encuesta está completa
   */
  isComplete(): boolean {
    const sections = this.getSections();
    return sections.every((_, index) => this.isSectionComplete(index));
  }

  /**
   * Obtiene preguntas faltantes por responder (solo requeridas)
   */
  getMissingRequiredQuestions(): Question[] {
    const missing: Question[] = [];
    const sections = this.getSections();

    sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (
          question.required &&
          this.shouldShowQuestion(question) &&
          !this.answers.has(question.id)
        ) {
          missing.push(question);
        }
      });
    });

    return missing;
  }
}
