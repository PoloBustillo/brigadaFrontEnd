# 📋 Survey Schema JSON - Especificación Técnica

## 🎯 Objetivo

Definir un formato JSON estándar para encuestas dinámicas versionadas que permita:

- ✅ Renderizado dinámico en la app móvil
- ✅ Validación declarativa sin código
- ✅ Lógica condicional simple
- ✅ Soporte para 18+ tipos de preguntas
- ✅ Versionado semántico
- ✅ Metadata automática

---

## 📐 Estructura del Schema

```typescript
interface SurveySchema {
  // Identificación y versionado
  id: string; // UUID único de la encuesta
  version: string; // Semantic versioning (1.0.0)
  title: string; // Título de la encuesta
  description?: string; // Descripción opcional

  // Metadata de la encuesta
  metadata: {
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    author: string; // Autor/creador
    category: string; // Categoría (censo, satisfacción, etc.)
    estimatedDuration: number; // Duración estimada en minutos
    tags: string[]; // Tags para búsqueda
  };

  // Configuración global
  settings: {
    allowPartialSave: boolean; // Permitir guardar incompleto
    requiresValidation: boolean; // Requiere validación por encargado
    enableGeolocation: boolean; // Capturar coordenadas GPS
    enablePhotos: boolean; // Permitir captura de fotos
    maxPhotos?: number; // Límite de fotos
    offlineMode: boolean; // Funciona 100% offline
  };

  // Secciones de la encuesta
  sections: Section[];
}

interface Section {
  id: string; // ID único de sección
  title: string; // Título de la sección
  description?: string; // Descripción opcional
  order: number; // Orden de la sección
  conditionalLogic?: ConditionalRule; // Reglas para mostrar sección
  questions: Question[]; // Preguntas de la sección
}

interface Question {
  id: string; // ID único de pregunta
  type: QuestionType; // Tipo de pregunta
  label: string; // Texto de la pregunta
  description?: string; // Ayuda/descripción
  required: boolean; // ¿Es obligatoria?
  order: number; // Orden dentro de la sección

  // Validación
  validation?: ValidationRules;

  // Lógica condicional
  conditionalLogic?: ConditionalRule;

  // Configuración específica por tipo
  config?: QuestionConfig;

  // Metadata
  metadata?: {
    category?: string; // Categoría de la pregunta
    tags?: string[]; // Tags para análisis
    helpUrl?: string; // URL a ayuda externa
  };
}

// Tipos de pregunta soportados
enum QuestionType {
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
  INE_OCR = "ine_ocr", // 🔥 Campo especial para INE
}

// Reglas de validación
interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // Regex pattern
  customMessage?: string; // Mensaje de error personalizado
  allowedExtensions?: string[]; // Para FILE type
  maxFileSize?: number; // En KB
}

// Reglas condicionales
interface ConditionalRule {
  operator: "AND" | "OR";
  conditions: Condition[];
}

interface Condition {
  questionId: string; // ID de la pregunta a evaluar
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty";
  value?: any; // Valor a comparar
}

// Configuración específica por tipo de pregunta
type QuestionConfig =
  | SelectConfig
  | RatingConfig
  | SliderConfig
  | LocationConfig
  | PhotoConfig
  | SignatureConfig
  | IneOcrConfig;

interface SelectConfig {
  options: Option[];
  allowOther?: boolean; // Permitir "Otro"
  otherLabel?: string;
}

interface Option {
  value: string;
  label: string;
  order: number;
}

interface RatingConfig {
  maxRating: number; // Ej: 5 estrellas
  icon?: "star" | "heart" | "thumb";
  labels?: {
    min?: string; // Label para valor mínimo
    max?: string; // Label para valor máximo
  };
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  showValue: boolean;
  unit?: string; // Ej: "km", "%", "años"
}

interface LocationConfig {
  enableMapPicker: boolean;
  accuracy: "high" | "medium" | "low";
  timeout: number; // Segundos
}

interface PhotoConfig {
  maxPhotos: number;
  quality: number; // 0-1
  allowGallery: boolean;
  allowCamera: boolean;
  requireCaption: boolean;
}

interface SignatureConfig {
  strokeColor: string;
  backgroundColor: string;
  penSize: number;
}

interface IneOcrConfig {
  enableOcr: boolean;
  captureMode: "front" | "back" | "both";
  autoPopulateFields: {
    name?: string; // ID de pregunta a poblar con nombre
    curp?: string;
    address?: string;
    birthdate?: string;
  };
  fallbackToManual: boolean; // Si OCR falla, capturar manual
}
```

