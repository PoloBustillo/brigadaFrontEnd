# 🚀 Features - Lógica de Negocio

Esta carpeta contiene toda la lógica de negocio de la aplicación, organizada por **features** (características).

## 📂 Estructura

```
features/
├── questions/          # Sistema de preguntas dinámicas
├── surveys/            # Gestión de encuestas
└── sync/              # Sistema de sincronización
```

## 🎯 Principio de Organización

Cada feature contiene TODO lo necesario para funcionar:

```
feature-name/
├── components/        # Componentes específicos del feature
├── hooks/            # Hooks personalizados
├── utils/            # Utilidades y lógica
├── types/            # Tipos TypeScript
└── services/         # Servicios (API, business logic)
```

## 📋 Features Existentes

### 1. `questions/` - Sistema de Preguntas Dinámicas

**Propósito**: Renderizar preguntas desde JSON schema.

**Archivos clave**:

- `components/question-renderer.tsx` - Factory pattern para renderizar preguntas
- `types/question-base.types.ts` - Tipos de todas las preguntas
- `types/question-types.enum.ts` - Enum de tipos soportados

**Tipos de preguntas soportados**:

- ✅ TEXT, TEXTAREA, NUMBER
- ✅ SELECT, MULTI_SELECT, RADIO, CHECKBOX
- ✅ DATE, TIME, DATETIME
- ✅ RATING, SLIDER
- ✅ LOCATION, PHOTO, SIGNATURE, FILE

**Próximos pasos**:

- [ ] Implementar componentes individuales de preguntas
- [ ] Crear hooks de validación
- [ ] Implementar lógica condicional (skip logic)

---

### 2. `surveys/` - Gestión de Encuestas

**Propósito**: Lógica central para ejecutar encuestas.

**Archivos clave**:

- `utils/survey-engine.ts` - Motor de encuestas (progreso, validación, lógica condicional)
- `types/survey.types.ts` - Tipos de encuestas y respuestas

**Funcionalidades**:

- ✅ Navegación entre secciones
- ✅ Cálculo de progreso
- ✅ Validación de completitud
- ✅ Lógica condicional (show/hide questions)
- ✅ Persistencia de respuestas

**Próximos pasos**:

- [ ] Crear hooks: `use-survey.ts`, `use-survey-list.ts`
- [ ] Implementar validación de respuestas
- [ ] Agregar soporte para branching complejo

---

### 3. `sync/` - Sistema de Sincronización

**Propósito**: Sincronizar datos local ↔ servidor.

**Archivos clave**:

- `utils/network-detector.ts` - Detectar conectividad (WiFi/cellular/offline)
- `types/sync.types.ts` - Tipos de sincronización y cola

**Funcionalidades**:

- ✅ Detección de red
- ✅ Cola de sincronización
- ⚠️ Upload/download (pendiente)
- ⚠️ Resolución de conflictos (pendiente)

**Próximos pasos**:

- [ ] Implementar `services/sync-engine.ts`
- [ ] Crear `services/sync-queue.ts`
- [ ] Implementar reintentos con backoff exponencial
- [ ] Agregar resolución de conflictos

---

## 🔗 Relación con Otros Módulos

```
Features (lógica)
    ↓
Repositories (datos)
    ↓
Lib/DB (persistencia)
```

```
Features (lógica)
    ↓
Store (estado global)
    ↓
Components (UI)
```

## 💡 Mejores Prácticas

### 1. **Mantener features independientes**

- Cada feature debe funcionar por sí solo
- Minimizar dependencias entre features
- Si necesitas compartir código, usa `utils/` global

### 2. **Tipos fuertemente tipados**

- Todos los tipos en `types/`
- Usar enums para valores fijos
- Re-exportar en `types/index.ts` global

### 3. **Separar lógica de UI**

- Lógica compleja en `utils/` y `services/`
- Componentes solo para renderizar
- Hooks para conectar lógica con UI

### 4. **Testing**

- Cada feature debe tener tests
- Priorizar testing de lógica (utils/services)
- Usar `__tests__/` espejo de la estructura

## 📚 Ejemplos de Uso

### Usar Question Renderer

```typescript
import { QuestionRenderer } from "@/features/questions/components/question-renderer";
import { QuestionType } from "@/features/questions/types/question-types.enum";

const question = {
  id: "q1",
  type: QuestionType.TEXT,
  label: "¿Cuál es tu nombre?",
  required: true,
};

<QuestionRenderer
  question={question}
  value={answer}
  onChange={(answer) => console.log(answer)}
/>
```

### Usar Survey Engine

```typescript
import { SurveyEngine } from "@/features/surveys/utils/survey-engine";

const engine = new SurveyEngine(schema, existingAnswers);

// Obtener preguntas visibles de sección actual
const questions = engine.getVisibleQuestions(0);

// Guardar respuesta
engine.setAnswer("q1", "Juan");

// Calcular progreso
const progress = engine.calculateProgress();
console.log(`${progress.percentage}% completado`);
```

### Detectar Conectividad

```typescript
import { NetworkDetector } from "@/features/sync/utils/network-detector";

// Verificar si hay conexión
const isConnected = await NetworkDetector.isConnected();

// Suscribirse a cambios
const unsubscribe = NetworkDetector.subscribe((isConnected) => {
  console.log("Conectado:", isConnected);
});

// Cleanup
unsubscribe();
```

## 🔮 Features Futuros

### Potenciales nuevos features:

1. **`auth/`** - Autenticación y autorización
2. **`reports/`** - Generación de reportes
3. **`notifications/`** - Push notifications
4. **`offline-queue/`** - Cola de operaciones offline
5. **`analytics/`** - Tracking de eventos

---

## 🆘 ¿Necesitas ayuda?

- Ver arquitectura completa: `docs/ARCHITECTURE_NEW.md`
- Ver ejemplos de schemas: `docs/SCHEMAS_EXAMPLES.md`
- Ver guía de migraciones: `docs/MIGRATIONS_GUIDE.md`

**Última actualización**: Febrero 2026
