# 🆕 Changelog: Metadata Adicional v2

## 📅 Fecha: Febrero 2026

## 🎯 Resumen

Se agregaron **15 nuevos campos** a la tabla `survey_responses` para capturar metadata más completa durante el levantamiento de encuestas.

---

## ✨ Nuevos Campos Agregados

### 1. Control de Tiempo ⏱️

| Campo      | Tipo      | Descripción                | Calculado     |
| ---------- | --------- | -------------------------- | ------------- |
| `duration` | `integer` | Duración total en segundos | ✅ Automático |

### 2. Información del Encuestado 👤

| Campo             | Tipo   | Descripción     | Requerido   |
| ----------------- | ------ | --------------- | ----------- |
| `respondentName`  | `text` | Nombre completo | ❌ Opcional |
| `respondentPhone` | `text` | Teléfono        | ❌ Opcional |
| `respondentEmail` | `text` | Email           | ❌ Opcional |

> **⚠️ IMPORTANTE**: Estos campos son **completamente opcionales y generalmente innecesarios**.
>
> En la mayoría de casos, es **mejor NO usar estos campos** y obtener la información directamente de las respuestas de la encuesta (`question_answers`).
>
> **Solo úsalos si**:
>
> - Necesitas identificar la encuesta ANTES de completarla
> - Requieres búsqueda ultra-rápida sin parsear respuestas
> - Necesitas indexación especial para reportes
>
> De lo contrario, mantén estos campos en `null`.

### 3. Geolocalización Mejorada 📍

| Campo                | Tipo        | Descripción           | Automático |
| -------------------- | ----------- | --------------------- | ---------- |
| `locationCapturedAt` | `timestamp` | Cuándo se capturó GPS | ✅ Si      |
| `address`            | `text`      | Dirección legible     | ❌ Manual  |

### 4. Metadata del Dispositivo 📱

| Campo        | Tipo   | Descripción          | Ejemplo                                    |
| ------------ | ------ | -------------------- | ------------------------------------------ |
| `deviceInfo` | `JSON` | Info del dispositivo | `{"model": "iPhone 14", "os": "iOS 17.2"}` |

### 5. Notas y Observaciones 📝

| Campo   | Tipo     | Descripción        | Uso                          |
| ------- | -------- | ------------------ | ---------------------------- |
| `notes` | `text`   | Comentarios libres | Observaciones del brigadista |
| `tags`  | `JSON[]` | Etiquetas          | `["urgente", "seguimiento"]` |

### 6. Validación y Auditoría ✅

| Campo         | Tipo        | Descripción      | Rol       |
| ------------- | ----------- | ---------------- | --------- |
| `isValidated` | `boolean`   | Si está validada | Encargado |
| `validatedBy` | `text`      | Quién validó     | Encargado |
| `validatedAt` | `timestamp` | Cuándo se validó | Encargado |

---

## 🔄 Cambios en el Código

### Schema (`lib/db/schema.ts`)

```diff
export const surveyResponses = sqliteTable("survey_responses", {
  // ... campos existentes ...

+ // ============ TIMESTAMPS ============
+ duration: integer("duration"),

+ // ============ INFORMACIÓN DEL ENCUESTADO ============
+ respondentName: text("respondent_name"),
+ respondentPhone: text("respondent_phone"),
+ respondentEmail: text("respondent_email"),

+ // ============ GEOLOCALIZACIÓN ============
+ locationCapturedAt: integer("location_captured_at", { mode: "timestamp" }),
+ address: text("address"),

+ // ============ METADATA DEL DISPOSITIVO ============
+ deviceInfo: text("device_info", { mode: "json" }).$type<{
+   model?: string;
+   os?: string;
+   appVersion?: string;
+ }>(),

+ // ============ NOTAS Y OBSERVACIONES ============
+ notes: text("notes"),
+ tags: text("tags", { mode: "json" }).$type<string[]>(),

+ // ============ VALIDACIÓN Y AUDITORÍA ============
+ isValidated: integer("is_validated", { mode: "boolean" }).default(false),
+ validatedBy: text("validated_by").references(() => users.id),
+ validatedAt: integer("validated_at", { mode: "timestamp" }),
});
```

### Migraciones (`lib/db/migrations.ts`)

```diff
+ /**
+  * v2: Agregar metadata adicional a survey_responses
+  */
+ const migration_v2_add_survey_metadata: Migration = {
+   version: 2,
+   name: "add_survey_metadata",
+   up: (db) => {
+     // 15 ALTER TABLE statements para agregar columnas
+   },
+ };
```

### Repositorio (`lib/repositories/survey-repository.ts`)

