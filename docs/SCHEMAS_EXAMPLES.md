# 📋 Ejemplos de Schemas de Encuestas

Este documento muestra ejemplos concretos de schemas JSON para encuestas dinámicas.

---

## 📐 Schema Base (Estructura)

```typescript
type SurveySchema = {
  id: string; // UUID del servidor
  name: string; // "Censo Electoral 2024"
  description?: string; // Descripción opcional
  version: number; // 1, 2, 3...
  status: "draft" | "active" | "archived";

  schema: {
    version: number;
    title: string;
    description?: string;
    sections: Section[];
  };
};

type Section = {
  id: string; // "seccion_datos_personales"
  title: string; // "Datos Personales"
  description?: string; // Info adicional
  order: number; // Orden de visualización
  questions: Question[];
};

type Question = {
  id: string; // "nombre_completo"
  type: QuestionType;
  label: string; // "Nombre completo"
  description?: string; // Ayuda contextual
  required: boolean;
  order: number;
  validation?: ValidationRule;
  options?: Option[]; // Para select/multi_select
  conditional?: ConditionalRule;
};

type QuestionType =
  | "text" // Input de texto libre
  | "number" // Input numérico
  | "date" // Selector de fecha
  | "select" // Dropdown (una opción)
  | "multi_select" // Multiple checkboxes
  | "boolean" // Sí/No, Verdadero/Falso
  | "photo" // Captura de foto
  | "signature" // Canvas de firma
  | "ine"; // Captura de INE con OCR
```

---

## 📝 Ejemplo 1: Encuesta Simple de Datos Personales

