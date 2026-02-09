# 🏗️ Arquitectura de Carpetas - Brigada Frontend

## 📋 Estructura Completa

```
brigadaFrontEnd/
├── app/                              # Expo Router - Navegación
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (tabs)/
│   └── survey/[id].tsx
│
├── features/                         # Lógica de negocio por feature
│   ├── questions/                    # Sistema de preguntas dinámicas
│   │   ├── components/               # Componentes de tipos de pregunta
│   │   │   ├── question-renderer.tsx ✅ Factory pattern
│   │   │   ├── text-question.tsx
│   │   │   └── [otros tipos]
│   │   ├── types/                    # Tipos TypeScript
│   │   │   ├── question-base.types.ts ✅
│   │   │   └── question-types.enum.ts ✅
│   │   ├── hooks/                    # Hooks personalizados
│   │   └── utils/                    # Utilidades
│   │
│   ├── surveys/                      # Gestión de encuestas
│   │   ├── hooks/
│   │   ├── utils/
│   │   │   └── survey-engine.ts      ✅ Motor de render dinámico
│   │   └── types/
│   │       └── survey.types.ts       ✅
│   │
│   └── sync/                         # Sistema de sincronización
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       │   └── network-detector.ts   ✅
│       └── types/
│           └── sync.types.ts         ✅
│
├── components/                       # Componentes reutilizables
│   ├── ui/                           # Componentes base
│   ├── survey/                       # Componentes de encuestas
│   ├── sync/                         # Componentes de sync
│   └── layout/                       # Layouts
│
├── store/                            # Estado global (Zustand)
│   ├── survey-store.ts               ✅
│   └── sync-store.ts                 ✅
│
├── repositories/                     # Capa de acceso a datos
│   ├── survey-repository.ts
│   ├── response-repository.ts
│   └── sync-repository.ts
│
├── lib/                              # Librerías core
│   ├── db/                           # Base de datos
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrations.ts
│   ├── api/                          # Cliente API
│   └── storage/                      # Storage
│
├── hooks/                            # Hooks globales
│   └── use-network-status.ts
│
├── utils/                            # Utilidades generales
│   ├── validation.ts                 ✅
│   └── date.ts                       ✅
│
├── types/                            # Tipos globales
│   └── index.ts                      ✅ Re-exports
│
├── constants/                        # Constantes
│   ├── theme.ts
│   └── config.ts                     ✅
│
└── docs/                             # Documentación
    └── ARCHITECTURE_NEW.md           ✅ Este archivo
```

## 🎯 Principios de Diseño

### 1. **Feature-Based Organization**

- Toda la lógica relacionada agrupada por característica
- Facilita mantenimiento y escalabilidad
- Reduce acoplamiento entre módulos

### 2. **Separation of Concerns**

- **features/**: Lógica de negocio
- **components/**: UI reutilizable
- **store/**: Estado global
- **repositories/**: Acceso a datos
- **lib/**: Utilidades core

### 3. **Offline-First Architecture**

- Base de datos local (SQLite + Drizzle)
- Cola de sincronización
- Detección de conectividad
- Conflictos resueltos automáticamente

### 4. **Type Safety**

- TypeScript estricto
- Tipos compartidos en `types/`
- Validación en runtime con Zod (opcional)

## 🔑 Componentes Clave

### 1. **Question Renderer (Factory Pattern)**

```typescript
features / questions / components / question - renderer.tsx;
```

- Renderiza preguntas dinámicamente desde JSON
- Switch/case según tipo de pregunta
- Maneja validación y estado

### 2. **Survey Engine**

```typescript
features / surveys / utils / survey - engine.ts;
```

- Motor central de encuestas
- Lógica condicional (skip/show)
- Cálculo de progreso
- Validación de completitud

### 3. **Sync System**

```typescript
features/sync/
```

- Cola de sincronización
- Detección de red
- Reintentos con backoff
- Resolución de conflictos

### 4. **Zustand Stores**

```typescript
store / survey - store.ts;
store / sync - store.ts;
```

- Estado global sin boilerplate
- Persistencia opcional
- Lightweight y performante

## 📦 Flujo de Datos

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│  UI Components      │  (app/, components/)
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  Zustand Stores     │  (store/)
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  Feature Logic      │  (features/)
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  Repositories       │  (repositories/)
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  Local DB + API     │  (lib/db, lib/api)
└─────────────────────┘
```

## 🚀 Próximos Pasos

### Fase 1: Componentes de Preguntas

- [ ] Implementar text-question.tsx
- [ ] Implementar select-question.tsx
- [ ] Implementar photo-question.tsx
- [ ] Implementar location-question.tsx

### Fase 2: Hooks de Surveys

- [ ] use-survey.ts
- [ ] use-survey-list.ts
- [ ] use-survey-validation.ts

### Fase 3: Sistema de Sync

- [ ] sync-engine.ts
- [ ] sync-queue.ts
- [ ] use-sync.ts
- [ ] use-auto-sync.ts

### Fase 4: UI de Encuestas

- [ ] app/survey/[id].tsx (pantalla principal)
- [ ] components/survey/survey-progress.tsx
- [ ] components/survey/survey-navigation.tsx

### Fase 5: Sincronización

- [ ] Integrar con API backend
- [ ] Implementar resolución de conflictos
- [ ] Auto-sync en background

## 📚 Convenciones

### Naming

- **Componentes**: PascalCase (`QuestionRenderer`)
- **Archivos**: kebab-case (`question-renderer.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useSurvey`)
- **Stores**: kebab-case con sufijo `-store` (`survey-store.ts`)

### Imports

```typescript
// 1. React/React Native
import React from "react";
import { View, Text } from "react-native";

// 2. Librerías externas
import { create } from "zustand";

// 3. Tipos
import { Question } from "@/types";

// 4. Features
import { QuestionRenderer } from "@/features/questions";

// 5. Components
import { Button } from "@/components/ui";

// 6. Hooks
import { useSurvey } from "@/features/surveys/hooks";

// 7. Utils
import { formatDate } from "@/utils/date";

// 8. Styles
import { styles } from "./styles";
```

## 🔗 Referencias

- **Expo Router**: https://docs.expo.dev/router/introduction/
- **Zustand**: https://docs.pmnd.rs/zustand/getting-started/introduction
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **SQLite**: https://docs.expo.dev/versions/latest/sdk/sqlite/

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
