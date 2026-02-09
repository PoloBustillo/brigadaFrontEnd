# 🚀 BRIGADA - Cheatsheet Rápido

## 📝 Comandos Esenciales

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web

# Linting
npm run lint
```

---

## 🗄️ Database Snippets

### Inicializar DB

```typescript
import { initDatabase } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrations";

// En app/_layout.tsx
useEffect(() => {
  initDatabase();
  runMigrations();
}, []);
```

### Crear Encuesta

```typescript
import { SurveyRepository } from "@/lib/repositories/survey-repository";

const responseId = await SurveyRepository.createResponse({
  schemaId: "schema-uuid",
  schemaVersion: 1,
  collectedBy: userId,
  latitude: 19.4326,
  longitude: -99.1332,
});
```

### Guardar Respuesta

```typescript
await SurveyRepository.saveQuestionAnswer({
  responseId: "response-uuid",
  questionId: "nombre",
  questionPath: "datos.nombre",
  questionType: "text",
  value: "Juan Pérez",
});
```

### Completar Encuesta

```typescript
await SurveyRepository.completeResponse(responseId);
```

### Listar Encuestas

```typescript
const surveys = await SurveyRepository.listResponses(userId);
// Filtrar por estado
const completed = await SurveyRepository.listResponses(userId, "completed");
```

---

## 🎨 UI Snippets

### Renderizar Pregunta Dinámica

```tsx
import { QuestionRenderer } from "@/components/survey/question-renderer";

<QuestionRenderer
  question={question}
  responseId={responseId}
  onAnswerSaved={() => {
    console.log("Respuesta guardada");
  }}
/>;
```

### Pregunta de Texto

```tsx
import { TextQuestion } from "@/components/survey/text-question";

<TextQuestion
  value={value}
  onChange={(newValue) => handleChange(newValue)}
  question={question}
/>;
```

### Pregunta Booleana

```tsx
import { BooleanQuestion } from "@/components/survey/boolean-question";

<BooleanQuestion
  value={value}
  onChange={(newValue) => handleChange(newValue)}
  question={question}
/>;
```

---

## 🔧 Utilidades

### Generar UUID

```typescript
import { generateId } from "@/lib/utils";

const id = generateId(); // '550e8400-e29b-41d4-a716-446655440000'
```

### Validar Email

```typescript
import { isValidEmail } from "@/lib/utils";

if (isValidEmail("test@example.com")) {
  // Válido
}
```

### Validar CURP

```typescript
import { isValidCURP } from "@/lib/utils";

if (isValidCURP("PEXJ900101HDFRZN01")) {
  // Válido
}
```

### Retry con Backoff

```typescript
import { retryWithBackoff } from "@/lib/utils";

await retryWithBackoff(
  async () => {
    return await fetch("/api/endpoint");
  },
  3, // max retries
  1000, // base delay (ms)
);
```

---

## 📦 Schema de Encuesta

### Ejemplo Mínimo

```json
{
  "version": 1,
  "title": "Mi Encuesta",
  "sections": [
    {
      "id": "seccion1",
      "title": "Datos",
      "order": 1,
      "questions": [
        {
          "id": "nombre",
          "type": "text",
          "label": "Nombre completo",
          "required": true,
          "order": 1
        }
      ]
    }
  ]
}
```

### Tipos de Preguntas

```typescript
type QuestionType =
  | "text" // TextInput
  | "number" // Numérico
  | "date" // DatePicker
  | "select" // Dropdown
  | "multi_select" // Checkboxes
  | "boolean" // Sí/No
  | "photo" // Cámara
  | "signature" // Canvas
  | "ine"; // INE + OCR
```

### Pregunta con Validación

```json
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
}
```

### Pregunta Condicional

```json
{
  "id": "otro_especificar",
  "type": "text",
  "label": "Especifique",
  "required": true,
  "order": 5,
  "conditional": {
    "questionId": "tipo",
    "operator": "equals",
    "value": "otro"
  }
}
```

---

## 🔍 Debugging

### Ver Base de Datos

```typescript
import { getDatabase } from "@/lib/db";
import { surveyResponses } from "@/lib/db/schema";

