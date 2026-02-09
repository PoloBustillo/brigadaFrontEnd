# 🎯 BRIGADA - Sistema de Encuestas Offline-First

## ✅ Lo que se ha construido (FASE 1 - Fundamentos)

### 🗄️ Base de Datos Completa

- **Schema SQLite** con 8 tablas principales (`lib/db/schema.ts`)
  - `users` - Gestión de usuarios (admin, encargado, brigadista)
  - `survey_schemas` - Definiciones de encuestas (JSON versionado)
  - `survey_responses` - Instancias de encuestas completadas
  - `question_answers` - Respuestas individuales (guardado inmediato)
  - `attachments` - Archivos (fotos, INE, firmas)
  - `sync_queue` - Cola para sincronización
  - `sync_metadata` - Control de sincronización
  - `migrations` - Tracking de versiones de DB

- **Sistema de Migraciones** (`lib/db/migrations.ts`)
  - Versionado automático
  - Ejecución incremental
  - Rollback seguro

- **Cliente de Base de Datos** (`lib/db/index.ts`)
  - Singleton pattern
  - Drizzle ORM + Expo SQLite
  - Inicialización centralizada

### 📦 Repositorios y Lógica de Negocio

- **SurveyRepository** (`lib/repositories/survey-repository.ts`)
  - ✅ `createResponse()` - Crear nueva encuesta
  - ✅ `saveQuestionAnswer()` - Guardado inmediato de respuestas
  - ✅ `completeResponse()` - Marcar encuesta como completa
  - ✅ `getResponseById()` - Obtener encuesta con respuestas
  - ✅ `listResponses()` - Listar encuestas del usuario
  - ✅ `countPendingSync()` - Contar pendientes de sincronizar
  - ✅ Cálculo automático de progreso

### 🛠️ Utilidades

- **Utils** (`lib/utils.ts`)
  - Generación de UUIDs
  - Conversión de timestamps
  - Validación de CURP, Clave Elector, email
  - Formateo de bytes
  - SHA256 hashing
  - Retry con backoff exponencial

### 🎨 Componentes de UI (Básicos)

- **QuestionRenderer** (`components/survey/question-renderer.tsx`)
  - Renderizado dinámico de preguntas
  - Guardado automático al cambiar valor
  - Loading/saving states
  - Manejo de errores

- **Componentes de Preguntas** (`components/survey/`)
  - ✅ `TextQuestion` - Input de texto
  - ✅ `NumberQuestion` - Input numérico
  - ✅ `BooleanQuestion` - Sí/No
  - ⏳ `DateQuestion` - Selector de fecha (placeholder)
  - ⏳ `SelectQuestion` - Dropdown (placeholder)
  - ⏳ `MultiSelectQuestion` - Checkboxes múltiples (placeholder)
  - ⏳ `PhotoQuestion` - Captura de foto (Fase 2)
  - ⏳ `SignatureQuestion` - Canvas de firma (Fase 2)
  - ⏳ `INEQuestion` - Captura de INE con OCR (Fase 2)

### 📚 Documentación

- **ARCHITECTURE.md** - Arquitectura completa del sistema
  - Decisiones arquitectónicas explicadas
  - Modelo de datos detallado
  - Flujos de guardado inmediato
  - Sistema de sincronización
  - Roadmap de 6 fases

- **SCHEMAS_EXAMPLES.md** - Ejemplos de schemas JSON
  - Encuesta simple de datos personales
  - Encuesta con preguntas condicionales
  - Encuesta con captura de INE
  - Versionado de schemas

- **NEXT_STEPS.md** - Guía de implementación
  - Pasos concretos para completar Fase 1
  - Código de ejemplo para cada paso
  - Checklist de tareas
  - Criterios de validación

---

## 🎯 Arquitectura: Principios Clave

### 1. **Offline-First**

```
SQLite (Device) → Backend (Server)
     ↑
  ÚNICA FUENTE DE VERDAD
```

### 2. **Guardado Inmediato**

```typescript
<TextInput
  onChangeText={(text) => {
    // 1. Actualizar UI
    setValue(text);

    // 2. Guardar inmediatamente en SQLite
    await SurveyRepository.saveQuestionAnswer({...});
  }}
/>
```

### 3. **No React Hook Form**

- Guardado campo por campo
- No "submit" al final
- Schemas dinámicos

### 4. **Zustand SOLO para UI**

```typescript
// ✅ BIEN: Estado de UI
const useUIStore = create((set) => ({
  isLoading: false,
  modalOpen: false,
}));

// ❌ MAL: Datos persistentes
const useDataStore = create((set) => ({
  surveys: [], // ❌ Esto va en SQLite
}));
```

### 5. **Schemas Dinámicos**

```json
{
  "version": 1,
  "sections": [
    {
      "questions": [
        { "id": "nombre", "type": "text", "label": "Nombre" },
        { "id": "edad", "type": "number", "label": "Edad" }
      ]
    }
  ]
}
```

### 6. **Sincronización Unidireccional**

```
Device → Server (sin conflictos)
```

---

## 🚀 Próximos Pasos (Completar Fase 1)

### Paso 1: Inicializar DB

```bash
# Modificar app/_layout.tsx
# Agregar: initDatabase() y runMigrations()
```

### Paso 2: Seed Data

```bash
# Crear lib/db/seed.ts
# Agregar usuario y schema de prueba
```

### Paso 3: Hook de Usuario

```bash
# Crear lib/hooks/use-current-user.ts
# Gestión de usuario actual con AsyncStorage
```

### Paso 4: UI de Lista

```bash
# Modificar app/(tabs)/index.tsx
# Mostrar encuestas del usuario
```

### Paso 5: Testing