---

## 🌟 Ejemplo 1: Encuesta de Censo Básica

```json
{
  "id": "censo-2026-v1",
  "version": "1.0.0",
  "title": "Censo Poblacional 2026",
  "description": "Levantamiento de información básica de hogares para el programa BRIGADA 2026",

  "metadata": {
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-01-20T14:30:00Z",
    "author": "Equipo BRIGADA - Coordinación Nacional",
    "category": "censo",
    "estimatedDuration": 15,
    "tags": ["censo", "hogar", "familia", "básico"]
  },

  "settings": {
    "allowPartialSave": true,
    "requiresValidation": true,
    "enableGeolocation": true,
    "enablePhotos": true,
    "maxPhotos": 5,
    "offlineMode": true
  },

  "sections": [
    {
      "id": "section-datos-generales",
      "title": "Datos Generales del Hogar",
      "description": "Información básica de la vivienda y contacto",
      "order": 1,
      "questions": [
        {
          "id": "q1-direccion",
          "type": "textarea",
          "label": "Dirección completa de la vivienda",
          "description": "Incluye calle, número, colonia, código postal",
          "required": true,
          "order": 1,
          "validation": {
            "minLength": 10,
            "maxLength": 200,
            "customMessage": "La dirección debe tener al menos 10 caracteres"
          }
        },
        {
          "id": "q2-num-habitantes",
          "type": "number",
          "label": "¿Cuántas personas habitan en esta vivienda?",
          "required": true,
          "order": 2,
          "validation": {
            "min": 1,
            "max": 30,
            "customMessage": "El número debe estar entre 1 y 30"
          }
        },
        {
          "id": "q3-tipo-vivienda",
          "type": "select",
          "label": "Tipo de vivienda",
          "required": true,
          "order": 3,
          "config": {
            "options": [
              { "value": "casa", "label": "Casa independiente", "order": 1 },
              { "value": "departamento", "label": "Departamento", "order": 2 },
              {
                "value": "vecindad",
                "label": "Vecindad/cuarto de azotea",
                "order": 3
              },
              { "value": "otro", "label": "Otro", "order": 4 }
            ],
            "allowOther": false
          }
        },
        {
          "id": "q4-ubicacion",
          "type": "location",
          "label": "Ubicación GPS de la vivienda",
          "description": "Presiona el botón para capturar coordenadas",
          "required": true,
          "order": 4,
          "config": {
            "enableMapPicker": true,
            "accuracy": "high",
            "timeout": 30
          }
        }
      ]
    },

    {
      "id": "section-jefe-hogar",
      "title": "Jefe(a) de Familia",
      "description": "Información del jefe o jefa del hogar",
      "order": 2,
      "questions": [
        {
          "id": "q5-nombre-completo",
          "type": "text",
          "label": "Nombre completo del jefe(a) de familia",
          "required": true,
          "order": 1,
          "validation": {
            "minLength": 5,
            "maxLength": 100
          }
        },
        {
          "id": "q6-edad",
          "type": "number",
          "label": "Edad",
          "required": true,
          "order": 2,
          "validation": {
            "min": 18,
            "max": 120,
            "customMessage": "El jefe de familia debe ser mayor de 18 años"
          }
        },
        {
          "id": "q7-genero",
          "type": "radio",
          "label": "Género",
          "required": true,
          "order": 3,
          "config": {
            "options": [
              { "value": "masculino", "label": "Masculino", "order": 1 },
              { "value": "femenino", "label": "Femenino", "order": 2 },
              {
                "value": "otro",
                "label": "Prefiero no especificar",
                "order": 3
              }
            ]
          }
        },
        {
          "id": "q8-telefono",
          "type": "phone",
          "label": "Número de teléfono",
          "description": "A 10 dígitos, sin espacios ni guiones",
          "required": true,
          "order": 4,
          "validation": {
            "pattern": "^[0-9]{10}$",
            "customMessage": "Debe ser un número de 10 dígitos"
          }
        },
        {
          "id": "q9-email",
          "type": "email",
          "label": "Correo electrónico (opcional)",
          "required": false,
          "order": 5,
          "validation": {
            "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            "customMessage": "Ingresa un correo válido"
          }
        }
      ]
    },

    {
      "id": "section-beneficios",
      "title": "Programas Sociales",
      "description": "Información sobre beneficios actuales",
      "order": 3,
      "questions": [
        {
          "id": "q10-recibe-apoyo",
          "type": "yes_no",
          "label": "¿Recibe actualmente algún apoyo de programas sociales?",
          "required": true,
          "order": 1
        },
        {
          "id": "q11-programas",
          "type": "multi_select",
          "label": "¿Qué programas recibe?",
          "description": "Selecciona todos los que apliquen",
          "required": true,
          "order": 2,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q10-recibe-apoyo",
                "operator": "equals",
                "value": true
              }
            ]
          },
          "config": {
            "options": [
              {
                "value": "pension-adultos",
                "label": "Pensión para Adultos Mayores",
                "order": 1
              },
              { "value": "becas", "label": "Becas Benito Juárez", "order": 2 },
              {
                "value": "sembrando-vida",
                "label": "Sembrando Vida",
                "order": 3
              },
              {
                "value": "jovenes",
                "label": "Jóvenes Construyendo el Futuro",
                "order": 4
              },
              { "value": "otro", "label": "Otro", "order": 5 }
            ],
            "allowOther": true,
            "otherLabel": "Especifica el programa"
          }
        }
      ]
    },

    {
      "id": "section-evidencia",
      "title": "Evidencia Fotográfica",
      "description": "Captura de fachada de la vivienda",
      "order": 4,
      "questions": [
        {
          "id": "q12-foto-fachada",
          "type": "photo",
          "label": "Foto de la fachada de la vivienda",
          "description": "Toma una foto clara de la fachada",
          "required": true,
          "order": 1,
          "config": {
            "maxPhotos": 2,
            "quality": 0.8,
            "allowGallery": false,
            "allowCamera": true,
            "requireCaption": false
          }
        }
      ]
    },

    {
      "id": "section-firma",
      "title": "Confirmación",
      "description": "Firma del encuestado",
      "order": 5,
      "questions": [
        {
          "id": "q13-firma",
          "type": "signature",
          "label": "Firma del jefe(a) de familia",
          "description": "Firma con tu dedo en el recuadro",
          "required": true,
          "order": 1,
          "config": {
            "strokeColor": "#000000",
            "backgroundColor": "#FFFFFF",
            "penSize": 3
          }
        }
      ]
    }
  ]
}
```

