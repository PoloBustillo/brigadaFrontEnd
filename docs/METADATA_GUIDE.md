# 📋 Guía de Uso: Metadata Adicional en Encuestas

## Resumen de Cambios

Se agregaron **15 nuevos campos** a la tabla `survey_responses` para capturar información más completa y útil durante el levantamiento de encuestas en campo.

## Nuevos Campos Disponibles

### 1️⃣ Control de Tiempo

- `duration` (integer): Duración total en segundos (calculado automáticamente)

### 2️⃣ Información del Encuestado (OPCIONAL)

- `respondentName` (text): Nombre completo
- `respondentPhone` (text): Teléfono de contacto
- `respondentEmail` (text): Email (opcional)

> **⚠️ NOTA IMPORTANTE**: Estos campos son **completamente opcionales** y en muchos casos **redundantes**.
>
> Si tu encuesta ya captura el nombre, teléfono y email como preguntas normales, **NO necesitas usar estos campos**. Solo úsalos si necesitas:
>
> - Acceso ultra-rápido a esta info sin parsear respuestas
> - Identificar la encuesta antes de que se complete
> - Indexación especial para búsquedas
>
> **Recomendación**: Deja estos campos en `null` y obtén la info de las respuestas directamente.

### 3️⃣ Geolocalización Mejorada

- `locationCapturedAt` (timestamp): Cuándo se capturó la ubicación
- `address` (text): Dirección legible (si hay geocoding)

### 4️⃣ Metadata del Dispositivo

- `deviceInfo` (JSON): Información del dispositivo
  ```json
  {
    "model": "iPhone 14 Pro",
    "os": "iOS 17.2",
    "appVersion": "1.2.3"
  }
  ```

### 5️⃣ Notas y Observaciones

- `notes` (text): Comentarios libres del brigadista
- `tags` (JSON array): Etiquetas para filtrado
  ```json
  ["urgente", "seguimiento", "verificar"]
  ```

### 6️⃣ Validación y Auditoría

- `isValidated` (boolean): Si fue revisada por un encargado
- `validatedBy` (text): ID del usuario que validó
- `validatedAt` (timestamp): Cuándo se validó

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Crear Encuesta SIN Info del Encuestado (Recomendado)

```typescript
import { SurveyRepository } from "@/lib/repositories/survey-repository";
import * as Device from "expo-device";
import * as Location from "expo-location";
import Constants from "expo-constants";

// Obtener ubicación
const location = await Location.getCurrentPositionAsync({});

// Crear encuesta simple - La info del encuestado vendrá de las respuestas
const responseId = await SurveyRepository.createResponse({
  schemaId: "census-2024-v2",
  schemaVersion: 2,
  collectedBy: currentUserId,

  // Geolocalización
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracy: location.coords.accuracy,

  // Metadata del dispositivo
  deviceInfo: {
    model: Device.modelName || "Unknown",
    os: `${Device.osName} ${Device.osVersion}`,
    appVersion: Constants.expoConfig?.version || "1.0.0",
  },

  // NO incluir respondentName/Phone/Email aquí
  // Se obtendrán de las preguntas de la encuesta
});
```

### Ejemplo 1b: Crear Encuesta CON Info del Encuestado (Solo si es necesario)

```typescript
// Solo usar si necesitas identificar la encuesta ANTES de completarla
// o si necesitas búsqueda ultra-rápida sin parsear respuestas
const responseId = await SurveyRepository.createResponse({
  schemaId: "census-2024-v2",
  schemaVersion: 2,
  collectedBy: currentUserId,

  // Info del encuestado (OPCIONAL - solo si realmente lo necesitas)
  respondentName: "María González Pérez",
  respondentPhone: "5512345678",
  respondentEmail: "maria.gonzalez@example.com",

  // Geolocalización
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracy: location.coords.accuracy,

  // Metadata del dispositivo
  deviceInfo: {
    model: Device.modelName || "Unknown",
    os: `${Device.osName} ${Device.osVersion}`,
    appVersion: Constants.expoConfig?.version || "1.0.0",
  },
});
```

### Ejemplo 2: Actualizar Metadata Durante la Encuesta

```typescript
// El brigadista puede agregar notas mientras levanta la encuesta
await SurveyRepository.updateMetadata(responseId, {
  notes:
    "La persona mostró interés en el programa. Tiene 3 hijos menores de edad.",
  tags: ["seguimiento", "familia-numerosa"],
  address: "Calle Reforma #123, Col. Centro, CDMX",
});
```

### Ejemplo 3: Validar Encuesta (Rol: Encargado)

