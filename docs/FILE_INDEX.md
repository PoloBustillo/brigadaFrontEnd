# 📍 Índice de Archivos Importantes

## 🎯 Archivos para Empezar

Si eres nuevo en el proyecto, **empieza leyendo estos archivos en este orden**:

### 1️⃣ Entender el Proyecto (30 min)

1. **README.md** (raíz) - Overview del proyecto
2. **docs/EXECUTIVE_SUMMARY.md** - Resumen ejecutivo y estado actual
3. **docs/ARCHITECTURE_NEW.md** - Nueva arquitectura implementada
4. **STRUCTURE_SUMMARY.md** - Resumen de lo que se creó recientemente

### 2️⃣ Configurar Entorno (15 min)

5. **DEPENDENCIES.md** - Todas las dependencias a instalar
6. **package.json** - Ver dependencias actuales
7. **constants/config.ts** - Configuración de la app

### 3️⃣ Entender la Arquitectura (45 min)

8. **features/README.md** - Explicación de features
9. **features/questions/types/question-base.types.ts** - Tipos de preguntas
10. **features/surveys/utils/survey-engine.ts** - Motor de encuestas
11. **store/survey-store.ts** - Estado global de encuestas

### 4️⃣ Empezar a Implementar (ahora)

12. **docs/NEXT_STEPS.md** - Pasos siguientes
13. **features/questions/components/question-renderer.tsx** - Componente a extender

---

## 📂 Archivos por Categoría

### 🏗️ Arquitectura y Tipos

```
features/
├── questions/types/
│   ├── question-types.enum.ts       ⭐ Enum de tipos de preguntas
│   └── question-base.types.ts       ⭐ Tipos de todas las preguntas
├── surveys/types/
│   └── survey.types.ts              ⭐ Tipos de encuestas y respuestas
└── sync/types/
    └── sync.types.ts                ⭐ Tipos de sincronización

types/
└── index.ts                         ⭐ Re-exports de todos los tipos
```

**Para qué sirven**:

- Definir la estructura de datos de toda la app
- Type safety en TypeScript
- Autocomplete en el IDE

**Cuándo usarlos**:

- Al crear nuevas funcionalidades
- Al definir props de componentes
- Al trabajar con la base de datos

---

### 🎨 Componentes UI

```
components/ui/
├── button.tsx                       ⭐ Botón reutilizable (4 variantes)
├── input.tsx                        ⭐ Input con validación
├── card.tsx                         ⭐ Tarjeta con sombra
└── loading-spinner.tsx              ⭐ Spinner de carga

features/questions/components/
└── question-renderer.tsx            ⭐⭐⭐ Factory de preguntas dinámicas
```

**Para qué sirven**:

- Componentes reutilizables en toda la app
- Consistencia visual
- Reducir duplicación de código

**Cuándo usarlos**:

- Al crear nuevas pantallas
- Al necesitar inputs, botones, cards
- Al renderizar preguntas dinámicas

---

### 🧠 Lógica de Negocio

```
features/surveys/utils/
└── survey-engine.ts                 ⭐⭐⭐ Motor central de encuestas
    • getSections()
    • getVisibleQuestions()
    • shouldShowQuestion()
    • setAnswer()
    • calculateProgress()
    • isComplete()

features/sync/utils/
└── network-detector.ts              ⭐⭐ Detección de conectividad
    • isConnected()
    • hasGoodConnection()
    • subscribe()
    • waitForConnection()
```

**Para qué sirven**:

- Lógica compleja separada de UI
- Reutilizable y testeable
- Fácil de mantener

**Cuándo usarlos**:

- Al ejecutar una encuesta
- Al navegar entre preguntas
- Al verificar conectividad para sync

---

### 🗄️ Estado Global (Zustand)