---

## 🌟 Ejemplo 2: Encuesta con Captura de INE + OCR

```json
{
  "id": "registro-completo-2026",
  "version": "2.0.0",
  "title": "Registro Ciudadano Completo",
  "description": "Registro con captura y validación automática de INE mediante OCR",

  "metadata": {
    "createdAt": "2026-02-01T08:00:00Z",
    "updatedAt": "2026-02-05T16:45:00Z",
    "author": "Equipo BRIGADA - Área de Tecnología",
    "category": "registro",
    "estimatedDuration": 10,
    "tags": ["registro", "ine", "ocr", "identificación"]
  },

  "settings": {
    "allowPartialSave": false,
    "requiresValidation": true,
    "enableGeolocation": true,
    "enablePhotos": true,
    "maxPhotos": 3,
    "offlineMode": true
  },

  "sections": [
    {
      "id": "section-ine",
      "title": "Captura de INE",
      "description": "Escaneo automático de credencial de elector",
      "order": 1,
      "questions": [
        {
          "id": "q1-ine-captura",
          "type": "ine_ocr",
          "label": "Credencial para Votar (INE/IFE)",
          "description": "Captura el frente y reverso de tu INE. Los datos se extraerán automáticamente.",
          "required": true,
          "order": 1,
          "config": {
            "enableOcr": true,
            "captureMode": "both",
            "autoPopulateFields": {
              "name": "q2-nombre-completo",
              "curp": "q3-curp",
              "address": "q4-direccion",
              "birthdate": "q5-fecha-nacimiento"
            },
            "fallbackToManual": true
          }
        }
      ]
    },

    {
      "id": "section-datos-personales",
      "title": "Verificación de Datos",
      "description": "Verifica que los datos extraídos sean correctos",
      "order": 2,
      "questions": [
        {
          "id": "q2-nombre-completo",
          "type": "text",
          "label": "Nombre completo",
          "description": "Verifica que el nombre sea correcto",
          "required": true,
          "order": 1,
          "validation": {
            "minLength": 5,
            "maxLength": 100
          },
          "metadata": {
            "category": "identidad",
            "tags": ["ocr-auto", "editable"]
          }
        },
        {
          "id": "q3-curp",
          "type": "text",
          "label": "CURP",
          "description": "Clave Única de Registro de Población",
          "required": true,
          "order": 2,
          "validation": {
            "pattern": "^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$",
            "customMessage": "CURP inválida. Debe tener 18 caracteres"
          },
          "metadata": {
            "category": "identidad",
            "tags": ["ocr-auto", "editable"]
          }
        },
        {
          "id": "q4-direccion",
          "type": "textarea",
          "label": "Dirección según INE",
          "description": "Dirección completa que aparece en la credencial",
          "required": true,
          "order": 3,
          "validation": {
            "minLength": 10,
            "maxLength": 200
          },
          "metadata": {
            "category": "domicilio",
            "tags": ["ocr-auto", "editable"]
          }
        },
        {
          "id": "q5-fecha-nacimiento",
          "type": "date",
          "label": "Fecha de nacimiento",
          "required": true,
          "order": 4,
          "validation": {
            "max": "2026-02-09",
            "customMessage": "La fecha no puede ser futura"
          },
          "metadata": {
            "category": "identidad",
            "tags": ["ocr-auto", "editable"]
          }
        }
      ]
    },

    {
      "id": "section-contacto",
      "title": "Información de Contacto",
      "order": 3,
      "questions": [
        {
          "id": "q6-telefono-movil",
          "type": "phone",
          "label": "Teléfono móvil",
          "description": "10 dígitos, sin espacios",
          "required": true,
          "order": 1,
          "validation": {
            "pattern": "^[0-9]{10}$",
            "customMessage": "Debe ser un número válido de 10 dígitos"
          }
        },
        {
          "id": "q7-email-personal",
          "type": "email",
          "label": "Correo electrónico",
          "required": true,
          "order": 2,
          "validation": {
            "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          }
        },
        {
          "id": "q8-whatsapp",
          "type": "yes_no",
          "label": "¿El teléfono tiene WhatsApp?",
          "required": true,
          "order": 3
        }
      ]
    },

    {
      "id": "section-evaluacion",
      "title": "Evaluación Socioeconómica",
      "order": 4,
      "questions": [
        {
          "id": "q9-ingresos-mensuales",
          "type": "slider",
          "label": "Ingresos mensuales aproximados del hogar",
          "description": "Desliza para seleccionar el rango",
          "required": true,
          "order": 1,
          "config": {
            "min": 0,
            "max": 50000,
            "step": 1000,
            "showValue": true,
            "unit": "MXN"
          }
        },
        {
          "id": "q10-nivel-estudios",
          "type": "select",
          "label": "Nivel máximo de estudios",
          "required": true,
          "order": 2,
          "config": {
            "options": [
              { "value": "sin-estudios", "label": "Sin estudios", "order": 1 },
              { "value": "primaria", "label": "Primaria", "order": 2 },
              { "value": "secundaria", "label": "Secundaria", "order": 3 },
              { "value": "preparatoria", "label": "Preparatoria", "order": 4 },
              { "value": "licenciatura", "label": "Licenciatura", "order": 5 },
              { "value": "posgrado", "label": "Posgrado", "order": 6 }
            ]
          }
        },
        {
          "id": "q11-satisfaccion",
          "type": "rating",
          "label": "¿Qué tan satisfecho estás con los servicios públicos en tu zona?",
          "required": true,
          "order": 3,
          "config": {
            "maxRating": 5,
            "icon": "star",
            "labels": {
              "min": "Muy insatisfecho",
              "max": "Muy satisfecho"
            }
          }
        }
      ]
    },

    {
      "id": "section-confirmacion",
      "title": "Confirmación y Firma",
      "order": 5,
      "questions": [
        {
          "id": "q12-acepta-terminos",
          "type": "checkbox",
          "label": "Términos y condiciones",
          "description": "Acepto que mis datos sean utilizados para fines del programa BRIGADA 2026",
          "required": true,
          "order": 1,
          "config": {
            "options": [
              {
                "value": "acepto",
                "label": "Acepto los términos y condiciones del programa",
                "order": 1
              }
            ]
          }
        },
        {
          "id": "q13-firma-digital",
          "type": "signature",
          "label": "Firma del titular",
          "description": "Firma con tu dedo en el recuadro para confirmar",
          "required": true,
          "order": 2,
          "config": {
            "strokeColor": "#1E3A8A",
            "backgroundColor": "#F3F4F6",
            "penSize": 2
          }
        }
      ]
    }
  ]
}
```