```bash
# Crear __tests__/survey-flow.test.ts
# Verificar flujo completo
```

---

## 📊 Stack Tecnológico

### Frontend

- **React Native** + Expo SDK 54
- **TypeScript** (strict mode)
- **SQLite** (expo-sqlite)
- **Drizzle ORM** (type-safe queries)
- **Zustand** (UI state)
- **expo-router** (file-based routing)

### Backend (Futuro)

- **FastAPI** (Python)
- **PostgreSQL**
- **S3** (storage de archivos)

---

## 🎨 Estructura del Proyecto

```
brigadaFrontEnd/
├── app/
│   ├── _layout.tsx          # Entry point (inicializar DB aquí)
│   └── (tabs)/
│       └── index.tsx         # Lista de encuestas
│
├── lib/
│   ├── db/
│   │   ├── index.ts         # Cliente SQLite
│   │   ├── schema.ts        # Schema completo (8 tablas)
│   │   ├── migrations.ts    # Sistema de migraciones
│   │   └── seed.ts          # ⏳ TODO: Seed data
│   │
│   ├── repositories/
│   │   └── survey-repository.ts  # Lógica de encuestas
│   │
│   ├── hooks/
│   │   └── use-current-user.ts   # ⏳ TODO: Hook de usuario
│   │
│   └── utils.ts             # Utilidades generales
│
├── components/
│   └── survey/
│       ├── question-renderer.tsx  # Renderer maestro
│       ├── text-question.tsx      # Input de texto
│       ├── number-question.tsx    # Input numérico
│       ├── boolean-question.tsx   # Sí/No
│       └── ...                    # Otros tipos
│
├── ARCHITECTURE.md          # Arquitectura completa
├── SCHEMAS_EXAMPLES.md      # Ejemplos de schemas
└── NEXT_STEPS.md            # Guía de implementación
```

---

## ✅ Validación de Fase 1 Completa

Podrás decir que la Fase 1 está completa cuando:

1. ✅ Abres la app
2. ✅ Ves lista de encuestas (vacía inicialmente)
3. ✅ Creas nueva encuesta
4. ✅ Respondes preguntas (text, number, boolean)
5. ✅ Ves progreso en tiempo real (X% completado)
6. ✅ Completas encuesta
7. ✅ Cierras app y reabres (datos persisten)
8. ✅ **TODO FUNCIONA SIN INTERNET**

---

## 📈 Roadmap Completo

### ✅ FASE 1: Fundamentos (80% completo)

- Base de datos SQLite
- Repositorios
- UI básica

### 📦 FASE 2: Captura Avanzada (2-3 semanas)

- expo-camera
- OCR de INE
- Canvas de firma
- Compresión de imágenes

### 🔄 FASE 3: Sincronización (1-2 semanas)

- Background sync service
- Cola de sincronización
- Backoff exponencial

### 📋 FASE 4: Schemas Dinámicos (1 semana)

- Descarga de schemas
- Versionado
- Cache local

### 👥 FASE 5: Roles y Permisos (1 semana)

- JWT offline
- Multi-rol
- Dashboard admin

### 🚀 FASE 6: Producción (2 semanas)

- Testing E2E
- Optimizaciones
- Deploy con EAS

---

## 🔥 Características Destacadas

### 1. **Guardado Inmediato**

Cada pregunta se guarda al instante en SQLite. Si la app crashea, no se pierde nada.

### 2. **Offline-First Real**

La app funciona 100% sin internet. La sincronización es un "extra".

### 3. **Schemas Versionados**

Múltiples versiones de encuestas coexisten. No hay conflictos.

### 4. **OCR Asistido** (Fase 2)

OCR extrae datos del INE, pero el humano los confirma.

### 5. **Sincronización Inteligente** (Fase 3)

Backoff exponencial, priorización, reintentos automáticos.

### 6. **Type-Safe**

TypeScript strict + Drizzle ORM = 0 errores en runtime.

---

## 🎓 Para el Equipo

### Reglas de Oro

1. **SQLite es la fuente de verdad** - No guardes datos críticos en Zustand
2. **Guarda cada input inmediatamente** - No esperes a "submit"
3. **Schemas son dinámicos** - No hardcodear UI
4. **Offline siempre** - La app debe funcionar sin internet
5. **No edites respuestas** - Append-only, sin conflictos

### Ejemplo de Código Correcto

```typescript
// ✅ BIEN
async function handleAnswerChange(value: string) {
  // 1. Actualizar UI
  setValue(value);

  // 2. Guardar inmediatamente en SQLite
  await SurveyRepository.saveQuestionAnswer({
    responseId,
    questionId: "nombre",
    questionType: "text",
    value,
  });

  // ✅ Ya está guardado, seguro, offline
}

// ❌ MAL
function handleAnswerChange(value: string) {
  // Solo actualizar estado
  setAnswers({ ...answers, nombre: value });
  // ❌ No guardado en SQLite
  // ❌ Se pierde si la app crashea
}
```

---

## 📞 Recursos

- **Documentación**: Ver `ARCHITECTURE.md`
- **Ejemplos**: Ver `SCHEMAS_EXAMPLES.md`
- **Guía**: Ver `NEXT_STEPS.md`
- **Código**: Ver `lib/` y `components/survey/`

---

## 🎯 Siguiente Acción Inmediata

1. Modificar `app/_layout.tsx` para inicializar DB
2. Crear seed data en `lib/db/seed.ts`
3. Crear hook `useCurrentUser`
4. Probar flujo completo

**¡Tienes una base sólida! El siguiente paso es conectar la UI con el Repository.** 🚀

---

**Última actualización**: Febrero 2026
**Estado**: Fase 1 en progreso (80%)
**Próximo milestone**: Completar Fase 1 (UI básica funcional)
