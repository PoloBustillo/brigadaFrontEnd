/**
 * Ejemplo de uso del Survey Schema
 *
 * Este archivo muestra cómo usar los tipos del schema JSON
 * para crear encuestas dinámicas.
 *
 * @see docs/SURVEY_SCHEMA.md para documentación completa
 */

import type { SurveySchemaJSON } from "@/types";
import {
  ConditionalOperator,
  LogicalOperator,
  QuestionTypeJSON,
} from "@/types";

// ============================================================================
// EJEMPLO 1: Schema Básico
// ============================================================================

export const basicSurveySchema: SurveySchemaJSON = {
  id: "ejemplo-basico-001",
  version: "1.0.0",
  title: "Encuesta de Ejemplo",
  description: "Ejemplo simple para demostrar el formato",

  metadata: {
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-09T10:00:00Z",
    author: "Equipo BRIGADA",
    category: "ejemplo",
    estimatedDuration: 5,
    tags: ["ejemplo", "básico"],
  },

  settings: {
    allowPartialSave: true,
    requiresValidation: false,
    enableGeolocation: true,
    enablePhotos: false,
    offlineMode: true,
  },

  sections: [
    {
      id: "section-1",
      title: "Información Personal",
      order: 1,
      questions: [
        {
          id: "q1-nombre",
          type: QuestionTypeJSON.TEXT,
          label: "¿Cuál es tu nombre completo?",
          required: true,
          order: 1,
          validation: {
            minLength: 3,
            maxLength: 100,
            customMessage: "El nombre debe tener entre 3 y 100 caracteres",
          },
        },
        {
          id: "q2-edad",
          type: QuestionTypeJSON.NUMBER,
          label: "¿Cuál es tu edad?",
          required: true,
          order: 2,
          validation: {
            min: 18,
            max: 120,
            customMessage: "Edad debe estar entre 18 y 120",
          },
        },
      ],
    },
  ],
};

// ============================================================================
// EJEMPLO 2: Schema con Lógica Condicional
// ============================================================================