---

## 🌟 Ejemplo 3: Encuesta con Lógica Condicional Compleja

```json
{
  "id": "salud-familiar-2026",
  "version": "1.5.0",
  "title": "Encuesta de Salud Familiar",
  "description": "Evaluación de necesidades de salud con lógica condicional avanzada",

  "metadata": {
    "createdAt": "2026-01-10T12:00:00Z",
    "updatedAt": "2026-02-01T09:30:00Z",
    "author": "Secretaría de Salud - BRIGADA 2026",
    "category": "salud",
    "estimatedDuration": 20,
    "tags": ["salud", "familia", "médico", "condicional"]
  },

  "settings": {
    "allowPartialSave": true,
    "requiresValidation": false,
    "enableGeolocation": false,
    "enablePhotos": false,
    "offlineMode": true
  },

  "sections": [
    {
      "id": "section-composicion",
      "title": "Composición Familiar",
      "order": 1,
      "questions": [
        {
          "id": "q1-num-integrantes",
          "type": "number",
          "label": "¿Cuántas personas viven en tu hogar?",
          "required": true,
          "order": 1,
          "validation": {
            "min": 1,
            "max": 20
          }
        },
        {
          "id": "q2-hay-menores",
          "type": "yes_no",
          "label": "¿Hay menores de 18 años en el hogar?",
          "required": true,
          "order": 2
        },
        {
          "id": "q3-num-menores",
          "type": "number",
          "label": "¿Cuántos menores de 18 años?",
          "required": true,
          "order": 3,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q2-hay-menores",
                "operator": "equals",
                "value": true
              }
            ]
          },
          "validation": {
            "min": 1,
            "max": 15
          }
        },
        {
          "id": "q4-hay-adultos-mayores",
          "type": "yes_no",
          "label": "¿Hay adultos mayores de 65 años?",
          "required": true,
          "order": 4
        }
      ]
    },

    {
      "id": "section-servicios-salud",
      "title": "Acceso a Servicios de Salud",
      "order": 2,
      "questions": [
        {
          "id": "q5-tiene-seguro",
          "type": "yes_no",
          "label": "¿Cuentan con algún seguro médico?",
          "required": true,
          "order": 1
        },
        {
          "id": "q6-tipo-seguro",
          "type": "multi_select",
          "label": "¿Qué tipo de seguro médico tienen?",
          "description": "Selecciona todos los que apliquen",
          "required": true,
          "order": 2,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q5-tiene-seguro",
                "operator": "equals",
                "value": true
              }
            ]
          },
          "config": {
            "options": [
              { "value": "imss", "label": "IMSS", "order": 1 },
              { "value": "issste", "label": "ISSSTE", "order": 2 },
              { "value": "insabi", "label": "INSABI", "order": 3 },
              { "value": "privado", "label": "Seguro privado", "order": 4 },
              { "value": "otro", "label": "Otro", "order": 5 }
            ],
            "allowOther": true
          }
        },
        {
          "id": "q7-razon-sin-seguro",
          "type": "select",
          "label": "¿Por qué no cuentan con seguro médico?",
          "required": true,
          "order": 3,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q5-tiene-seguro",
                "operator": "equals",
                "value": false
              }
            ]
          },
          "config": {
            "options": [
              {
                "value": "no-conoce",
                "label": "No conoce los servicios disponibles",
                "order": 1
              },
              {
                "value": "tramites",
                "label": "Trámites complicados",
                "order": 2
              },
              { "value": "costo", "label": "No puede pagarlo", "order": 3 },
              {
                "value": "distancia",
                "label": "Clínicas muy lejos",
                "order": 4
              },
              {
                "value": "no-necesita",
                "label": "No lo considera necesario",
                "order": 5
              }
            ]
          }
        }
      ]
    },

    {
      "id": "section-salud-menores",
      "title": "Salud de Menores",
      "description": "Solo si hay menores en el hogar",
      "order": 3,
      "conditionalLogic": {
        "operator": "AND",
        "conditions": [
          {
            "questionId": "q2-hay-menores",
            "operator": "equals",
            "value": true
          }
        ]
      },
      "questions": [
        {
          "id": "q8-vacunas-completas",
          "type": "yes_no",
          "label": "¿Todos los menores tienen su esquema de vacunación completo?",
          "required": true,
          "order": 1
        },
        {
          "id": "q9-consultas-anuales",
          "type": "scale",
          "label": "En el último año, ¿cuántas veces llevaron a los menores a consulta médica?",
          "required": true,
          "order": 2,
          "config": {
            "min": 0,
            "max": 10,
            "step": 1,
            "showValue": true,
            "unit": "consultas"
          }
        }
      ]
    },

    {
      "id": "section-salud-adultos-mayores",
      "title": "Salud de Adultos Mayores",
      "description": "Solo si hay adultos mayores de 65 años",
      "order": 4,
      "conditionalLogic": {
        "operator": "AND",
        "conditions": [
          {
            "questionId": "q4-hay-adultos-mayores",
            "operator": "equals",
            "value": true
          }
        ]
      },
      "questions": [
        {
          "id": "q10-enfermedades-cronicas",
          "type": "multi_select",
          "label": "¿Qué enfermedades crónicas padecen los adultos mayores?",
          "description": "Selecciona todas las que apliquen",
          "required": true,
          "order": 1,
          "config": {
            "options": [
              { "value": "diabetes", "label": "Diabetes", "order": 1 },
              { "value": "hipertension", "label": "Hipertensión", "order": 2 },
              { "value": "artritis", "label": "Artritis", "order": 3 },
              {
                "value": "cardiaca",
                "label": "Enfermedad cardíaca",
                "order": 4
              },
              {
                "value": "respiratoria",
                "label": "Enfermedad respiratoria",
                "order": 5
              },
              { "value": "ninguna", "label": "Ninguna", "order": 6 }
            ]
          }
        },
        {
          "id": "q11-medicamentos-regulares",
          "type": "yes_no",
          "label": "¿Toman medicamentos de forma regular?",
          "required": true,
          "order": 2,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q10-enfermedades-cronicas",
                "operator": "not_equals",
                "value": ["ninguna"]
              }
            ]
          }
        }
      ]
    },

    {
      "id": "section-evaluacion-general",
      "title": "Evaluación General",
      "order": 5,
      "questions": [
        {
          "id": "q12-calidad-servicios",
          "type": "rating",
          "label": "Califica la calidad de los servicios de salud que has recibido",
          "required": true,
          "order": 1,
          "conditionalLogic": {
            "operator": "AND",
            "conditions": [
              {
                "questionId": "q5-tiene-seguro",
                "operator": "equals",
                "value": true
              }
            ]
          },
          "config": {
            "maxRating": 5,
            "icon": "star",
            "labels": {
              "min": "Muy mala",
              "max": "Excelente"
            }
          }
        },
        {
          "id": "q13-comentarios",
          "type": "textarea",
          "label": "Comentarios o necesidades adicionales",
          "description": "Describe cualquier necesidad específica de salud en tu hogar",
          "required": false,
          "order": 2,
          "validation": {
            "maxLength": 500
          }
        }
      ]
    }
  ]
}
```

