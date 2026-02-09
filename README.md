# 🎯 BRIGADA - Sistema de Encuestas Offline-First

Sistema mobile profesional para levantamiento de encuestas en campo con operación 100% offline y sincronización inteligente.

---

## � Inicio Rápido

- **👤 Nuevo en el proyecto?** → Lee [`docs/EXECUTIVE_SUMMARY.md`](./docs/EXECUTIVE_SUMMARY.md) (10 min)
- **👨‍💻 Listo para implementar?** → Ve a [`docs/NEXT_STEPS.md`](./docs/NEXT_STEPS.md) (5 pasos)
- **📚 Ver toda la documentación?** → Explora [`docs/README.md`](./docs/README.md) (índice completo)

---

## �📚 Documentación del Proyecto

> 📁 **Toda la documentación está organizada en [`docs/`](./docs/)**  
> 👉 **Índice completo**: [`docs/README.md`](./docs/README.md)

### 🚀 Start Here

1. **[docs/EXECUTIVE_SUMMARY.md](./docs/EXECUTIVE_SUMMARY.md)** ⭐
   - Resumen ejecutivo completo
   - Estado actual del proyecto (Fase 1 - 80%)
   - Próximos pasos inmediatos
   - **Empieza aquí si eres nuevo en el proyecto**

### 🏗️ Arquitectura y Diseño

2. **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** ⭐⭐⭐
   - Arquitectura completa del sistema
   - Decisiones técnicas justificadas
   - Modelo de datos detallado
   - Flujos de guardado inmediato
   - Sistema de sincronización
   - Roadmap de 6 fases

3. **[docs/SCHEMAS_EXAMPLES.md](./docs/SCHEMAS_EXAMPLES.md)** ⭐⭐
   - Ejemplos completos de schemas JSON
   - Encuesta simple de datos personales
   - Encuesta con preguntas condicionales
   - Encuesta con captura de INE y OCR
   - Versionado de schemas

4. **[docs/METADATA_GUIDE.md](./docs/METADATA_GUIDE.md)** ⭐ 📋 **NUEVO**
   - Guía completa de 15 nuevos campos agregados
   - Ejemplos de uso prácticos
   - Casos de uso: validación, notas, tags, duración
   - UI sugerida para captura de metadata

5. **[docs/MIGRATIONS_GUIDE.md](./docs/MIGRATIONS_GUIDE.md)** ⭐⭐ 🔄 **NUEVO**
   - Sistema de migraciones explicado paso a paso
   - Flujo completo con diagramas
   - Cómo crear nuevas migraciones
   - Mejores prácticas y troubleshooting
   - Testing de migraciones

6. **[docs/MIGRATIONS_VISUAL.md](./docs/MIGRATIONS_VISUAL.md)** ⭐ 🔄 **NUEVO**
   - Diagramas visuales del sistema de migraciones
   - Ejemplos de escenarios prácticos
   - Flujo completo ilustrado

### 📋 Guías de Implementación

7. **[docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md)** ⭐⭐⭐
   - Pasos concretos para completar Fase 1
   - Código de ejemplo para cada paso
   - Checklist de tareas
   - Scripts de testing

8. **[docs/README_IMPLEMENTATION.md](./docs/README_IMPLEMENTATION.md)** ⭐⭐
   - Resumen técnico de lo implementado
   - Estructura del proyecto
   - Patrones de código
   - Validación de fase

### 📖 Recursos Adicionales

9. **[docs/CHEATSHEET.md](./docs/CHEATSHEET.md)** ⭐
   - Referencia rápida con snippets de código
   - Comandos frecuentes
   - Patrones comunes

10. **[docs/CHANGELOG_v2.md](./docs/CHANGELOG_v2.md)** 📋
    - Changelog de la versión 2
    - Nuevos campos agregados
    - Comparación antes/después

---

## 🗂️ Estructura del Proyecto