const db = getDatabase();
const all = await db.select().from(surveyResponses).all();
console.log("Todas las encuestas:", all);
```

### Limpiar Base de Datos (⚠️ Dev only)

```typescript
import { resetDatabase } from "@/lib/db";

await resetDatabase(); // ⚠️ BORRA TODO
```

### Verificar Progreso

```typescript
const response = await SurveyRepository.getResponseById(responseId);
console.log(`Progreso: ${response.progress * 100}%`);
```

---

## 📱 React Native Patterns

### useEffect para Load Data

```typescript
useEffect(() => {
  async function loadData() {
    try {
      const data = await SurveyRepository.listResponses(userId);
      setData(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }
  loadData();
}, [userId]);
```

### FlatList con Encuestas

```tsx
<FlatList
  data={surveys}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => navigate(item.id)}>
      <Text>{item.schemaName}</Text>
      <Text>Progreso: {Math.round(item.progress * 100)}%</Text>
    </TouchableOpacity>
  )}
/>
```

---

## 🧪 Testing

### Test de Repository

```typescript
import { SurveyRepository } from '@/lib/repositories/survey-repository';

test('should save answer immediately', async () => {
  const responseId = await SurveyRepository.createResponse({...});

  await SurveyRepository.saveQuestionAnswer({
    responseId,
    questionId: 'test',
    questionType: 'text',
    value: 'Test',
  });

  const answer = await SurveyRepository.getQuestionAnswer(responseId, 'test');
  expect(answer?.value).toBe('Test');
});
```

---

## 📂 Estructura Rápida

```
lib/
├── db/
│   ├── index.ts         # initDatabase(), getDatabase()
│   ├── schema.ts        # Todas las tablas
│   └── migrations.ts    # runMigrations()
├── repositories/
│   └── survey-repository.ts  # SurveyRepository.*
└── utils.ts             # generateId(), validaciones

components/survey/
├── question-renderer.tsx      # <QuestionRenderer />
├── text-question.tsx          # <TextQuestion />
├── number-question.tsx        # <NumberQuestion />
└── boolean-question.tsx       # <BooleanQuestion />
```

---

## 🎯 Estado Actual

```
Fase 1: FUNDAMENTOS ████████░░ 80%
```

**Falta**:

- [ ] Inicializar DB en app
- [ ] Crear seed data
- [ ] Hook de usuario
- [ ] UI de lista
- [ ] Testing

**Ver**: `NEXT_STEPS.md` para detalles

---

## 📚 Documentación

| Archivo                | Propósito               |
| ---------------------- | ----------------------- |
| `README.md`            | Índice maestro          |
| `EXECUTIVE_SUMMARY.md` | Resumen ejecutivo       |
| `ARCHITECTURE.md`      | Arquitectura completa   |
| `NEXT_STEPS.md`        | Pasos de implementación |
| `SCHEMAS_EXAMPLES.md`  | Ejemplos de schemas     |

---

## 🚨 Troubleshooting

### "Database not initialized"

```typescript
// Asegúrate de llamar esto en app/_layout.tsx
import { initDatabase } from "@/lib/db";
initDatabase();
```

### "Module not found"

```bash
npm install
```

### "Migrations failed"

```typescript
// Verifica que el DB esté inicializado primero
initDatabase(); // ⬅️ PRIMERO
runMigrations(); // ⬅️ DESPUÉS
```

---

## 💡 Tips Rápidos

1. **Siempre guarda inmediatamente** - No esperes a "submit"
2. **SQLite para datos, Zustand para UI** - No mezcles
3. **Lee ARCHITECTURE.md primero** - Entenderás el "por qué"
4. **Prueba offline desde día 1** - Desactiva internet
5. **Schemas son dinámicos** - No hardcodees UI

---

**¿Dudas?** Lee la documentación completa en `/docs` o pregunta al equipo.