---

## 🔧 Validaciones Declarativas Soportadas

| Regla           | Tipos de Pregunta  | Ejemplo                                     |
| --------------- | ------------------ | ------------------------------------------- |
| `minLength`     | text, textarea     | `{ "minLength": 5 }`                        |
| `maxLength`     | text, textarea     | `{ "maxLength": 100 }`                      |
| `min`           | number, slider     | `{ "min": 0 }`                              |
| `max`           | number, slider     | `{ "max": 100 }`                            |
| `pattern`       | text, email, phone | `{ "pattern": "^[0-9]{10}$" }`              |
| `allowedExts`   | file               | `{ "allowedExtensions": [".pdf", ".jpg"]}`  |
| `maxFileSize`   | file, photo        | `{ "maxFileSize": 5120 }` (KB)              |
| `customMessage` | Todos              | `{ "customMessage": "Error personalizado"}` |

---

## 🔀 Operadores Condicionales

| Operador       | Descripción             | Ejemplo                                     |
| -------------- | ----------------------- | ------------------------------------------- |
| `equals`       | Valor igual a           | `{ "operator": "equals", "value": true }`   |
| `not_equals`   | Valor diferente de      | `{ "operator": "not_equals", "value": 0 }`  |
| `contains`     | Array contiene valor    | `{ "operator": "contains", "value": "x" }`  |
| `not_contains` | Array no contiene valor | Similar a `contains`                        |
| `greater_than` | Mayor que (numérico)    | `{ "operator": "greater_than", "value": 5}` |
| `less_than`    | Menor que (numérico)    | `{ "operator": "less_than", "value": 10 }`  |
| `is_empty`     | Campo vacío             | `{ "operator": "is_empty" }`                |
| `is_not_empty` | Campo no vacío          | `{ "operator": "is_not_empty" }`            |