```diff
+ export type UpdateSurveyMetadataInput = {
+   respondentName?: string;
+   respondentPhone?: string;
+   respondentEmail?: string;
+   notes?: string;
+   tags?: string[];
+   address?: string;
+ };
+
+ export type ValidateSurveyInput = {
+   responseId: string;
+   validatedBy: string;
+   isValidated: boolean;
+ };

export class SurveyRepository {
  static async createResponse(input: CreateSurveyResponseInput) {
+   // Ahora acepta respondentName, respondentPhone, respondentEmail, deviceInfo
  }

  static async completeResponse(responseId: string) {
+   // Ahora calcula automáticamente 'duration'
  }

+ /**
+  * Actualiza metadata de la encuesta
+  */
+ static async updateMetadata(
+   responseId: string,
+   input: UpdateSurveyMetadataInput
+ ): Promise<void> { ... }

+ /**
+  * Valida o invalida una encuesta (usado por encargados)
+  */
+ static async validateResponse(input: ValidateSurveyInput): Promise<void> { ... }
}
```

---

## 🎯 Casos de Uso Nuevos

### 1. Captura de Info del Encuestado

```typescript
// Al iniciar encuesta
const responseId = await SurveyRepository.createResponse({
  // ... otros campos ...
  respondentName: "María González",
  respondentPhone: "5512345678",
  respondentEmail: "maria@example.com",
});
```

### 2. Agregar Notas Durante Encuesta

```typescript
await SurveyRepository.updateMetadata(responseId, {
  notes: "Persona muy cooperativa. Mostró interés en programas sociales.",
  tags: ["seguimiento", "alta-prioridad"],
});
```

### 3. Workflow de Validación

```typescript
// Encargado revisa y valida
await SurveyRepository.validateResponse({
  responseId: "uuid-123",
  validatedBy: encargadoId,
  isValidated: true,
});
```

### 4. Análisis de Duración

```typescript
const survey = await SurveyRepository.getResponseById(responseId);
const minutes = Math.floor(survey.duration / 60);
console.log(`Encuesta completada en ${minutes} minutos`);
```

---

## 📊 Comparación: Antes vs Después

### ANTES (v1)

```typescript
{
  id: "uuid-123",
  status: "completed",
  progress: 1.0,
  startedAt: "2024-02-09T10:00:00Z",
  completedAt: "2024-02-09T10:15:00Z",
  latitude: 19.4326,
  longitude: -99.1332,
}
```

### DESPUÉS (v2)

```typescript
{
  id: "uuid-123",
  status: "completed",
  progress: 1.0,
  startedAt: "2024-02-09T10:00:00Z",
  completedAt: "2024-02-09T10:15:00Z",
  duration: 900, // 15 minutos = 900 segundos ✨

  // Info del encuestado ✨
  respondentName: "María González Pérez",
  respondentPhone: "5512345678",
  respondentEmail: "maria@example.com",

  // Geo mejorada ✨
  latitude: 19.4326,
  longitude: -99.1332,
  locationCapturedAt: "2024-02-09T10:00:00Z",
  address: "Calle Reforma #123, Col. Centro, CDMX",

  // Dispositivo ✨
  deviceInfo: {
    model: "iPhone 14 Pro",
    os: "iOS 17.2",
    appVersion: "1.2.3"
  },

  // Notas ✨
  notes: "Persona cooperativa, familia de 4 miembros",
  tags: ["seguimiento", "familia-numerosa"],

  // Validación ✨
  isValidated: true,
  validatedBy: "encargado-uuid-456",
  validatedAt: "2024-02-09T11:00:00Z",
}
```

---

## ✅ Checklist de Migración

- [x] ✅ Schema actualizado (`lib/db/schema.ts`)
- [x] ✅ Migración v2 creada (`lib/db/migrations.ts`)
- [x] ✅ Repositorio actualizado con nuevos métodos
- [x] ✅ Tipos TypeScript agregados
- [x] ✅ Documentación creada (`METADATA_GUIDE.md`)
- [x] ✅ Changelog creado
- [ ] ⏳ UI Components para captura de metadata
- [ ] ⏳ Validadores de teléfono/email
- [ ] ⏳ Pantalla de validación para encargados
- [ ] ⏳ Dashboard con estadísticas de duración

---

## 🚀 Próximos Pasos

1. **Aplicar migración**: La migración v2 se aplica automáticamente al iniciar la app
2. **Actualizar UI**: Agregar campos en el formulario de inicio de encuesta
3. **Implementar validación**: Crear pantalla para que encargados validen encuestas
4. **Agregar analytics**: Dashboard con métricas de duración y validación

---

## 📚 Documentación Relacionada

- **Guía de Uso**: `METADATA_GUIDE.md` (ejemplos completos)
- **Schema Completo**: `lib/db/schema.ts` (líneas 74-132)
- **Migraciones**: `lib/db/migrations.ts` (migración v2)
- **Repositorio**: `lib/repositories/survey-repository.ts` (métodos nuevos)

---

## 🆘 Soporte

Si tienes preguntas sobre estos cambios:

1. Lee `METADATA_GUIDE.md` para ejemplos de uso
2. Revisa el código en `lib/repositories/survey-repository.ts`
3. Consulta los casos de uso prácticos en este documento

**¡Disfruta los nuevos campos! 🎉**