```typescript
// El encargado revisa y valida la encuesta
await SurveyRepository.validateResponse({
  responseId: "uuid-123-456",
  validatedBy: encargadoUserId,
  isValidated: true, // true = aprobada, false = rechazada
});
```

### Ejemplo 4: Completar Encuesta (Con Cálculo Automático de Duración)

```typescript
// Al finalizar, se calcula automáticamente la duración
await SurveyRepository.completeResponse(responseId);

// Internamente calcula:
// duration = completedAt - startedAt (en segundos)
// Ejemplo: si tardó 15 minutos = 900 segundos
```

### Ejemplo 5: Listar Encuestas con Duración

```typescript
// Obtener encuesta con todos los datos
const response = await SurveyRepository.getResponseById(responseId);

console.log(`
  Encuesta: ${response.id}
  Encuestado: ${response.respondentName}
  Teléfono: ${response.respondentPhone}
  Duración: ${response.duration}s (${Math.floor(response.duration / 60)} min)
  Dispositivo: ${response.deviceInfo?.model}
  Validada: ${response.isValidated ? "Sí" : "No"}
  Notas: ${response.notes}
  Tags: ${response.tags?.join(", ")}
`);
```

---

## 🎯 Casos de Uso Prácticos

### Caso 1: Obtener Info del Encuestado de las Respuestas (Recomendado)

```typescript
// Método recomendado: Obtener de las respuestas directamente
const survey = await SurveyRepository.getResponseById(responseId);

// Buscar respuestas específicas
const nombreRespuesta = survey.answers.find((a) => a.questionId === "nombre");
const telefonoRespuesta = survey.answers.find(
  (a) => a.questionId === "telefono",
);
const emailRespuesta = survey.answers.find((a) => a.questionId === "email");

console.log(`
  Encuestado: ${nombreRespuesta?.value}
  Teléfono: ${telefonoRespuesta?.value}
  Email: ${emailRespuesta?.value}
  Duración: ${Math.floor(survey.duration / 60)} min
`);

// No necesitas respondentName, respondentPhone, respondentEmail en la tabla
```

### Caso 1b: Captura en Dos Fases (Solo si necesitas estos campos)

**Fase 1: Inicio rápido**

```typescript
// El brigadista inicia la encuesta sin info del encuestado
const responseId = await SurveyRepository.createResponse({
  schemaId: "census-2024-v2",
  schemaVersion: 2,
  collectedBy: currentUserId,
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  deviceInfo: getDeviceInfo(),
  // NO incluir respondentName/Phone/Email
});
```

**Fase 2: Agregar info después de primeras preguntas (opcional)**

```typescript
// Solo si realmente necesitas estos campos para búsqueda rápida
await SurveyRepository.updateMetadata(responseId, {
  respondentName: respuesta_pregunta_1,
  respondentPhone: respuesta_pregunta_2,
  respondentEmail: respuesta_pregunta_3,
});
```

### Caso 2: Sistema de Etiquetas para Filtrado

```typescript
// Agregar tags según respuestas
const tags: string[] = [];

if (edad > 65) tags.push("adulto-mayor");
if (tieneHijos) tags.push("con-hijos");
if (necesitaApoyo) tags.push("seguimiento", "urgente");

await SurveyRepository.updateMetadata(responseId, { tags });
```

### Caso 3: Workflow de Validación

```typescript
// 1. Brigadista completa encuesta
await SurveyRepository.completeResponse(responseId);

// 2. Encargado la revisa
const survey = await SurveyRepository.getResponseById(responseId);

if (survey.duration < 60) {
  // Sospechoso: tardó menos de 1 minuto
  await SurveyRepository.validateResponse({
    responseId,
    validatedBy: encargadoId,
    isValidated: false,
  });
} else {
  // Todo bien
  await SurveyRepository.validateResponse({
    responseId,
    validatedBy: encargadoId,
    isValidated: true,
  });
}
```

### Caso 4: Análisis de Rendimiento

```typescript
// Query para analizar productividad
const surveys = await SurveyRepository.listResponses(brigadistaId);

const stats = {
  total: surveys.length,
  avgDuration:
    surveys.reduce((acc, s) => acc + (s.duration || 0), 0) / surveys.length,
  validated: surveys.filter((s) => s.isValidated).length,
  withNotes: surveys.filter((s) => s.notes).length,
};

console.log(`
  📊 Estadísticas del Brigadista:
  - Total de encuestas: ${stats.total}
  - Duración promedio: ${Math.floor(stats.avgDuration / 60)} minutos
  - Validadas: ${stats.validated}/${stats.total} (${((stats.validated / stats.total) * 100).toFixed(1)}%)
  - Con notas: ${stats.withNotes}