---

## 📊 Metadata Automática

Cada respuesta de encuesta captura automáticamente:

```json
{
  "response_metadata": {
    "started_at": "2026-02-09T10:30:00Z",
    "completed_at": "2026-02-09T10:45:00Z",
    "duration_seconds": 900,
    "device_info": {
      "platform": "android",
      "os_version": "13",
      "app_version": "1.0.0"
    },
    "geolocation": {
      "latitude": 19.4326,
      "longitude": -99.1332,
      "accuracy": 10,
      "captured_at": "2026-02-09T10:30:05Z"
    },
    "brigadista": {
      "user_id": "usr-123",
      "name": "Juan Pérez",
      "role": "brigadista"
    },
    "sync_status": "pending",
    "offline_mode": true,
    "validation_status": "pending",
    "validated_by": null,
    "validated_at": null
  }
}
```

---

## 🎨 Mejores Prácticas

### ✅ DO

1. **Usa IDs descriptivos**: `q1-nombre-completo` mejor que `q1`
2. **Agrupa preguntas relacionadas en secciones**
3. **Usa `conditionalLogic` para preguntas opcionales**
4. **Valida en el schema, no en código**: Aprovecha `validation`
5. **Incluye `description` para ayudar al usuario**
6. **Usa `metadata.tags` para análisis posterior**
7. **Versiona correctamente**: cambios mayores = major version