```
store/
├── survey-store.ts                  ⭐⭐⭐ Estado de encuestas en progreso
│   • startSurvey()
│   • resumeSurvey()
│   • setAnswer()
│   • nextSection()
│   • completeSurvey()
│
└── sync-store.ts                    ⭐⭐ Estado de sincronización
    • setOnlineStatus()
    • setSyncing()
    • updateLastSync()
    • setPendingCount()
```

**Para qué sirven**:

- Estado global compartido entre pantallas
- Persistencia de encuesta en progreso
- Estado de conectividad en tiempo real

**Cuándo usarlos**:

- Al iniciar/reanudar una encuesta
- Al guardar respuestas
- Al sincronizar con servidor

---

### 🛠️ Utilidades

```
utils/
├── validation.ts                    ⭐ Validadores reutilizables
│   • isValidEmail()
│   • isValidPhone()
│   • hasMinLength()
│   • isInRange()
│
└── date.ts                          ⭐ Manejo de fechas
    • formatDate()
    • formatTime()
    • formatDuration()
    • formatRelativeTime()
    • isToday()
```

**Para qué sirven**:

- Funciones helper reutilizables
- Validación consistente
- Formateo de datos

**Cuándo usarlos**:

- Al validar inputs de usuario
- Al mostrar fechas/horas
- Al calcular duraciones

---

### ⚙️ Configuración

```
constants/
├── theme.ts                         ⭐ Ya existe - Tema visual
└── config.ts                        ⭐ NUEVO - Config de la app
    • APP_CONFIG
    • LOG_CONFIG
    • database settings
    • sync settings
    • API endpoints
```

**Para qué sirven**:

- Centralizar configuración
- Fácil cambio entre dev/prod
- Constantes compartidas

**Cuándo usarlos**:

- Al conectar a API
- Al configurar sincronización
- Al abrir base de datos

---

### 🗃️ Base de Datos

```
lib/db/
├── index.ts                         ✅ Ya existe - Inicialización
├── schema.ts                        ✅ Ya existe - Schema Drizzle
└── migrations.ts                    ✅ Ya existe - Migraciones v1 y v2

lib/repositories/
└── survey-repository.ts             ✅ Ya existe - CRUD de encuestas
```

**Para qué sirven**:

- Persistencia local con SQLite
- Migraciones de schema
- Acceso tipado a datos

**Cuándo usarlos**:

- Al guardar respuestas
- Al cargar esquemas de encuestas
- Al aplicar migraciones

---

### 📚 Documentación

```
docs/
├── README.md                        ⭐ Índice completo de docs
├── EXECUTIVE_SUMMARY.md             ⭐ Resumen ejecutivo
├── ARCHITECTURE.md                  ⭐ Arquitectura original
├── ARCHITECTURE_NEW.md              ⭐⭐⭐ NUEVA arquitectura
├── MIGRATIONS_LIFECYCLE.md          ⭐⭐ Ciclo de vida de migraciones
├── MIGRATIONS_GUIDE.md              ⭐⭐ Guía de migraciones
├── METADATA_GUIDE.md                ⭐ Guía de metadata
├── NEXT_STEPS.md                    ⭐ Próximos pasos
└── SCHEMAS_EXAMPLES.md              ⭐ Ejemplos de schemas JSON

DEPENDENCIES.md                      ⭐⭐ NUEVO - Todas las dependencias
STRUCTURE_SUMMARY.md                 ⭐⭐ NUEVO - Resumen de estructura
features/README.md                   ⭐ NUEVO - Explicación de features
```

**Orden de lectura recomendado**:

1. EXECUTIVE_SUMMARY.md
2. ARCHITECTURE_NEW.md
3. DEPENDENCIES.md
4. STRUCTURE_SUMMARY.md
5. NEXT_STEPS.md

---

## 🚦 Archivos por Prioridad de Lectura

### 🔴 Críticos (Lee primero)

1. **README.md** - Overview del proyecto
2. **docs/ARCHITECTURE_NEW.md** - Arquitectura completa
3. **features/README.md** - Entender features
4. **DEPENDENCIES.md** - Instalar dependencias