`);
```

---

## 🔄 Migración de Datos Existentes

Si ya tienes encuestas creadas antes de esta actualización, los nuevos campos estarán en `null` por defecto. Puedes actualizarlos con:

```typescript
// Actualizar encuestas existentes con metadata
const existingResponses = await SurveyRepository.listResponses(userId);

for (const response of existingResponses) {
  await SurveyRepository.updateMetadata(response.id, {
    deviceInfo: getDeviceInfo(), // Agregar info del dispositivo actual
    // Los demás campos quedan en null hasta que se editen
  });
}
```

---

## 📱 UI Sugerida

### Pantalla de Inicio de Encuesta (Versión Simple - Recomendada)

```
┌─────────────────────────────────┐
│ Nueva Encuesta                  │
├─────────────────────────────────┤
│                                 │
│ 📍 Ubicación capturada          │
│    19.4326, -99.1332            │
│    Precisión: 5m                │
│                                 │
│ 📱 Dispositivo: iPhone 14 Pro   │
│                                 │
│      [Iniciar Encuesta]         │
│                                 │
└─────────────────────────────────┘

Nota: El nombre, teléfono y email se
capturarán como preguntas normales
en la encuesta.
```

### Pantalla de Inicio de Encuesta (Con Captura Previa - Opcional)

```
┌─────────────────────────────────┐
│ Nueva Encuesta                  │
├─────────────────────────────────┤
│                                 │
│ Nombre del encuestado (opcional)│
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Teléfono (opcional)             │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📍 Ubicación capturada          │
│    19.4326, -99.1332            │
│                                 │
│      [Iniciar Encuesta]         │
│                                 │
└─────────────────────────────────┘

Solo llenar si necesitas identificar
la encuesta antes de completarla.
```

### Durante la Encuesta - Botón de Notas

```
┌─────────────────────────────────┐
│ Pregunta 5 de 20                │
├─────────────────────────────────┤
│                                 │
│ ¿Tiene hijos menores de edad?   │
│                                 │
│  ( ) Sí    (•) No               │
│                                 │
│                                 │
│  📝 [Agregar nota]              │
│                                 │
│      [← Anterior] [Siguiente →] │
│                                 │
└─────────────────────────────────┘
```

### Pantalla de Validación (Encargado)

```
┌─────────────────────────────────┐
│ Validación de Encuesta          │
├─────────────────────────────────┤
│                                 │
│ Encuestado: María González      │
│ Brigadista: Juan Pérez          │
│ Duración: 12 minutos            │
│ Progreso: 100%                  │
│ Dispositivo: iPhone 14 Pro      │
│                                 │
│ 📍 Ubicación:                   │
│    Calle Reforma #123           │
│    19.4326, -99.1332            │
│                                 │
│ 📝 Notas del brigadista:        │
│    "Persona cooperativa..."     │
│                                 │
│ 🏷️  Tags: seguimiento, urgente  │
│                                 │
│    [❌ Rechazar] [✅ Aprobar]   │
│                                 │
└─────────────────────────────────┘
```

---

## ⚠️ Consideraciones

1. **Performance**: Los campos JSON (`deviceInfo`, `tags`) se serializan automáticamente
2. **Privacidad**: El email es opcional y debe tener consentimiento
3. **Validación**: Los encargados pueden validar encuestas antes de sincronizar
4. **Duración**: Se calcula automáticamente al completar, no editable manualmente
5. **Direcciones**: El campo `address` es para geocoding reverso (coordenadas → dirección)
6. **⭐ Info del Encuestado**: Los campos `respondentName/Phone/Email` son **completamente opcionales y generalmente innecesarios**. En la mayoría de casos es mejor obtener esta información directamente de las respuestas de la encuesta. Solo úsalos si necesitas búsqueda ultra-rápida o identificación antes de completar la encuesta.

---

## 🚀 Próximos Pasos

1. ✅ **Schema actualizado** con 15 nuevos campos
2. ✅ **Migración v2** creada (se aplica automáticamente)
3. ✅ **Repositorio actualizado** con nuevos métodos
4. ⏳ **UI Components**: Crear formularios para capturar esta metadata
5. ⏳ **Validación de Datos**: Agregar validadores para teléfono/email
6. ⏳ **Reportes**: Dashboard con estadísticas de duración y validación

---

## 📚 Referencias

- Schema completo: `lib/db/schema.ts` (líneas 74-132)
- Migración v2: `lib/db/migrations.ts` (líneas 228-291)
- Repositorio: `lib/repositories/survey-repository.ts`
- Tipos TypeScript: Exportados desde el repositorio