```
brigadaFrontEnd/
├── app/                           # Expo Router (screens)
│   ├── _layout.tsx               # Root layout
│   ├── modal.tsx
│   └── (tabs)/                   # Tab navigation
│       ├── _layout.tsx
│       ├── index.tsx             # Home screen
│       └── explore.tsx
│
├── assets/                        # Imágenes, íconos
│   └── images/
│
├── components/                    # Componentes reutilizables
│   ├── survey/                   # 🆕 Componentes de encuestas
│   │   ├── question-renderer.tsx      # Renderer maestro
│   │   ├── text-question.tsx          # ✅ Implementado
│   │   ├── number-question.tsx        # ✅ Implementado
│   │   ├── boolean-question.tsx       # ✅ Implementado
│   │   ├── date-question.tsx          # ⏳ Placeholder
│   │   ├── select-question.tsx        # ⏳ Placeholder
│   │   ├── multi-select-question.tsx  # ⏳ Placeholder
│   │   ├── photo-question.tsx         # ⏳ Fase 2
│   │   ├── signature-question.tsx     # ⏳ Fase 2
│   │   └── ine-question.tsx           # ⏳ Fase 2
│   │
│   ├── ui/                       # Componentes UI base
│   ├── themed-text.tsx
│   └── themed-view.tsx
│
├── constants/                     # Constantes y tema
│   └── theme.ts
│
├── docs/                          # 📚 Documentación completa
│   ├── README.md                 # Índice de documentación
│   ├── EXECUTIVE_SUMMARY.md      # Resumen ejecutivo
│   ├── ARCHITECTURE.md           # Arquitectura del sistema
│   ├── SCHEMAS_EXAMPLES.md       # Ejemplos de schemas JSON
│   ├── METADATA_GUIDE.md         # Guía de metadata adicional
│   ├── MIGRATIONS_GUIDE.md       # Sistema de migraciones
│   ├── MIGRATIONS_VISUAL.md      # Diagramas visuales
│   ├── NEXT_STEPS.md             # Pasos de implementación
│   ├── README_IMPLEMENTATION.md  # Estado actual
│   ├── CHEATSHEET.md             # Referencia rápida
│   └── CHANGELOG_v2.md           # Changelog v2
│
├── hooks/                         # React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── lib/                           # 🆕 Core business logic
│   ├── db/                       # Base de datos
│   │   ├── index.ts              # Cliente SQLite (singleton)
│   │   ├── schema.ts             # Schema completo (8 tablas)
│   │   └── migrations.ts         # Sistema de migraciones
│   │
│   ├── repositories/             # Capa de datos
│   │   └── survey-repository.ts  # CRUD de encuestas
│   │
│   └── utils.ts                  # Utilidades generales
│
├── scripts/                       # Scripts de desarrollo
│   ├── reset-project.js
│   └── validate-phase1.ts        # Validación (placeholder)
│
├── .gitignore
├── app.json                       # Configuración de Expo
├── eslint.config.js
├── package.json
├── README.md                      # Este archivo
└── tsconfig.json
```

### 📊 Estadísticas del Proyecto

| Categoría         | Archivos        | Estado       |
| ----------------- | --------------- | ------------ |
| **Documentación** | 11 archivos     | ✅ Completa  |
| **Schema DB**     | 8 tablas        | ✅ Completo  |
| **Migraciones**   | 2 versiones     | ✅ Funcional |
| **Repositorios**  | 1 completo      | ✅ Funcional |
| **Components**    | 3/9 funcionales | 🟡 33%       |
| **UI Screens**    | 0/4             | ⏳ Pendiente |

---

## 🗄️ Base de Datos (SQLite + Drizzle ORM)

### Estructura

### Estructura

```
lib/db/
├── index.ts           # Cliente SQLite (singleton)
├── schema.ts          # Schema completo (8 tablas)
└── migrations.ts      # Sistema de migraciones versionado
```

**Tablas principales**:

- `users` - Usuarios (admin, encargado, brigadista)
- `survey_schemas` - Definiciones de encuestas (JSON versionado)
- `survey_responses` - Instancias de encuestas (con 25 campos incluyendo metadata)
- `question_answers` - Respuestas individuales (guardado inmediato)
- `attachments` - Archivos (fotos, INE, firmas)
- `sync_queue` - Cola de sincronización
- `sync_metadata` - Control de sync

### Repositorios (Business Logic)

```
lib/repositories/
└── survey-repository.ts   # Lógica completa de encuestas
```

**Métodos principales**:

- `createResponse()` - Crear nueva encuesta
- `saveQuestionAnswer()` - Guardado inmediato
- `updateMetadata()` - Actualizar notas, tags, info del encuestado
- `validateResponse()` - Validación por encargados
- `completeResponse()` - Marcar como completa (calcula duración)
- `getResponseById()` - Obtener con respuestas
- `listResponses()` - Listar encuestas del usuario

### Utilidades

```
lib/
└── utils.ts          # UUIDs, validaciones, retry, SHA256
```

---

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Verificar Setup

Las dependencias críticas ya están instaladas:

- ✅ expo-sqlite (~16.0.10)
- ✅ drizzle-orm (^0.45.1)
- ✅ zustand (^5.0.11)
- ✅ @tanstack/react-query (^5.90.20)

### 3. Próximos Pasos (Completar Fase 1)

Ver **[NEXT_STEPS.md](./NEXT_STEPS.md)** para implementar:

1. Inicializar DB en `app/_layout.tsx`
2. Crear seed data en `lib/db/seed.ts`
3. Crear hook `useCurrentUser`
4. Implementar UI de lista de encuestas
5. Testing básico

---

## 🎯 Características Clave

### ✅ Offline-First Real

- SQLite como única fuente de verdad
- Funciona 100% sin internet
- Sincronización inteligente en background

### ✅ Guardado Inmediato

```typescript
<TextInput
  onChangeText={async (text) => {
    await SurveyRepository.saveQuestionAnswer({...});
    // ✅ Ya está en SQLite, safe, offline
  }}
/>
```

### ✅ Schemas Dinámicos

```json
{
  "sections": [
    {
      "questions": [
        { "id": "nombre", "type": "text" },
        { "id": "edad", "type": "number" }
      ]
    }
  ]
}
```

### ✅ Versionado de Encuestas

- Múltiples versiones coexisten
- Sin conflictos
- Migración automática

---

## 📊 Estado del Proyecto

```
FASE 1: FUNDAMENTOS ████████░░ 80%
├─ ✅ Database Schema (100%)
├─ ✅ Migrations System (100%)
├─ ✅ Repository Layer (100%)
├─ ✅ Utils & Helpers (100%)
├─ ✅ Question Components (40%)
├─ ⏳ App Initialization (0%)
├─ ⏳ UI Screens (0%)
└─ ⏳ Testing (0%)
```

**Siguiente milestone**: Completar Fase 1 (UI básica funcional)

---

## 🛠️ Stack Tecnológico

### Frontend

- **React Native** + Expo SDK 54
- **TypeScript** (strict mode)
- **SQLite** (expo-sqlite)
- **Drizzle ORM** (type-safe queries)
- **Zustand** (UI state only)
- **expo-router** (file-based routing)

### Backend (Futuro)

- **FastAPI** (Python)
- **PostgreSQL**
- **S3** (archivos)

---

## 📖 Roadmap

### ✅ Fase 1: Fundamentos (80% - Actual)

Base de datos, repositorios, UI básica

### 📦 Fase 2: Captura Avanzada (2-3 semanas)

Cámara, OCR de INE, firmas, compresión

### 🔄 Fase 3: Sincronización (1-2 semanas)

Background sync, cola, backoff exponencial

### 📋 Fase 4: Schemas Dinámicos (1 semana)

Descarga de schemas, versionado, cache

### 👥 Fase 5: Roles y Permisos (1 semana)

JWT offline, multi-rol, dashboard admin

### 🚀 Fase 6: Producción (2 semanas)

Testing E2E, optimizaciones, deploy con EAS

---

## 🎓 Para el Equipo

### Principios de Diseño

1. **SQLite es la fuente de verdad** - No Zustand para datos críticos
2. **Guardado inmediato** - Cada input al instante
3. **Schemas dinámicos** - No hardcodear UI
4. **Offline siempre** - La app debe funcionar sin internet
5. **No editar respuestas** - Append-only, sin conflictos

### Patrones de Código

```typescript
// ✅ BIEN: Guardado inmediato
async function handleAnswer(value: string) {
  setValue(value);
  await SurveyRepository.saveQuestionAnswer({...});
}

// ❌ MAL: Solo estado
function handleAnswer(value: string) {
  setAnswers({ ...answers, nombre: value }); // ❌ No persiste
}
```

---

## 🧪 Testing

### Ejecutar Tests (Próximamente)

```bash
npm test
```

### Validar Fase 1 (Próximamente)

```bash
npx ts-node scripts/validate-phase1.ts
```

---

## 📞 Recursos

| Recurso                                        | Descripción                |
| ---------------------------------------------- | -------------------------- |
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | Resumen ejecutivo completo |
| [ARCHITECTURE.md](./ARCHITECTURE.md)           | Arquitectura del sistema   |
| [NEXT_STEPS.md](./NEXT_STEPS.md)               | Guía de implementación     |
| [SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md)   | Ejemplos de encuestas      |
| [Expo Docs](https://docs.expo.dev/)            | Documentación oficial      |
| [Drizzle ORM](https://orm.drizzle.team/)       | ORM documentation          |

---

## 🎉 Estado: Listo para Fase 1 Final

Tienes una base sólida, bien diseñada y documentada. El siguiente paso es:

1. Leer **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)**
2. Seguir **[NEXT_STEPS.md](./NEXT_STEPS.md)**
3. Completar el 20% restante de Fase 1
4. Validar flujo completo offline

**¡Manos a la obra!** 🚀

---

**Última actualización**: Febrero 2026  
**Estado**: Fase 1 - 80% completo  
**Próximo milestone**: UI básica funcional