### 🟡 Importantes (Lee después)

5. **features/surveys/utils/survey-engine.ts** - Motor de encuestas
6. **features/questions/components/question-renderer.tsx** - Renderizador
7. **store/survey-store.ts** - Estado de encuestas
8. **docs/NEXT_STEPS.md** - Qué hacer ahora

### 🟢 Útiles (Referencia)

9. **features/questions/types/question-base.types.ts** - Todos los tipos
10. **utils/validation.ts** - Validadores
11. **utils/date.ts** - Formateo de fechas
12. **docs/MIGRATIONS_LIFECYCLE.md** - Entender migraciones

---

## 🎯 Flujo de Trabajo Recomendado

### Para implementar un nuevo tipo de pregunta:

1. **Define el tipo** (si no existe):
   - Edita `features/questions/types/question-base.types.ts`
   - Agrega a enum en `features/questions/types/question-types.enum.ts`

2. **Crea el componente**:
   - Nuevo archivo: `features/questions/components/text-question.tsx`
   - Usa `components/ui/input.tsx` como base

3. **Integra en renderer**:
   - Edita `features/questions/components/question-renderer.tsx`
   - Agrega case en el switch

4. **Prueba**:
   - Crea una encuesta de prueba con ese tipo
   - Renderiza y valida

---

### Para crear una nueva pantalla de encuesta:

1. **Crea la ruta**:
   - Nuevo archivo: `app/survey/[id].tsx`

2. **Usa el store**:

   ```typescript
   const { currentSchema, setAnswer, nextSection } = useSurveyStore();
   ```

3. **Renderiza preguntas**:

   ```typescript
   <QuestionRenderer
     question={question}
     value={answers[question.id]}
     onChange={handleAnswer}
   />
   ```

4. **Navega**:
   ```typescript
   <Button title="Siguiente" onPress={nextSection} />
   ```

---

### Para implementar sincronización:

1. **Lee el estado de red**:

   ```typescript
   const isConnected = await NetworkDetector.isConnected();
   ```

2. **Actualiza el store**:

   ```typescript
   const { setSyncing, updateLastSync } = useSyncStore();
   ```

3. **Implementa sync-engine** (pendiente):
   - `features/sync/services/sync-engine.ts`
   - `features/sync/services/sync-queue.ts`

4. **Usa React Query** (opcional):
   - Para cache y reintentos automáticos

---

## 📋 Checklist de Archivos para Revisar

Antes de empezar a implementar, asegúrate de haber leído:

- [ ] README.md
- [ ] docs/ARCHITECTURE_NEW.md
- [ ] DEPENDENCIES.md
- [ ] STRUCTURE_SUMMARY.md
- [ ] features/README.md
- [ ] features/surveys/utils/survey-engine.ts
- [ ] features/questions/components/question-renderer.tsx
- [ ] store/survey-store.ts

---

## 🔗 Links Rápidos

| Necesito...             | Ir a...                                   |
| ----------------------- | ----------------------------------------- |
| Entender el proyecto    | `docs/EXECUTIVE_SUMMARY.md`               |
| Ver arquitectura        | `docs/ARCHITECTURE_NEW.md`                |
| Instalar dependencias   | `DEPENDENCIES.md`                         |
| Ver qué se creó         | `STRUCTURE_SUMMARY.md`                    |
| Empezar a implementar   | `docs/NEXT_STEPS.md`                      |
| Entender features       | `features/README.md`                      |
| Ver tipos de preguntas  | `features/questions/types/`               |
| Usar motor de encuestas | `features/surveys/utils/survey-engine.ts` |
| Crear componente UI     | `components/ui/`                          |
| Validar datos           | `utils/validation.ts`                     |
| Formatear fechas        | `utils/date.ts`                           |

---

**Última actualización**: Febrero 9, 2026
**Total de archivos importantes**: 30+