export const conditionalSurveySchema: SurveySchemaJSON = {
  id: "ejemplo-condicional-001",
  version: "1.0.0",
  title: "Encuesta con Lógica Condicional",
  description: "Demuestra uso de conditionalLogic",

  metadata: {
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-09T10:00:00Z",
    author: "Equipo BRIGADA",
    category: "ejemplo",
    estimatedDuration: 10,
    tags: ["ejemplo", "condicional"],
  },

  settings: {
    allowPartialSave: true,
    requiresValidation: false,
    enableGeolocation: false,
    enablePhotos: false,
    offlineMode: true,
  },

  sections: [
    {
      id: "section-1",
      title: "Información Básica",
      order: 1,
      questions: [
        {
          id: "q1-tiene-auto",
          type: QuestionTypeJSON.YES_NO,
          label: "¿Tienes automóvil?",
          required: true,
          order: 1,
        },
        {
          id: "q2-marca-auto",
          type: QuestionTypeJSON.TEXT,
          label: "¿Qué marca es tu automóvil?",
          description: "Solo si respondiste sí a la pregunta anterior",
          required: true,
          order: 2,
          // 🔥 Esta pregunta solo aparece si q1-tiene-auto es true
          conditionalLogic: {
            operator: LogicalOperator.AND,
            conditions: [
              {
                questionId: "q1-tiene-auto",
                operator: ConditionalOperator.EQUALS,
                value: true,
              },
            ],
          },
        },
        {
          id: "q3-anio-auto",
          type: QuestionTypeJSON.NUMBER,
          label: "¿De qué año es tu automóvil?",
          required: true,
          order: 3,
          validation: {
            min: 1990,
            max: 2026,
          },
          // 🔥 También solo aparece si tiene auto
          conditionalLogic: {
            operator: LogicalOperator.AND,
            conditions: [
              {
                questionId: "q1-tiene-auto",
                operator: ConditionalOperator.EQUALS,
                value: true,
              },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================================================
// EJEMPLO 3: Schema con Diferentes Tipos de Preguntas
// ============================================================================

export const multiTypeSchema: SurveySchemaJSON = {
  id: "ejemplo-multitipo-001",
  version: "1.0.0",
  title: "Encuesta Multi-Tipo",
  description: "Demuestra diferentes tipos de preguntas",

  metadata: {
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-09T10:00:00Z",
    author: "Equipo BRIGADA",
    category: "ejemplo",
    estimatedDuration: 15,
    tags: ["ejemplo", "multi-tipo"],
  },

  settings: {
    allowPartialSave: true,
    requiresValidation: false,
    enableGeolocation: true,
    enablePhotos: true,
    maxPhotos: 3,
    offlineMode: true,
  },

  sections: [
    {
      id: "section-1",
      title: "Tipos de Preguntas",
      order: 1,
      questions: [
        // 1. SELECT
        {
          id: "q1-select",
          type: QuestionTypeJSON.SELECT,
          label: "Selecciona tu color favorito",
          required: true,
          order: 1,
          config: {
            options: [
              { value: "rojo", label: "Rojo", order: 1 },
              { value: "azul", label: "Azul", order: 2 },
              { value: "verde", label: "Verde", order: 3 },
            ],
          },
        },

        // 2. MULTI_SELECT
        {
          id: "q2-multi-select",
          type: QuestionTypeJSON.MULTI_SELECT,
          label: "Selecciona tus hobbies",
          description: "Puedes seleccionar varios",
          required: true,
          order: 2,
          config: {
            options: [
              { value: "leer", label: "Leer", order: 1 },
              { value: "deportes", label: "Deportes", order: 2 },
              { value: "musica", label: "Música", order: 3 },
              { value: "videojuegos", label: "Videojuegos", order: 4 },
            ],
            allowOther: true,
            otherLabel: "Otro hobby",
          },
        },

        // 3. RATING
        {
          id: "q3-rating",
          type: QuestionTypeJSON.RATING,
          label: "Califica nuestro servicio",
          required: true,
          order: 3,
          config: {
            maxRating: 5,
            icon: "star",
            labels: {
              min: "Muy malo",
              max: "Excelente",
            },
          },
        },

        // 4. SLIDER
        {
          id: "q4-slider",
          type: QuestionTypeJSON.SLIDER,
          label: "¿Cuántos kilómetros recorres al día?",
          required: true,
          order: 4,
          config: {
            min: 0,
            max: 100,
            step: 5,
            showValue: true,
            unit: "km",
          },
        },

        // 5. DATE
        {
          id: "q5-date",
          type: QuestionTypeJSON.DATE,
          label: "Fecha de nacimiento",
          required: true,
          order: 5,
          validation: {
            max: "2026-02-09",
            customMessage: "La fecha no puede ser futura",
          },
        },

        // 6. PHONE
        {
          id: "q6-phone",
          type: QuestionTypeJSON.PHONE,
          label: "Teléfono móvil",
          description: "10 dígitos sin espacios",
          required: true,
          order: 6,
          validation: {
            pattern: "^[0-9]{10}$",
            customMessage: "Debe ser un número de 10 dígitos",
          },
        },

        // 7. EMAIL
        {
          id: "q7-email",
          type: QuestionTypeJSON.EMAIL,
          label: "Correo electrónico",
          required: true,
          order: 7,
          validation: {
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          },
        },

        // 8. LOCATION
        {
          id: "q8-location",
          type: QuestionTypeJSON.LOCATION,
          label: "Ubicación actual",
          description: "Presiona para capturar GPS",
          required: false,
          order: 8,
          config: {
            enableMapPicker: true,
            accuracy: "high",
            timeout: 30,
          },
        },

        // 9. PHOTO
        {
          id: "q9-photo",
          type: QuestionTypeJSON.PHOTO,
          label: "Foto de tu hogar",
          required: false,
          order: 9,
          config: {
            maxPhotos: 2,
            quality: 0.8,
            allowGallery: true,
            allowCamera: true,
            requireCaption: false,
          },
        },

        // 10. SIGNATURE
        {
          id: "q10-signature",
          type: QuestionTypeJSON.SIGNATURE,
          label: "Firma de conformidad",
          description: "Firma con tu dedo",
          required: true,
          order: 10,
          config: {
            strokeColor: "#000000",
            backgroundColor: "#FFFFFF",
            penSize: 2,
          },
        },
      ],
    },
  ],
};

// ============================================================================
// EJEMPLO 4: Schema con INE + OCR
// ============================================================================

export const ineOcrSchema: SurveySchemaJSON = {
  id: "ejemplo-ine-ocr-001",
  version: "1.0.0",
  title: "Registro con INE",
  description: "Captura automática de datos desde INE",

  metadata: {
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-09T10:00:00Z",
    author: "Equipo BRIGADA",
    category: "registro",
    estimatedDuration: 8,
    tags: ["ine", "ocr", "registro"],
  },

  settings: {
    allowPartialSave: false,
    requiresValidation: true,
    enableGeolocation: true,
    enablePhotos: true,
    offlineMode: true,
  },

  sections: [
    {
      id: "section-ine",
      title: "Captura de INE",
      order: 1,
      questions: [
        // 🔥 Campo especial: INE con OCR
        {
          id: "q1-ine",
          type: QuestionTypeJSON.INE_OCR,
          label: "Credencial para Votar (INE)",
          description:
            "Captura frente y reverso. Los datos se extraerán automáticamente.",
          required: true,
          order: 1,
          config: {
            enableOcr: true,
            captureMode: "both",
            // 🎯 Campos que se poblarán automáticamente
            autoPopulateFields: {
              name: "q2-nombre",
              curp: "q3-curp",
              address: "q4-direccion",
              birthdate: "q5-fecha-nacimiento",
            },
            fallbackToManual: true,
          },
        },
      ],
    },

    {
      id: "section-verificacion",
      title: "Verificación de Datos",
      description: "Verifica que los datos extraídos sean correctos",
      order: 2,
      questions: [
        {
          id: "q2-nombre",
          type: QuestionTypeJSON.TEXT,
          label: "Nombre completo",
          description: "Auto-poblado desde INE. Verifica que sea correcto.",
          required: true,
          order: 1,
          validation: {
            minLength: 5,
            maxLength: 100,
          },
          metadata: {
            tags: ["ocr-auto", "editable"],
          },
        },
        {
          id: "q3-curp",
          type: QuestionTypeJSON.TEXT,
          label: "CURP",
          description: "Auto-poblado desde INE",
          required: true,
          order: 2,
          validation: {
            pattern: "^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$",
            customMessage: "CURP inválida (18 caracteres)",
          },
          metadata: {
            tags: ["ocr-auto", "editable"],
          },
        },
        {
          id: "q4-direccion",
          type: QuestionTypeJSON.TEXTAREA,
          label: "Dirección según INE",
          required: true,
          order: 3,
          validation: {
            minLength: 10,
            maxLength: 200,
          },
          metadata: {
            tags: ["ocr-auto", "editable"],
          },
        },
        {
          id: "q5-fecha-nacimiento",
          type: QuestionTypeJSON.DATE,
          label: "Fecha de nacimiento",
          required: true,
          order: 4,
          validation: {
            max: "2026-02-09",
          },
          metadata: {
            tags: ["ocr-auto", "editable"],
          },
        },
      ],
    },
  ],
};

// ============================================================================
// FUNCIÓN DE UTILIDAD: Validar Schema
// ============================================================================

/**
 * Valida que un schema JSON tenga la estructura correcta
 *
 * @param schema - Schema a validar
 * @returns true si es válido, false si no
 */
export function validateSurveySchema(schema: any): schema is SurveySchemaJSON {
  // Validaciones básicas
  if (!schema.id || typeof schema.id !== "string") return false;
  if (!schema.version || typeof schema.version !== "string") return false;
  if (!schema.title || typeof schema.title !== "string") return false;
  if (!schema.metadata || typeof schema.metadata !== "object") return false;
  if (!schema.settings || typeof schema.settings !== "object") return false;
  if (!Array.isArray(schema.sections)) return false;

  // Validar versión semántica
  if (!/^\d+\.\d+\.\d+$/.test(schema.version)) return false;

  // Validar que tenga al menos una sección
  if (schema.sections.length === 0) return false;

  // Validar cada sección
  for (const section of schema.sections) {
    if (!section.id || !section.title || !Array.isArray(section.questions)) {
      return false;
    }

    // Validar que tenga al menos una pregunta
    if (section.questions.length === 0) return false;

    // Validar cada pregunta
    for (const question of section.questions) {
      if (!question.id || !question.type || !question.label) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Ejemplo de uso de validación
 */
export function testSchemaValidation() {
  console.log("✅ basicSurveySchema:", validateSurveySchema(basicSurveySchema));
  console.log(
    "✅ conditionalSurveySchema:",
    validateSurveySchema(conditionalSurveySchema),
  );
  console.log("✅ multiTypeSchema:", validateSurveySchema(multiTypeSchema));
  console.log("✅ ineOcrSchema:", validateSurveySchema(ineOcrSchema));

  // Schema inválido
  const invalidSchema = { id: "test" }; // Falta todo
  console.log("❌ invalidSchema:", validateSurveySchema(invalidSchema));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  basicSurveySchema,
  conditionalSurveySchema,
  multiTypeSchema,
  ineOcrSchema,
  validateSurveySchema,
  testSchemaValidation,
};