```json
{
  "id": "enc_001",
  "name": "Registro de Beneficiarios",
  "version": 1,
  "status": "active",
  "schema": {
    "version": 1,
    "title": "Registro de Beneficiarios",
    "description": "Captura de datos básicos de beneficiarios",
    "sections": [
      {
        "id": "datos_personales",
        "title": "Datos Personales",
        "order": 1,
        "questions": [
          {
            "id": "nombre",
            "type": "text",
            "label": "Nombre(s)",
            "required": true,
            "order": 1,
            "validation": {
              "minLength": 2,
              "maxLength": 100,
              "pattern": "^[a-zA-ZÀ-ÿ\\s]+$"
            }
          },
          {
            "id": "apellido_paterno",
            "type": "text",
            "label": "Apellido Paterno",
            "required": true,
            "order": 2
          },
          {
            "id": "apellido_materno",
            "type": "text",
            "label": "Apellido Materno",
            "required": false,
            "order": 3
          },
          {
            "id": "fecha_nacimiento",
            "type": "date",
            "label": "Fecha de Nacimiento",
            "required": true,
            "order": 4,
            "validation": {
              "maxDate": "today",
              "minDate": "1900-01-01"
            }
          },
          {
            "id": "sexo",
            "type": "select",
            "label": "Sexo",
            "required": true,
            "order": 5,
            "options": [
              { "label": "Masculino", "value": "M" },
              { "label": "Femenino", "value": "F" },
              { "label": "Prefiero no decir", "value": "X" }
            ]
          }
        ]
      },
      {
        "id": "contacto",
        "title": "Información de Contacto",
        "order": 2,
        "questions": [
          {
            "id": "telefono",
            "type": "text",
            "label": "Teléfono",
            "required": true,
            "order": 1,
            "validation": {
              "pattern": "^[0-9]{10}$",
              "message": "Debe ser un teléfono de 10 dígitos"
            }
          },
          {
            "id": "email",
            "type": "text",
            "label": "Correo Electrónico",
            "required": false,
            "order": 2,
            "validation": {
              "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🏠 Ejemplo 2: Encuesta con Preguntas Condicionales

```json
{
  "id": "enc_002",
  "name": "Censo de Vivienda",
  "version": 1,
  "status": "active",
  "schema": {
    "version": 1,
    "title": "Censo de Vivienda",
    "sections": [
      {
        "id": "vivienda",
        "title": "Datos de la Vivienda",
        "order": 1,
        "questions": [
          {
            "id": "tiene_vivienda_propia",
            "type": "boolean",
            "label": "¿Tiene vivienda propia?",
            "required": true,
            "order": 1
          },
          {
            "id": "tipo_vivienda",
            "type": "select",
            "label": "Tipo de vivienda",
            "required": true,
            "order": 2,
            "options": [
              { "label": "Casa independiente", "value": "casa" },
              { "label": "Departamento", "value": "departamento" },
              { "label": "Cuarto de vecindad", "value": "vecindad" },
              { "label": "Otro", "value": "otro" }
            ]
          },
          {
            "id": "tipo_vivienda_otro",
            "type": "text",
            "label": "Especifique el tipo de vivienda",
            "required": true,
            "order": 3,
            "conditional": {
              "questionId": "tipo_vivienda",
              "operator": "equals",
              "value": "otro"
            }
          },
          {
            "id": "numero_habitantes",
            "type": "number",
            "label": "Número de habitantes",
            "required": true,
            "order": 4,
            "validation": {
              "min": 1,
              "max": 50
            }
          },
          {
            "id": "es_renta",
            "type": "boolean",
            "label": "¿Paga renta?",
            "required": true,
            "order": 5,
            "conditional": {
              "questionId": "tiene_vivienda_propia",
              "operator": "equals",
              "value": false
            }
          },
          {
            "id": "monto_renta",
            "type": "number",
            "label": "Monto de renta mensual (MXN)",
            "required": true,
            "order": 6,
            "validation": {
              "min": 0,
              "max": 1000000
            },
            "conditional": {
              "questionId": "es_renta",
              "operator": "equals",
              "value": true
            }
          },
          {
            "id": "servicios",
            "type": "multi_select",
            "label": "Servicios con los que cuenta",
            "required": true,
            "order": 7,
            "options": [
              { "label": "Agua potable", "value": "agua" },
              { "label": "Drenaje", "value": "drenaje" },
              { "label": "Electricidad", "value": "luz" },
              { "label": "Gas", "value": "gas" },
              { "label": "Internet", "value": "internet" },
              { "label": "Teléfono fijo", "value": "telefono" }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 📸 Ejemplo 3: Encuesta con Captura de INE y Foto

```json
{
  "id": "enc_003",
  "name": "Registro Electoral",
  "version": 1,
  "status": "active",
  "schema": {
    "version": 1,
    "title": "Registro Electoral 2024",
    "description": "Captura de datos y credencial de elector",
    "sections": [
      {
        "id": "identificacion",
        "title": "Identificación Oficial",
        "order": 1,
        "questions": [
          {
            "id": "ine_frente",
            "type": "ine",
            "label": "Credencial INE (Frente)",
            "description": "Tome una foto clara de la parte frontal de su INE",
            "required": true,
            "order": 1,
            "validation": {
              "ocrRequired": true,
              "minConfidence": 0.7
            }
          },
          {
            "id": "ine_reverso",
            "type": "photo",
            "label": "Credencial INE (Reverso)",
            "description": "Tome una foto de la parte trasera de su INE",
            "required": true,
            "order": 2
          }
        ]
      },
      {
        "id": "datos_ine",
        "title": "Datos del INE",
        "description": "Verifique que los datos extraídos sean correctos",
        "order": 2,
        "questions": [
          {
            "id": "curp",
            "type": "text",
            "label": "CURP",
            "required": true,
            "order": 1,
            "validation": {
              "pattern": "^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$",
              "message": "CURP inválido"
            }
          },
          {
            "id": "clave_elector",
            "type": "text",
            "label": "Clave de Elector",
            "required": true,
            "order": 2,
            "validation": {
              "pattern": "^[A-Z]{6}[0-9]{8}[HM][0-9]{3}$",
              "message": "Clave de elector inválida"
            }
          },
          {
            "id": "seccion_electoral",
            "type": "text",
            "label": "Sección Electoral",
            "required": true,
            "order": 3,
            "validation": {
              "pattern": "^[0-9]{4}$"
            }
          },
          {
            "id": "vigencia_ine",
            "type": "text",
            "label": "Vigencia",
            "required": true,
            "order": 4,
            "validation": {
              "pattern": "^[0-9]{4}$"
            }
          }
        ]
      },
      {
        "id": "domicilio",
        "title": "Domicilio",
        "order": 3,
        "questions": [
          {
            "id": "calle",
            "type": "text",
            "label": "Calle",
            "required": true,
            "order": 1
          },
          {
            "id": "numero_exterior",
            "type": "text",
            "label": "Número Exterior",
            "required": true,
            "order": 2
          },
          {
            "id": "numero_interior",
            "type": "text",
            "label": "Número Interior",
            "required": false,
            "order": 3
          },
          {
            "id": "colonia",
            "type": "text",
            "label": "Colonia",
            "required": true,
            "order": 4
          },
          {
            "id": "codigo_postal",
            "type": "text",
            "label": "Código Postal",
            "required": true,
            "order": 5,
            "validation": {
              "pattern": "^[0-9]{5}$"
            }
          },
          {
            "id": "municipio",
            "type": "text",
            "label": "Municipio",
            "required": true,
            "order": 6
          },
          {
            "id": "estado",
            "type": "select",
            "label": "Estado",
            "required": true,
            "order": 7,
            "options": [
              { "label": "Aguascalientes", "value": "AGS" },
              { "label": "Baja California", "value": "BC" },
              { "label": "Baja California Sur", "value": "BCS" },
              { "label": "Campeche", "value": "CAM" },
              { "label": "Chiapas", "value": "CHIS" },
              { "label": "Chihuahua", "value": "CHIH" },
              { "label": "Ciudad de México", "value": "CDMX" },
              { "label": "Coahuila", "value": "COAH" },
              { "label": "Colima", "value": "COL" },
              { "label": "Durango", "value": "DGO" },
              { "label": "Guanajuato", "value": "GTO" },
              { "label": "Guerrero", "value": "GRO" },
              { "label": "Hidalgo", "value": "HGO" },
              { "label": "Jalisco", "value": "JAL" },
              { "label": "Estado de México", "value": "MEX" },
              { "label": "Michoacán", "value": "MICH" },
              { "label": "Morelos", "value": "MOR" },
              { "label": "Nayarit", "value": "NAY" },
              { "label": "Nuevo León", "value": "NL" },
              { "label": "Oaxaca", "value": "OAX" },
              { "label": "Puebla", "value": "PUE" },
              { "label": "Querétaro", "value": "QRO" },
              { "label": "Quintana Roo", "value": "QROO" },
              { "label": "San Luis Potosí", "value": "SLP" },
              { "label": "Sinaloa", "value": "SIN" },
              { "label": "Sonora", "value": "SON" },
              { "label": "Tabasco", "value": "TAB" },
              { "label": "Tamaulipas", "value": "TAMPS" },
              { "label": "Tlaxcala", "value": "TLAX" },
              { "label": "Veracruz", "value": "VER" },
              { "label": "Yucatán", "value": "YUC" },
              { "label": "Zacatecas", "value": "ZAC" }
            ]
          }
        ]
      },
      {
        "id": "firma",
        "title": "Firma",
        "order": 4,
        "questions": [
          {
            "id": "firma_digital",
            "type": "signature",
            "label": "Firma del encuestado",
            "description": "Firme con su dedo en el recuadro",
            "required": true,
            "order": 1
          }
        ]
      }
    ]
  }
}
```

---

## 🔄 Ejemplo 4: Versionado de Schemas

### Versión 1 (Original)

```json
{
  "id": "enc_004",
  "name": "Apoyo Social",
  "version": 1,
  "status": "archived",
  "schema": {
    "version": 1,
    "title": "Programa de Apoyo Social",
    "sections": [
      {
        "id": "beneficiario",
        "title": "Datos del Beneficiario",
        "order": 1,
        "questions": [
          {
            "id": "nombre_completo",
            "type": "text",
            "label": "Nombre completo",
            "required": true,
            "order": 1
          },
          {
            "id": "ingreso_mensual",
            "type": "number",
            "label": "Ingreso mensual aproximado (MXN)",
            "required": true,
            "order": 2
          }
        ]
      }
    ]
  }
}
```

### Versión 2 (Agregamos campo de teléfono)

```json
{
  "id": "enc_004",
  "name": "Apoyo Social",
  "version": 2,
  "status": "active",
  "schema": {
    "version": 2,
    "title": "Programa de Apoyo Social",
    "sections": [
      {
        "id": "beneficiario",
        "title": "Datos del Beneficiario",
        "order": 1,
        "questions": [
          {
            "id": "nombre_completo",
            "type": "text",
            "label": "Nombre completo",
            "required": true,
            "order": 1
          },
          {
            "id": "telefono",
            "type": "text",
            "label": "Teléfono de contacto",
            "required": true,
            "order": 2,
            "validation": {
              "pattern": "^[0-9]{10}$"
            }
          },
          {
            "id": "ingreso_mensual",
            "type": "number",
            "label": "Ingreso mensual aproximado (MXN)",
            "required": true,
            "order": 3
          }
        ]
      }
    ]
  }
}
```

**Importante**: Las respuestas de la v1 siguen siendo válidas. El brigadista con v1 offline puede seguir trabajando mientras otros usan v2.

---

## 🔍 Reglas de Validación

### Tipos de Validación Soportados

```typescript
type ValidationRule = {
  // Para text
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex
  message?: string; // Mensaje custom de error

  // Para number
  min?: number;
  max?: number;

  // Para date
  minDate?: string | "today";
  maxDate?: string | "today";

  // Para photo/ine
  maxSizeKB?: number;
  minWidth?: number;
  minHeight?: number;

  // Para ine
  ocrRequired?: boolean;
  minConfidence?: number; // 0.0 a 1.0
};
```

---

## 🎨 UI Mapping

| Tipo de Pregunta | Componente React Native                         |
| ---------------- | ----------------------------------------------- |
| `text`           | `<TextInput />`                                 |
| `number`         | `<TextInput keyboardType="numeric" />`          |
| `date`           | `<DateTimePicker />`                            |
| `select`         | `<Picker />` o Modal con lista                  |
| `multi_select`   | Lista de `<Checkbox />`                         |
| `boolean`        | `<Switch />` o dos botones                      |
| `photo`          | `<Camera />` + Preview                          |
| `signature`      | Canvas (react-native-signature-canvas)          |
| `ine`            | `<Camera />` + OCR + Formulario de confirmación |

---

## ✅ Siguiente Paso

Estos schemas se almacenan en la tabla `survey_schemas` y se referencian al crear una `survey_response`.

**Próxima tarea**: Crear los componentes de UI para renderizar dinámicamente cada tipo de pregunta.