### ❌ DON'T

1. ❌ No uses IDs numéricos simples: `q1`, `q2`
2. ❌ No pongas todas las preguntas en una sección
3. ❌ No hardcodees validaciones en la app
4. ❌ No uses labels genéricos: "Pregunta 1"
5. ❌ No omitas validaciones importantes
6. ❌ No olvides versionar cambios breaking

---

## 🔄 Versionado Semántico

```
MAJOR.MINOR.PATCH

1.0.0 → 1.1.0   ✅ Agregar pregunta opcional (MINOR)
1.1.0 → 1.1.1   ✅ Corregir typo en label (PATCH)
1.1.1 → 2.0.0   ⚠️ Cambiar tipo de pregunta (MAJOR - breaking)
2.0.0 → 2.1.0   ✅ Agregar nueva sección opcional (MINOR)
```

---

## 📖 Uso en la App Móvil

```typescript
// 1. Descargar schema desde backend
const schema = await api.getSurveySchema('censo-2026-v1');

// 2. Cachear localmente en SQLite
await db.cacheSurveySchema(schema);

// 3. Inicializar SurveyEngine
const engine = new SurveyEngine(schema);

// 4. Renderizar dinámicamente con QuestionRenderer
<QuestionRenderer
  question={engine.getCurrentQuestion()}
  value={engine.getAnswer(questionId)}
  onChange={(value) => engine.setAnswer(questionId, value)}
/>

// 5. Validar antes de completar
const isValid = engine.validateAll();
if (!isValid) {
  const errors = engine.getValidationErrors();
  // Mostrar errores al usuario
}

// 6. Guardar respuesta
await db.saveResponse(engine.getResponse());
```

---

## 🚀 Próximos Pasos

1. Implementar parser del schema en la app
2. Crear QuestionRenderer para cada tipo
3. Implementar SurveyEngine con lógica condicional
4. Backend: API para CRUD de schemas
5. Backend: Versionado de schemas
6. Testing con schemas complejos

---

**📌 Resumen**: Este schema JSON permite crear encuestas dinámicas 100% configurables sin tocar código de la app. Soporta validaciones declarativas, lógica condicional, 18+ tipos de preguntas, y captura especial de INE con OCR.
