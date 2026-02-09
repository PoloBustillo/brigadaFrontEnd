# 🏗️ ARQUITECTURA BRIGADA - Sistema de Encuestas Offline-First

## 📋 Índice

1. [Visión General](#visión-general)
2. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
3. [Modelo de Datos](#modelo-de-datos)
4. [Flujo de Guardado Inmediato](#flujo-de-guardado-inmediato)
5. [Sistema de Sincronización](#sistema-de-sincronización)
6. [Roadmap por Fases](#roadmap-por-fases)
7. [Stack Tecnológico](#stack-tecnológico)

---

## 🎯 Visión General

Sistema mobile para levantamiento de encuestas en campo con operación 100% offline y sincronización posterior al backend FastAPI.

### Características Clave

- ✅ **Offline-First**: Funciona sin internet, sincroniza cuando hay conexión
- ✅ **Guardado Inmediato**: Cada pregunta se guarda al instante
- ✅ **Schemas Dinámicos**: Encuestas definidas por JSON versionado
- ✅ **OCR Asistido**: Captura de INE con validación humana
- ✅ **Inmutabilidad**: Las respuestas no se editan una vez guardadas
- ✅ **Multi-rol**: Admin, Encargado, Brigadista

---

## 🧠 Decisiones Arquitectónicas

### 1. **SQLite como Única Fuente de Verdad**

**Por qué:**

- Persistencia confiable en el dispositivo
- Queries SQL para reportes offline
- Transacciones ACID
- No hay latencia de red

**Cómo:**

```typescript
// Todo se guarda aquí primero
await SurveyRepository.saveQuestionAnswer({
  responseId,
  questionId: "pregunta_1",
  questionType: "text",
  value: "Respuesta del usuario",
});
// ✅ Guardado inmediatamente en SQLite
```

---

### 2. **Zustand SOLO para UI**

**Por qué:**

- No mezclar estado de UI con datos persistentes
- SQLite es más confiable que memoria/AsyncStorage
- Simplifica el debugging

**Qué va en Zustand:**

- Loading states (`isLoading`, `isSyncing`)
- Modals abiertos/cerrados
- Navegación temporal
- Selección actual en la UI

**Qué NO va en Zustand:**

- ❌ Respuestas de encuestas
- ❌ Schemas de encuestas
- ❌ Datos de usuario
- ❌ Cola de sincronización

---

### 3. **Guardado Inmediato por Pregunta**

**Por qué:**

- **Resiliencia**: Si la app crashea, no se pierde nada
- **Simplicidad**: No hay "formularios complejos" en memoria
- **UX**: El usuario ve que su respuesta se guardó

**Flujo:**

```
Usuario responde pregunta
    ↓
Validación local (opcional)
    ↓
INSERT en questionAnswers (inmediato)
    ↓
UPDATE progress en surveyResponses
    ↓
UI muestra confirmación
```

**Código:**

```typescript
// En el componente de pregunta
const handleAnswerChange = async (value: string) => {
  await SurveyRepository.saveQuestionAnswer({
    responseId: currentSurvey.id,
    questionId: question.id,
    questionPath: "seccion1.pregunta1",
    questionType: "text",
    value,
  });
  // ✅ Ya está guardado en SQLite
};
```

---

### 4. **No React Hook Form para Encuestas**

**Por qué:**

- RHF está diseñado para formularios "submit al final"
- Nosotros guardamos cada campo al instante
- Schemas dinámicos no encajan bien con RHF

**Alternativa:**

- Componentes controlados simples
- Guardado directo a SQLite
- Validación bajo demanda

---

### 5. **Sincronización Unidireccional**

**Por qué:**

- Las respuestas NO se editan después de guardar
- Simplifica conflictos (no existen)
- El servidor es "append-only"

**Flujo:**

```
SQLite (Device) → FastAPI (Server)
                    ↓
                PostgreSQL (Persistencia final)
```

**No hay:**

- ❌ Merge conflicts
- ❌ CRDTs complejos
- ❌ Versionado de respuestas

---

### 6. **Versionado de Schemas**

**Por qué:**

- Encuestas pueden cambiar con el tiempo
- Brigadistas pueden tener versiones diferentes offline
- Respuestas antiguas deben seguir siendo válidas

**Cómo:**

```typescript
// Esquema v1
{
  version: 1,
  sections: [
    { questions: [{ id: 'nombre', type: 'text' }] }
  ]
}

// Esquema v2 (agregamos campo)
{
  version: 2,
  sections: [
    { questions: [
      { id: 'nombre', type: 'text' },
      { id: 'apellido', type: 'text' } // ⬅️ nuevo
    ]}
  ]
}

// Las respuestas v1 siguen funcionando
```

---

## 📊 Modelo de Datos

### Entidades Principales

```
users
  ↓ (collected_by)
survey_responses ←──→ survey_schemas (schema_id)
  ↓ (response_id)
question_answers
  ↓ (response_id)
attachments (fotos, INE, firma)
```

### Tabla Crítica: `survey_responses`

```sql
CREATE TABLE survey_responses (
  id TEXT PRIMARY KEY,              -- UUID local
  schema_id TEXT NOT NULL,          -- ¿Qué encuesta es?
  schema_version INTEGER NOT NULL,  -- ¿Qué versión?
  collected_by TEXT NOT NULL,       -- ¿Quién la levantó?
  status TEXT NOT NULL,             -- in_progress | completed | synced
  progress REAL NOT NULL,           -- 0.0 a 1.0 (%)
  started_at INTEGER NOT NULL,      -- Timestamp inicio
  completed_at INTEGER,             -- Timestamp fin
  synced_at INTEGER,                -- Timestamp sincronización
  -- Geolocalización
  latitude REAL,
  longitude REAL,
  -- Errores de sync
  sync_error TEXT,
  sync_retries INTEGER DEFAULT 0
);
```

### Tabla Crítica: `question_answers`

```sql
CREATE TABLE question_answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,        -- Relación con encuesta
  question_id TEXT NOT NULL,        -- Del schema JSON
  question_path TEXT NOT NULL,      -- e.g. "seccion1.pregunta2"
  question_type TEXT NOT NULL,      -- text | number | photo | ine
  value TEXT NOT NULL,              -- JSON flexible
  -- Para archivos
  file_uri TEXT,
  file_name TEXT,
  file_synced INTEGER DEFAULT 0,
  -- Timestamp
  answered_at INTEGER NOT NULL
);
```

---

## ⚡ Flujo de Guardado Inmediato

### Caso 1: Pregunta de Texto

```typescript
// 1. Usuario escribe "Juan Pérez"
// 2. Component detecta cambio (onChangeText)
// 3. Guardado inmediato:

await SurveyRepository.saveQuestionAnswer({
  responseId: "123-456",
  questionId: "nombre_completo",
  questionPath: "datos_personales.nombre",
  questionType: "text",
  value: "Juan Pérez",
});

// 4. SQLite: INSERT into question_answers
// 5. SQLite: UPDATE survey_responses SET progress = 0.05
// 6. UI: Muestra checkmark ✅
```

---

### Caso 2: Pregunta con Foto

```typescript
// 1. Usuario toma foto del INE (frente)
// 2. Foto se guarda en FileSystem
// 3. Guardado inmediato:

const fileUri = await FileSystem.moveAsync({
  from: result.uri,
  to: `${FileSystem.documentDirectory}ine_front_${Date.now()}.jpg`,
});

await SurveyRepository.saveQuestionAnswer({
  responseId: "123-456",
  questionId: "ine_frente",
  questionPath: "documentos.ine_frente",
  questionType: "photo",
  value: { captured: true },
  fileUri: fileUri,
  fileName: "ine_front_1234567890.jpg",
});

// 4. También se crea entrada en `attachments`:
await AttachmentRepository.create({
  responseId: "123-456",
  questionId: "ine_frente",
  type: "ine_front",
  localUri: fileUri,
  fileName: "ine_front_1234567890.jpg",
  mimeType: "image/jpeg",
  fileSize: 234567,
});

// 5. OCR se ejecuta en background (opcional)
// 6. UI: Muestra preview de la foto
```

---

### Caso 3: OCR de INE (Asistido)

```typescript
// 1. Usuario toma foto del INE
// 2. Se ejecuta OCR local (react-native-vision-camera + ML Kit)
// 3. OCR extrae datos:

const ocrData = await extractINEData(imageUri);
// {
//   nombres: "JUAN",
//   apellidoPaterno: "PEREZ",
//   claveElector: "PXJUAN12345678",
//   curp: "PEXJ900101HDFRZN01",
//   confidence: 0.87
// }

// 4. UI muestra datos extraídos para CONFIRMACIÓN HUMANA
<View>
  <Text>Nombre: {ocrData.nombres}</Text>
  <TextInput
    defaultValue={ocrData.nombres}
    onChangeText={(v) => setConfirmedName(v)}
  />
  <Text>CURP: {ocrData.curp}</Text>
  <TextInput
    defaultValue={ocrData.curp}
    onChangeText={(v) => setConfirmedCURP(v)}
  />
  <Button onPress={confirmData} title="Confirmar Datos" />
</View>

// 5. Al confirmar, se guardan los datos corregidos:
await SurveyRepository.saveQuestionAnswer({
  responseId: '123-456',
  questionId: 'datos_ine',
  questionPath: 'documentos.datos_ine',
  questionType: 'ine',
  value: {
    nombres: confirmedName,
    apellidoPaterno: confirmedApellidoPaterno,
    curp: confirmedCURP,
    claveElector: confirmedClave,
    ocrConfidence: ocrData.confidence,
    manuallyConfirmed: true
  }
});

// 6. Attachment se marca como confirmado
await AttachmentRepository.confirmOCR(attachmentId, confirmedData);
```

---

## 🔄 Sistema de Sincronización

### Arquitectura de Sync

```
┌─────────────────┐
│   SQLite (DB)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Sync Queue    │ ← Operaciones pendientes
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Sync Service   │ ← Background task
└────────┬────────┘
         │
         ↓ (cuando hay internet)
┌─────────────────┐
│  FastAPI Server │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │ ← Persistencia final
└─────────────────┘
```

---

### Cola de Sincronización

**Tabla: `sync_queue`**

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,  -- 'create_response' | 'upload_file'
  entity_type TEXT NOT NULL, -- 'survey_response' | 'attachment'
  entity_id TEXT NOT NULL,   -- UUID de la entidad
  payload TEXT NOT NULL,     -- JSON del objeto
  status TEXT NOT NULL,      -- 'pending' | 'processing' | 'completed' | 'failed'
  priority INTEGER DEFAULT 0, -- Más alto = más prioritario
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at INTEGER      -- Backoff exponencial
);
```

---

### Proceso de Sincronización

#### Paso 1: Detectar Elementos a Sincronizar

```typescript
// Cuando el usuario completa una encuesta:
await SurveyRepository.completeResponse(responseId);

// Automáticamente se agrega a sync_queue:
await SyncQueue.enqueue({
  operation: "create_response",
  entityType: "survey_response",
  entityId: responseId,
  payload: JSON.stringify({
    response: surveyResponse,
    answers: allAnswers,
  }),
  priority: 10, // Alta prioridad
});
```

---

#### Paso 2: Background Sync Service

```typescript
// Se ejecuta periódicamente (expo-task-manager)
async function syncPendingItems() {
  // 1. Verificar conectividad
  if (!isOnline()) return;

  // 2. Obtener items pendientes (ordenados por prioridad)
  const items = await SyncQueue.getPending();

  for (const item of items) {
    try {
      // 3. Marcar como "processing"
      await SyncQueue.updateStatus(item.id, "processing");

      // 4. Ejecutar sync según tipo
      if (item.operation === "create_response") {
        await syncSurveyResponse(item);
      } else if (item.operation === "upload_file") {
        await syncAttachment(item);
      }

      // 5. Marcar como "completed"
      await SyncQueue.updateStatus(item.id, "completed");

      // 6. Actualizar timestamp en entidad original
      await markAsSynced(item.entityType, item.entityId);
    } catch (error) {
      // 7. Manejar error con backoff
      await SyncQueue.handleFailure(item.id, error);
    }
  }
}
```

---

#### Paso 3: Sincronizar Respuesta

```typescript
async function syncSurveyResponse(item: SyncQueueItem) {
  const payload = JSON.parse(item.payload);

  // POST al servidor
  const response = await axios.post("/api/surveys/responses", {
    id: payload.response.id,
    schema_id: payload.response.schemaId,
    schema_version: payload.response.schemaVersion,
    collected_by: payload.response.collectedBy,
    started_at: payload.response.startedAt,
    completed_at: payload.response.completedAt,
    latitude: payload.response.latitude,
    longitude: payload.response.longitude,
    answers: payload.answers.map((a) => ({
      question_id: a.questionId,
      question_path: a.questionPath,
      question_type: a.questionType,
      value: a.value,
      answered_at: a.answeredAt,
    })),
  });

  if (response.status === 201) {
    console.log("✅ Survey synced successfully");
  }
}
```

---

#### Paso 4: Sincronizar Archivos (Fotos, INE)

```typescript
async function syncAttachment(item: SyncQueueItem) {
  const attachment = JSON.parse(item.payload);

  // 1. Leer archivo del FileSystem
  const fileContent = await FileSystem.readAsStringAsync(attachment.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Subir a S3 (presigned URL del backend)
  const uploadUrl = await getPresignedUploadUrl(attachment.id);

  await axios.put(uploadUrl, fileContent, {
    headers: { "Content-Type": attachment.mimeType },
  });

  // 3. Notificar al backend que se subió
  await axios.post("/api/attachments/confirm", {
    attachment_id: attachment.id,
    upload_url: uploadUrl,
  });

  // 4. Actualizar en SQLite
  await AttachmentRepository.markAsUploaded(attachment.id, uploadUrl);
}
```

---

### Priorización de Sincronización

1. **Prioridad Alta (10)**: Encuestas completas
2. **Prioridad Media (5)**: Archivos adjuntos
3. **Prioridad Baja (1)**: Metadata, logs

---

### Backoff Exponencial

```typescript
function calculateNextRetry(retries: number): Date {
  const baseDelay = 60000; // 1 minuto
  const delay = baseDelay * Math.pow(2, retries);
  const maxDelay = 3600000; // 1 hora máximo

  return new Date(Date.now() + Math.min(delay, maxDelay));
}

// Retry 1: 1 minuto
// Retry 2: 2 minutos
// Retry 3: 4 minutos
// Retry 4+: 1 hora (máximo)
```

---

## 🗺️ Roadmap por Fases

### **FASE 1: Fundamentos (Actual)** ✅

**Objetivo**: Base sólida offline-first

- [x] Schema de base de datos SQLite
- [x] Sistema de migraciones
- [x] Repository para encuestas
- [x] Guardado inmediato de preguntas
- [ ] UI básica para navegación
- [ ] Componentes de preguntas (text, number, date)
- [ ] Login y autenticación local

**Entregable**: App que permite crear encuesta y responder preguntas básicas offline.

---

### **FASE 2: Captura de Datos Avanzada**

**Objetivo**: Captura de fotos, firmas, INE

- [ ] Integración con `expo-camera` para fotos
- [ ] Componente de firma (canvas)
- [ ] Captura de INE (frente y reverso)
- [ ] OCR básico con `react-native-vision-camera`
- [ ] UI de confirmación de datos OCR
- [ ] Almacenamiento de archivos en FileSystem
- [ ] Compresión de imágenes

**Entregable**: App que captura INE con OCR asistido.

---

### **FASE 3: Sincronización**

**Objetivo**: Subir datos al backend

- [ ] Cola de sincronización (`sync_queue`)
- [ ] Background task con `expo-task-manager`
- [ ] Detección de conectividad
- [ ] Sincronización de respuestas
- [ ] Sincronización de archivos (S3)
- [ ] Backoff exponencial
- [ ] UI de estado de sincronización
- [ ] Manejo de errores

**Entregable**: App que sincroniza automáticamente cuando hay internet.

---

### **FASE 4: Gestión de Schemas**

**Objetivo**: Descargar y actualizar encuestas

- [ ] Endpoint de descarga de schemas
- [ ] Versionado de schemas
- [ ] Migración de schemas antiguos
- [ ] UI para seleccionar encuesta
- [ ] Cache de schemas
- [ ] Notificaciones de nuevas versiones

**Entregable**: App que descarga encuestas del servidor.

---

### **FASE 5: Roles y Permisos**

**Objetivo**: Multi-rol (Admin, Encargado, Brigadista)

- [ ] Autenticación con FastAPI
- [ ] Tokens JWT offline
- [ ] Permisos por rol
- [ ] UI de administrador
- [ ] Asignación de brigadistas
- [ ] Dashboard de progreso

**Entregable**: Sistema completo con roles.

---

### **FASE 6: Optimizaciones y Producción**

**Objetivo**: Listo para campo

- [ ] Compresión de base de datos
- [ ] Limpieza de archivos antiguos
- [ ] Telemetría y logs
- [ ] Modo demo/testing
- [ ] Documentación de usuario
- [ ] Testing end-to-end
- [ ] CI/CD con Expo EAS

**Entregable**: App en producción.

---

## 🛠️ Stack Tecnológico

### Frontend (Mobile)

- **Framework**: React Native + Expo (SDK 54)
- **Lenguaje**: TypeScript (strict mode)
- **Base de Datos**: SQLite (expo-sqlite)
- **ORM**: Drizzle ORM
- **Estado UI**: Zustand
- **Cámara**: expo-camera + react-native-vision-camera
- **OCR**: ML Kit (local)
- **Navegación**: expo-router
- **HTTP**: axios + @tanstack/react-query
- **Storage**: FileSystem API + expo-sqlite

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Base de Datos**: PostgreSQL
- **ORM**: SQLAlchemy
- **Storage**: AWS S3 / MinIO
- **Auth**: JWT

---

## 📐 Principios de Diseño

### 1. **Simplicidad sobre Complejidad**

- Preferir soluciones directas
- Evitar abstracciones innecesarias
- Código legible > código "clever"

### 2. **Offline-First Siempre**

- SQLite es la fuente de verdad
- Sincronización es un "extra"
- La app debe funcionar sin internet

### 3. **Guardado Inmediato**

- No esperar a "submit"
- Cada input guarda al instante
- El usuario no pierde datos

### 4. **Inmutabilidad de Respuestas**

- Una vez guardado, no se edita
- Simplifica sincronización
- Auditoría completa

### 5. **Escalabilidad Horizontal**

- Múltiples dispositivos
- Sin conflictos de escritura
- Cada dispositivo es independiente

---

## 🎨 Patrones de Código

### Repository Pattern

```typescript
// ✅ BIEN: Abstracción de datos
class SurveyRepository {
  static async saveAnswer(input: SaveAnswerInput) {
    const db = getDatabase();
    await db.insert(questionAnswers).values({...});
  }
}

// ❌ MAL: Queries directos en componentes
function SurveyScreen() {
  const db = getDatabase();
  await db.insert(questionAnswers).values({...}); // ❌
}
```

---

### Hooks Personalizados

```typescript
// ✅ BIEN: Lógica reutilizable
function useSurveyProgress(responseId: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function loadProgress() {
      const response = await SurveyRepository.getResponseById(responseId);
      setProgress(response.progress);
    }
    loadProgress();
  }, [responseId]);

  return progress;
}

// Uso en componente
function SurveyHeader() {
  const progress = useSurveyProgress(currentResponseId);
  return <ProgressBar value={progress} />;
}
```

---

### Error Boundaries

```typescript
// Manejar errores de SQLite gracefully
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    if (error.message.includes("SQLite")) {
      // Log error
      console.error("DB Error:", error);
      // Mostrar UI de fallback
      this.setState({ hasError: true });
    }
  }
}
```

---

## 🚀 Próximos Pasos Inmediatos

### 1. Configurar el App Entry Point

Modificar `app/_layout.tsx` para inicializar base de datos:

```typescript
import { useEffect } from 'react';
import { initDatabase } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

export default function RootLayout() {
  useEffect(() => {
    async function setupDatabase() {
      try {
        initDatabase();
        runMigrations();
        console.log('✅ Database ready');
      } catch (error) {
        console.error('❌ Database setup failed:', error);
      }
    }
    setupDatabase();
  }, []);

  return <Stack />;
}
```

---

### 2. Crear UI Básica de Encuesta

Crear `app/survey/[id].tsx`:

```typescript
// Screen para responder encuesta
function SurveyScreen({ params }: { params: { id: string } }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');

  const handleSaveAnswer = async () => {
    await SurveyRepository.saveQuestionAnswer({
      responseId: params.id,
      questionId: questions[currentQuestion].id,
      questionPath: questions[currentQuestion].path,
      questionType: 'text',
      value: answer
    });
    setCurrentQuestion(c => c + 1);
  };

  return (
    <View>
      <Text>{questions[currentQuestion].label}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        onBlur={handleSaveAnswer} // ⬅️ Guardado al salir del input
      />
    </View>
  );
}
```

---

### 3. Testing de Flujo Completo

```typescript
// test/survey-flow.test.ts
describe('Survey Flow', () => {
  it('should save answer immediately', async () => {
    // 1. Crear encuesta
    const responseId = await SurveyRepository.createResponse({...});

    // 2. Guardar respuesta
    await SurveyRepository.saveQuestionAnswer({
      responseId,
      questionId: 'q1',
      value: 'Test Answer'
    });

    // 3. Verificar que se guardó
    const answer = await SurveyRepository.getQuestionAnswer(responseId, 'q1');
    expect(answer.value).toBe('Test Answer');

    // 4. Verificar progreso
    const response = await SurveyRepository.getResponseById(responseId);
    expect(response.progress).toBeGreaterThan(0);
  });
});
```

---

## 📚 Recursos

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Offline-First Best Practices](https://offlinefirst.org/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

## 🎯 Criterios de Éxito

### Fase 1

- ✅ Base de datos funciona offline
- ✅ Preguntas se guardan inmediatamente
- ✅ No se pierde información al cerrar app

### Fase 2

- ✅ INE se captura y extrae datos con OCR
- ✅ Usuario puede corregir datos OCR
- ✅ Fotos se comprimen y almacenan

### Fase 3

- ✅ Sincronización automática en background
- ✅ Usuario ve estado de sincronización
- ✅ Reintentos con backoff exponencial

### Fase 4

- ✅ Encuestas se descargan del servidor
- ✅ Múltiples versiones coexisten
- ✅ Schemas se actualizan automáticamente

### Fase 5

- ✅ Login funciona offline (cached)
- ✅ Permisos por rol
- ✅ Dashboard de administración

### Fase 6

- ✅ App en producción
- ✅ 1000+ encuestas sincronizadas
- ✅ 0 pérdidas de datos

---

**Última actualización**: Febrero 2026 - Fase 1 en progreso
