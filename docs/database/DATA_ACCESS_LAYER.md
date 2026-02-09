# 🗄️ Capa de Acceso a Datos - Guía Completa

**Ubicación**: `lib/db/`  
**Patrón**: Repository Pattern con Singleton  
**Base de datos**: SQLite con Expo SQLite  
**ORM**: Drizzle (opcional, también SQL raw)

---

## 📑 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [DatabaseManager](#databasemanager)
4. [Repositorios](#repositorios)
   - [SurveyRepository](#surveyrepository)
   - [ResponseRepository](#responserepository)
   - [SyncRepository](#syncrepository)
   - [FileRepository](#filerepository)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### ¿Qué es la Capa de Acceso a Datos?

Es una **abstracción limpia** entre tu aplicación y SQLite que:

- ✅ Oculta la complejidad de SQL
- ✅ Provee métodos tipados en TypeScript
- ✅ Implementa guardado inmediato (offline-first)
- ✅ Gestiona transacciones automáticamente
- ✅ Incluye logging y error handling

### Características Clave

| Característica          | Descripción                                        |
| ----------------------- | -------------------------------------------------- |
| **Guardado Inmediato**  | `createResponse()` guarda en BD al instante        |
| **Auto-save**           | `updateAnswers()` guarda cada respuesta automático |
| **Progress Tracking**   | Calcula porcentaje completado                      |
| **Sync Queue**          | Cola con prioridades y reintentos                  |
| **File Management**     | Gestión de fotos, INE, firmas con OCR              |
| **Transaction Support** | Operaciones atómicas                               |
| **TypeScript First**    | Todos los tipos exportados                         |
| **Sin lógica de UI**    | Solo acceso a datos, sin componentes React         |

---

## 🏗️ Arquitectura

```
lib/db/
├── database.ts              # DatabaseManager (Singleton)
├── schema.sql               # Schema completo de SQLite
├── index.ts                 # Exportaciones centrales
└── repositories/
    ├── survey.repository.ts    # 8 métodos - CRUD de encuestas
    ├── response.repository.ts  # 17 métodos - Lifecycle de respuestas (CORE)
    ├── sync.repository.ts      # 8 métodos - Cola de sincronización
    └── file.repository.ts      # 11 métodos - Gestión de archivos
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                        COMPONENTES REACT                      │
│  (No acceden directamente a SQLite, usan Repositories)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      REPOSITORIES                             │
│  • surveyRepository    • responseRepository                  │
│  • syncRepository      • fileRepository                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DatabaseManager                            │
│  • Singleton          • Transactions                         │
│  • Connection Pool    • Error Handling                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                          │
│  • 7 tablas           • 3 vistas                             │
│  • 5 triggers         • 15+ índices                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 DatabaseManager

**Archivo**: `lib/db/database.ts`

### Responsabilidades

1. **Conexión**: Abrir/cerrar BD con Expo SQLite
2. **Singleton**: Una sola instancia en toda la app
3. **Transacciones**: BEGIN/COMMIT/ROLLBACK automático
4. **Drizzle ORM**: Inicializar ORM (opcional)

### Métodos Públicos

```typescript
class DatabaseManager {
  // Inicializar base de datos (llamar al inicio de la app)
  async initialize(): Promise<void>;

  // Obtener conexión SQLite nativa
  getConnection(): SQLite.SQLiteDatabase;

  // Obtener instancia de Drizzle ORM
  getDrizzle(): ReturnType<typeof drizzle>;

  // Ejecutar transacción (automático rollback en error)
  async transaction<T>(callback: (tx) => Promise<T>): Promise<T>;

  // Cerrar conexión (útil para testing)
  async close(): Promise<void>;
}
```

### Ejemplo de Uso

```typescript
import { db } from "@/lib/db";

// 1. Inicializar al inicio de la app (app/_layout.tsx)
await db.initialize();

// 2. Usar en transacción
await db.transaction(async (tx) => {
  // Múltiples operaciones en una transacción
  await tx.runAsync("INSERT INTO ...");
  await tx.runAsync("UPDATE ...");
  // Si hay error, rollback automático
});
```

---

## 📦 Repositorios

### 1. SurveyRepository

**Archivo**: `lib/db/repositories/survey.repository.ts`  
**Propósito**: CRUD de encuestas

#### Métodos (8)

| Método                      | Descripción                        | Retorna              |
| --------------------------- | ---------------------------------- | -------------------- |
| `getActiveSurveys()`        | Obtener encuestas activas          | `SurveyRecord[]`     |
| `getSurveyByIdAndVersion()` | Obtener encuesta específica        | `SurveyRecord\|null` |
| `getSurveySchema()`         | Parsear JSON schema                | `SurveySchema`       |
| `upsertSurvey()`            | Insertar o actualizar (UPSERT)     | `string` (survey_id) |
| `getSurveysByCategory()`    | Filtrar por categoría              | `SurveyRecord[]`     |
| `searchSurveys()`           | Buscar por título/descripción/tags | `SurveyRecord[]`     |
| `markAsSynced()`            | Marcar como sincronizada           | `void`               |
| `deactivateSurvey()`        | Desactivar (soft delete)           | `void`               |

#### Ejemplo

```typescript
import { surveyRepository } from "@/lib/db";

// Obtener todas las encuestas activas
const surveys = await surveyRepository.getActiveSurveys();

// Buscar encuestas por texto
const results = await surveyRepository.searchSurveys("censo");

// Obtener schema parseado
const schema = await surveyRepository.getSurveySchema("censo-2026", "1.0.0");
```

---

### 2. ResponseRepository ⭐ **CORE**

**Archivo**: `lib/db/repositories/response.repository.ts`  
**Propósito**: Lifecycle completo de respuestas (guardado, progreso, sync)

#### Métodos (17)

| Método                      | Descripción                          | Importancia |
| --------------------------- | ------------------------------------ | ----------- |
| `createResponse()`          | Crear respuesta (guardado inmediato) | ⭐⭐⭐      |
| `updateAnswers()`           | Auto-save de respuestas              | ⭐⭐⭐      |
| `completeResponse()`        | Marcar como completada + duración    | ⭐⭐⭐      |
| `getResponseById()`         | Obtener respuesta por ID             | ⭐⭐        |
| `getResponseWithAnswers()`  | Respuesta con answers parseados      | ⭐⭐⭐      |
| `getResponsesByUser()`      | Todas las respuestas de un usuario   | ⭐⭐        |
| `getResponsesBySurvey()`    | Respuestas de una encuesta           | ⭐⭐        |
| `getPendingSyncResponses()` | Respuestas pendientes de sincronizar | ⭐⭐⭐      |
| `markAsSynced()`            | Marcar como sincronizada             | ⭐⭐⭐      |
| `markSyncError()`           | Marcar error de sincronización       | ⭐⭐        |
| `getResponseProgress()`     | Calcular progreso (%)                | ⭐⭐⭐      |
| `getDraftResponses()`       | Respuestas borrador                  | ⭐⭐        |
| `getCompletedResponses()`   | Respuestas completadas               | ⭐⭐        |
| `deleteResponse()`          | Eliminar (solo drafts no sync)       | ⭐          |
| `getResponseStats()`        | Estadísticas por status              | ⭐          |

#### Ejemplo Completo

```typescript
import { responseRepository } from "@/lib/db";
import { QuestionType } from "@/types/survey-schema.types";

// 1. CREAR RESPUESTA (guardado inmediato)
const responseId = await responseRepository.createResponse({
  response_id: "uuid-1234",
  survey_id: "censo-2026",
  survey_version: "1.0.0",
  brigadista_user_id: "user-123",
  brigadista_name: "Juan Pérez",
  brigadista_role: "brigadista",
  device_platform: "android",
  device_os_version: "13",
  device_app_version: "1.0.0",
});

// 2. AUTO-SAVE (cada vez que el usuario responde)
await responseRepository.updateAnswers({
  response_id: responseId,
  answers: {
    "q1-nombre": {
      questionId: "q1-nombre",
      questionType: QuestionType.TEXT,
      value: "Juan Pérez",
      answeredAt: new Date().toISOString(),
    },
    "q2-edad": {
      questionId: "q2-edad",
      questionType: QuestionType.NUMBER,
      value: 35,
      answeredAt: new Date().toISOString(),
    },
  },
});

// 3. OBTENER PROGRESO (live tracking)
const progress = await responseRepository.getResponseProgress(responseId);
console.log(`Progreso: ${progress.percentage}%`); // e.g. "50%"

// 4. COMPLETAR RESPUESTA
await responseRepository.completeResponse(responseId);

// 5. MARCAR COMO SINCRONIZADA (después de subir al servidor)
await responseRepository.markAsSynced(responseId);
```

---

### 3. SyncRepository

**Archivo**: `lib/db/repositories/sync.repository.ts`  
**Propósito**: Cola de sincronización con prioridades y reintentos

#### Métodos (8)

| Método                   | Descripción                               | Retorna             |
| ------------------------ | ----------------------------------------- | ------------------- |
| `addToQueue()`           | Añadir operación a cola                   | `string` (queue_id) |
| `getPendingOperations()` | Obtener operaciones pendientes            | `SyncQueueRecord[]` |
| `markAsCompleted()`      | Marcar operación como completada          | `void`              |
| `markAsFailed()`         | Marcar error + incrementar retry_count    | `void`              |
| `getOperation()`         | Obtener operación específica              | `SyncQueueRecord`   |
| `cleanupCompleted()`     | Limpiar operaciones antiguas              | `void`              |
| `getQueueStats()`        | Estadísticas de la cola                   | `QueueStats`        |
| `retryFailed()`          | Reintentar todas las operaciones fallidas | `void`              |

#### Tipos de Operación

```typescript
type OperationType =
  | "create_response"
  | "update_response"
  | "upload_file"
  | "download_survey"
  | "validate_response";
```

#### Ejemplo

```typescript
import { syncRepository } from "@/lib/db";

// 1. AÑADIR A COLA (prioridad 1 = alta)
await syncRepository.addToQueue({
  queue_id: "sync-uuid-1234",
  operation_type: "create_response",
  entity_type: "response",
  entity_id: responseId,
  payload: { response_id: responseId },
  priority: 1,
});

// 2. OBTENER PENDIENTES (para procesar en background)
const pending = await syncRepository.getPendingOperations(10);

for (const operation of pending) {
  try {
    // Procesar...
    await processOperation(operation);
    await syncRepository.markAsCompleted(operation.queue_id);
  } catch (error) {
    await syncRepository.markAsFailed(operation.queue_id, error.message);
  }
}

// 3. ESTADÍSTICAS
const stats = await syncRepository.getQueueStats();
console.log(`Pendientes: ${stats.pending}, Fallidas: ${stats.failed}`);
```

---

### 4. FileRepository

**Archivo**: `lib/db/repositories/file.repository.ts`  
**Propósito**: Gestión de archivos locales (fotos, INE, firmas)

#### Métodos (11)

| Método                   | Descripción                         | Retorna            |
| ------------------------ | ----------------------------------- | ------------------ |
| `createFile()`           | Guardar referencia de archivo       | `string` (file_id) |
| `getFileById()`          | Obtener archivo por ID              | `FileRecord`       |
| `getFilesByResponse()`   | Todos los archivos de una respuesta | `FileRecord[]`     |
| `getPendingFiles()`      | Archivos pendientes de subir        | `FileRecord[]`     |
| `markAsUploaded()`       | Marcar como subido + remote_url     | `void`             |
| `markUploadError()`      | Marcar error de subida              | `void`             |
| `updateOcrData()`        | Actualizar datos OCR de INE         | `void`             |
| `createThumbnail()`      | Generar thumbnail                   | `string\|null`     |
| `deleteFile()`           | Eliminar archivo (BD + físico)      | `void`             |
| `getFileStats()`         | Estadísticas de archivos            | `FileStats`        |
| `cleanupUploadedFiles()` | Limpiar archivos antiguos           | `number` (count)   |
| `getIneFiles()`          | Obtener INE front/back              | `{front, back}`    |

#### Tipos de Archivo

```typescript
type FileType = "photo" | "signature" | "ine_front" | "ine_back" | "file";
```

#### Ejemplo

```typescript
import { fileRepository } from "@/lib/db";

// 1. GUARDAR ARCHIVO
const fileId = await fileRepository.createFile({
  file_id: "file-uuid-1234",
  response_id: responseId,
  file_type: "ine_front",
  question_id: "q3-ine",
  local_path: "file:///data/ine_front.jpg",
  file_name: "ine_front.jpg",
  mime_type: "image/jpeg",
  ine_ocr_data: {
    claveElector: "ABC123",
    nombre: "JUAN PEREZ",
    confidence: 0.95,
  },
});

// 2. ACTUALIZAR OCR (después de procesamiento)
await fileRepository.updateOcrData(fileId, {
  claveElector: "ABC123456",
  nombre: "JUAN PEREZ",
  confidence: 0.98,
  processedAt: new Date().toISOString(),
});

// 3. MARCAR COMO SUBIDO
await fileRepository.markAsUploaded(
  fileId,
  "https://api.example.com/files/123",
);

// 4. OBTENER ARCHIVOS INE
const { front, back } = await fileRepository.getIneFiles(responseId);
console.log("INE Front:", front?.local_path);
console.log("INE Back:", back?.local_path);

// 5. LIMPIAR ARCHIVOS ANTIGUOS (liberar espacio)
const deletedCount = await fileRepository.cleanupUploadedFiles(7); // 7 días
console.log(`Liberados ${deletedCount} archivos`);
```

---

## 🚀 Ejemplos de Uso

### Flujo Completo: Crear y Sincronizar Respuesta

```typescript
import { responseRepository, syncRepository, fileRepository } from "@/lib/db";

async function createAndSyncSurveyResponse() {
  // 1. CREAR RESPUESTA (guardado inmediato)
  const responseId = await responseRepository.createResponse({
    response_id: crypto.randomUUID(),
    survey_id: "censo-2026",
    survey_version: "1.0.0",
    brigadista_user_id: "user-123",
    brigadista_name: "Juan Pérez",
    brigadista_role: "brigadista",
    device_platform: "android",
    device_os_version: "13",
    device_app_version: "1.0.0",
  });

  // 2. GUARDAR RESPUESTAS (auto-save cada pregunta)
  await responseRepository.updateAnswers({
    response_id: responseId,
    answers: {
      "q1-nombre": {
        questionId: "q1-nombre",
        questionType: QuestionType.TEXT,
        value: "Juan Pérez",
        answeredAt: new Date().toISOString(),
      },
    },
  });

  // 3. CAPTURAR FOTO INE
  const fileId = await fileRepository.createFile({
    file_id: crypto.randomUUID(),
    response_id: responseId,
    file_type: "ine_front",
    question_id: "q2-ine",
    local_path: "file:///data/ine.jpg",
    file_name: "ine.jpg",
    mime_type: "image/jpeg",
  });

  // 4. COMPLETAR RESPUESTA
  await responseRepository.completeResponse(responseId);

  // 5. AÑADIR A COLA DE SINCRONIZACIÓN
  await syncRepository.addToQueue({
    queue_id: crypto.randomUUID(),
    operation_type: "create_response",
    entity_type: "response",
    entity_id: responseId,
    payload: { response_id: responseId },
    priority: 1,
  });

  console.log("✅ Respuesta creada y en cola de sync");
}
```

### Hook para React: useResponse

```typescript
import { useEffect, useState } from "react";
import { responseRepository } from "@/lib/db";

export function useResponse(responseId: string) {
  const [response, setResponse] = useState(null);
  const [progress, setProgress] = useState({ percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data =
          await responseRepository.getResponseWithAnswers(responseId);
        const prog = await responseRepository.getResponseProgress(responseId);

        setResponse(data);
        setProgress(prog);
      } catch (error) {
        console.error("Error loading response:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [responseId]);

  const updateAnswers = async (answers) => {
    await responseRepository.updateAnswers({
      response_id: responseId,
      answers,
    });

    // Actualizar progreso
    const prog = await responseRepository.getResponseProgress(responseId);
    setProgress(prog);
  };

  return { response, progress, updateAnswers, loading };
}
```

---

## ✅ Mejores Prácticas

### 1. Inicialización

```typescript
// ❌ MAL: No inicializar
import { responseRepository } from "@/lib/db";
const response = await responseRepository.getResponseById("123"); // ERROR

// ✅ BIEN: Inicializar primero
import { initializeDatabase } from "@/lib/db";
await initializeDatabase();
// Ahora puedes usar todos los repositorios
```

### 2. Auto-save

```typescript
// ❌ MAL: Esperar al final
const answers = {};
// Usuario responde 10 preguntas...
await responseRepository.updateAnswers({ answers }); // Pierde datos si crashea

// ✅ BIEN: Auto-save en cada pregunta
function onAnswerChange(questionId, value) {
  await responseRepository.updateAnswers({
    response_id: currentResponseId,
    answers: {
      [questionId]: {
        questionId,
        questionType: QuestionType.TEXT,
        value,
        answeredAt: new Date().toISOString(),
      },
    },
  });
}
```

### 3. Transacciones

```typescript
// ❌ MAL: Múltiples operaciones sin transacción
await responseRepository.createResponse(...);
await fileRepository.createFile(...);
// Si la segunda falla, queda inconsistente

// ✅ BIEN: Usar transacción
import { db } from '@/lib/db';
await db.transaction(async (tx) => {
  await responseRepository.createResponse(...);
  await fileRepository.createFile(...);
  // Rollback automático si hay error
});
```

### 4. Sync Queue

```typescript
// ❌ MAL: Prioridad incorrecta
await syncRepository.addToQueue({
  priority: 10, // Baja prioridad para respuesta crítica
  ...
});

// ✅ BIEN: Prioridades correctas
// Alta prioridad (1-3): Respuestas, validaciones
await syncRepository.addToQueue({ priority: 1, ... });

// Media prioridad (4-6): Archivos
await syncRepository.addToQueue({ priority: 5, ... });

// Baja prioridad (7-10): Descargas, limpieza
await syncRepository.addToQueue({ priority: 8, ... });
```

### 5. Error Handling

```typescript
// ❌ MAL: No manejar errores
await responseRepository.createResponse(...); // Puede fallar

// ✅ BIEN: Try-catch con logging
try {
  await responseRepository.createResponse(...);
} catch (error) {
  console.error('Error creating response:', error);
  // Mostrar mensaje al usuario
  Alert.alert('Error', 'No se pudo guardar la respuesta');
}
```

---

## 🐛 Troubleshooting

### Error: "Database not initialized"

```typescript
// Causa: No llamaste a initializeDatabase()
// Solución:
import { initializeDatabase } from "@/lib/db";
await initializeDatabase(); // En app/_layout.tsx
```

### Error: "Cannot delete synced response"

```typescript
// Causa: Intentas borrar una respuesta ya sincronizada
const response = await responseRepository.getResponseById(id);
if (response.sync_status === "synced") {
  // No se puede eliminar
}
// Solución: Solo borrar drafts no sincronizados
```

### Progreso siempre 0%

```typescript
// Causa: No tienes el schema cargado
// Solución: Asegúrate de que la encuesta existe en la tabla surveys
const survey = await surveyRepository.getSurveyByIdAndVersion("id", "version");
console.log("Total questions:", survey.total_questions);
```

### Archivos no se suben

```typescript
// 1. Verificar que están en la cola
const pending = await fileRepository.getPendingFiles();
console.log("Pending files:", pending.length);

// 2. Verificar cola de sincronización
const operations = await syncRepository.getPendingOperations();
console.log("Pending operations:", operations.length);

// 3. Verificar errores
const stats = await syncRepository.getQueueStats();
console.log("Failed operations:", stats.failed);
```

---

## 📚 Referencias

- **Schema SQL completo**: `lib/db/schema.sql`
- **Documentación de schema**: `docs/DATABASE_SCHEMA.md`
- **Tipos TypeScript**: `types/survey-schema.types.ts`
- **Ejemplos de uso**: `lib/db/index.ts` (80 líneas de docs)

---

**📌 Recuerda**: Esta capa de acceso a datos es el **único punto de contacto** con SQLite. Nunca accedas directamente a la base de datos desde componentes React. Siempre usa los repositorios.

**✅ TOTAL**: 44+ métodos disponibles para toda la gestión de datos offline-first.
