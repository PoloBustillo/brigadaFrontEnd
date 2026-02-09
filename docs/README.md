# 📚 Documentación - BRIGADA

Índice completo de la documentación del proyecto.

---

## 🚀 Guía de Lectura Recomendada

### Para Nuevos Desarrolladores (Ruta Rápida - 1 hora)

1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) (10 min) ⭐
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Sección "Decisiones Clave" (15 min) ⭐⭐⭐
3. [NEXT_STEPS.md](./NEXT_STEPS.md) - Primeros 5 pasos (15 min) ⭐⭐⭐
4. [CHEATSHEET.md](./CHEATSHEET.md) - Referencia rápida (20 min) ⭐

### Para Arquitectos/CTOs (Ruta Estratégica - 45 min)

1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) (10 min) ⭐
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Completo (30 min) ⭐⭐⭐
3. [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - Overview (5 min) ⭐⭐

### Para Implementadores (Ruta Técnica - 2 horas)

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Modelo de datos (30 min) ⭐⭐⭐
2. [SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md) (20 min) ⭐⭐
3. [METADATA_GUIDE.md](./METADATA_GUIDE.md) (20 min) ⭐
4. [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) (30 min) ⭐⭐
5. [NEXT_STEPS.md](./NEXT_STEPS.md) (20 min) ⭐⭐⭐

---

## 📖 Documentación por Categoría

### 🎯 Resumen Ejecutivo

- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** ⭐
  - Estado actual del proyecto (Fase 1 - 80% completada)
  - Stack tecnológico
  - Decisiones arquitectónicas clave
  - Roadmap de 6 fases
  - Próximos pasos inmediatos
  - **Tiempo de lectura: 10 minutos**

---

### 🏗️ Arquitectura

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** ⭐⭐⭐
  - Arquitectura completa del sistema
  - Principios offline-first
  - Modelo de datos detallado (8 tablas)
  - Flujos de guardado inmediato
  - Sistema de sincronización
  - Roadmap de 6 fases
  - **Tiempo de lectura: 30 minutos**

- **[ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md)** ⭐⭐ 🆕
  - Nueva arquitectura feature-based
  - Organización por features (questions/, surveys/, sync/)
  - Principios de diseño
  - Componentes clave
  - Flujo de datos
  - **Tiempo de lectura: 20 minutos**

- **[SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md)** ⭐⭐⭐ 🔥 **NUEVO**
  - ⚠️ **DOCUMENTO CLAVE**: Especificación completa del schema JSON
  - 18+ tipos de preguntas soportados
  - Validaciones declarativas
  - Lógica condicional (AND/OR)
  - Campo especial INE + OCR
  - Metadata automática
  - 3 ejemplos completos y realistas:
    - Censo poblacional básico
    - Registro con captura de INE + OCR automático
    - Encuesta de salud con lógica condicional compleja
  - Mejores prácticas de diseño
  - Versionado semántico explicado
  - **Tiempo de lectura: 30 minutos**
  - **📌 LECTURA OBLIGATORIA antes de diseñar encuestas**

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** ⭐⭐⭐ 🔥 **NUEVO**
  - ⚠️ **DOCUMENTO ESENCIAL**: Schema completo de SQLite
  - 7 tablas principales + 3 vistas útiles
  - Sincronización offline-first con cola de reintentos
  - Gestión de archivos locales (INE, fotos, firmas)
  - Triggers automáticos de auditoría
  - Índices optimizados para queries frecuentes
  - Estrategia de versionado y migración
  - 10+ queries comunes documentadas
  - Relaciones y foreign keys explicadas
  - **Tiempo de lectura: 35 minutos**
  - **📌 LECTURA OBLIGATORIA antes de implementar persistencia**

---

- Modelo de datos (8 tablas)
- Sistema de guardado inmediato
- Estrategia de sincronización
- Manejo de archivos e imágenes
- Seguridad y encriptación
- **Tiempo de lectura: 30 minutos**

- **[ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md)** ⭐⭐⭐ **NUEVO**
  - Nueva estructura de carpetas feature-based
  - Sistema de preguntas dinámicas
  - Motor de encuestas (SurveyEngine)
  - Estado global con Zustand
  - Componentes UI reutilizables
  - Flujo de datos completo
  - **Tiempo de lectura: 25 minutos**

- **[FORMS_SYSTEM.md](./FORMS_SYSTEM.md)** ⭐⭐ **NUEVO** 📝
  - **Dos sistemas de formularios diferentes**
  - Sistema Custom para encuestas dinámicas (QuestionRenderer)
  - React Hook Form SOLO para login/registro
  - Tabla comparativa y cuándo usar cada uno
  - Anti-patrones y mejores prácticas
  - **Tiempo de lectura: 15 minutos**
  - **⚠️ LEER ANTES de implementar formularios**

---

### 💾 Base de Datos

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** ⭐⭐⭐ 🔥 **ESENCIAL**
  - Schema completo de SQLite (7 tablas + 3 vistas)
  - Sincronización offline-first
  - Gestión de archivos locales
  - Triggers y auditoría
  - 10+ queries comunes
  - **Tiempo de lectura: 35 minutos**
  - **📌 LECTURA OBLIGATORIA antes de implementar persistencia**

- **[DATA_ACCESS_LAYER.md](./DATA_ACCESS_LAYER.md)** ⭐⭐⭐ 🔥 **NUEVO**
  - **Guía completa de la capa de acceso a datos**
  - **4 Repositorios implementados** (44+ métodos)
  - DatabaseManager (conexión + transacciones)
  - SurveyRepository (8 métodos)
  - ResponseRepository (17 métodos) - CORE
  - SyncRepository (8 métodos)
  - FileRepository (15 métodos) - Actualizado para Cloudinary
  - Ejemplos completos de uso
  - Mejores prácticas
  - Troubleshooting
  - **Tiempo de lectura: 40 minutos**
  - **📌 GUÍA DEFINITIVA para usar repositorios**

- **[CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md)** ⭐⭐⭐ 🔥 **NUEVO**
  - **Arquitectura completa de upload con Cloudinary**
  - Flujo de signed uploads (seguro)
  - Implementación Backend (FastAPI)
  - Implementación Mobile (React Native)
  - Seguridad y autorización
  - Metadata en PostgreSQL vs SQLite
  - 3 casos de uso completos
  - Troubleshooting
  - **Tiempo de lectura: 45 minutos**
  - **📌 LECTURA OBLIGATORIA antes de implementar uploads**

- **Capa de Acceso a Datos (Repositories)** ⭐⭐⭐ 🔥 **ACTUALIZADO**
  - **Ubicación**: `lib/db/repositories/`
  - **4 Repositorios implementados**:
    - **SurveyRepository**: CRUD de encuestas (8 métodos)
    - **ResponseRepository**: Lifecycle de respuestas (17 métodos) - CORE
    - **SyncRepository**: Cola de sincronización (8 métodos)
    - **FileRepository**: Gestión de archivos locales (11 métodos)
  - **Total: 44+ métodos** disponibles
  - **Características clave**:
    - ✅ Guardado inmediato (createResponse)
    - ✅ Auto-save en cada pregunta (updateAnswers)
    - ✅ Progress tracking (getResponseProgress)
    - ✅ Sync queue con prioridades
    - ✅ Manejo de archivos (fotos, INE, firmas)
    - ✅ OCR data storage
    - ✅ Transaction support
  - **Ver ejemplos de uso**: `lib/db/index.ts` (80 líneas de docs)
  - **Tiempo de revisión: 30 minutos** (código + ejemplos)
  - **📌 Usar estos repositorios para TODA interacción con BD**

- **[MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)** ⭐⭐ 🔄
  - Sistema de migraciones explicado paso a paso
  - Cómo funciona el versionado
  - Crear nuevas migraciones
  - Mejores prácticas (DO's y DON'Ts)
  - Troubleshooting completo
  - Testing de migraciones
  - **Tiempo de lectura: 30 minutos**

- **[MIGRATIONS_VISUAL.md](./MIGRATIONS_VISUAL.md)** ⭐ 🔄
  - Diagramas ASCII del flujo completo
  - Ejemplos de escenarios prácticos
  - Experimentos mentales
  - Checklist para crear migraciones
  - **Tiempo de lectura: 15 minutos**

- **[MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md)** ⭐⭐ 🔄 **NUEVO**
  - **¿De dónde vienen las migraciones?**
  - Ciclo de vida completo: Desarrollo → Build → Usuario
  - Cuándo y dónde se crean las migraciones
  - Funcionamiento offline-first
  - Preguntas frecuentes (6 P&R)
  - **Tiempo de lectura: 25 minutos**
  - **📌 Lee esto si te preguntas cómo funcionan las migraciones**

- **[METADATA_GUIDE.md](./METADATA_GUIDE.md)** ⭐ 📋
  - Guía de 15 campos adicionales agregados en v2
  - Ejemplos de uso prácticos
  - Casos de uso: validación, notas, tags, duración
  - UI sugerida para captura
  - Consideraciones de privacidad
  - **Tiempo de lectura: 20 minutos**

---

### 📋 Schemas y JSON

- **[SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md)** ⭐⭐
  - Ejemplos completos de schemas JSON
  - Encuesta básica (texto, número, booleano)
  - Encuesta con lógica condicional
  - Encuesta con captura de INE y OCR
  - Versionado de schemas
  - Validaciones y reglas
  - **Tiempo de lectura: 20 minutos**

---

### 🛠️ Implementación

- **[NEXT_STEPS.md](./NEXT_STEPS.md)** ⭐⭐⭐
  - Pasos concretos para completar Fase 1 (20% restante)
  - 5 pasos inmediatos con código de ejemplo:
    1. Inicializar DB en app/\_layout.tsx (15 min)
    2. Crear seed data (30 min)
    3. Hook de usuario actual (30 min)
    4. Pantalla de lista de encuestas (1 hora)
    5. Testing básico (30 min)
  - Checklist de tareas
  - Scripts de validación
  - **Tiempo de lectura: 20 minutos**
  - **Tiempo de implementación: ~3 horas**

- **[README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md)** ⭐⭐
  - Resumen técnico de lo implementado hasta ahora
  - Estructura del proyecto detallada
  - Patrones de código utilizados
  - Estado de validación por fase
  - Archivos creados (lista completa)
  - **Tiempo de lectura: 15 minutos**

---

### 📚 Referencias Rápidas

- **[CHEATSHEET.md](./CHEATSHEET.md)** ⭐
  - Snippets de código listos para usar
  - Comandos frecuentes
  - Patrones comunes (queries, inserts, updates)
  - Ejemplos de uso del repositorio
  - Quick start para desarrollo
  - **Tiempo de lectura: 20 minutos**
  - **Uso: Referencia constante durante desarrollo**

- **[CHANGELOG_v2.md](./CHANGELOG_v2.md)** 📋
  - Changelog detallado de la versión 2
  - Nuevos campos agregados a `survey_responses`
  - Comparación antes/después con ejemplos
  - Migración v2 explicada
  - Checklist de actualización
  - **Tiempo de lectura: 10 minutos**

---

## 🎓 Recursos por Rol

### 👨‍💻 Desarrollador Frontend (React Native)

**Prioridad alta:**

1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. [NEXT_STEPS.md](./NEXT_STEPS.md)
3. [CHEATSHEET.md](./CHEATSHEET.md)
4. [SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md)

**Prioridad media:** 5. [ARCHITECTURE.md](./ARCHITECTURE.md) - Secciones de UI/UX 6. [METADATA_GUIDE.md](./METADATA_GUIDE.md)

### 🗄️ Desarrollador Backend (Database/Sync)

**Prioridad alta:**

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Modelo de datos y sincronización
2. [MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md) - ⭐ **Empieza aquí**
3. [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)
4. [MIGRATIONS_VISUAL.md](./MIGRATIONS_VISUAL.md)

**Prioridad media:**

5. [METADATA_GUIDE.md](./METADATA_GUIDE.md)
6. [SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md)

### 🏗️ Arquitecto de Software

**Prioridad alta:**

1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Completo
3. [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)

**Referencia:** 4. Todos los demás documentos para profundizar

### 👔 CTO / Product Manager

**Prioridad alta:**

1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Sección "Decisiones Clave"

**Opcional:** 3. [NEXT_STEPS.md](./NEXT_STEPS.md) - Para seguimiento de avance

---

## 📊 Estadísticas de Documentación

| Documento                     | Líneas            | Tiempo Lectura | Actualizado       |
| ----------------------------- | ----------------- | -------------- | ----------------- |
| EXECUTIVE_SUMMARY.md          | ~300              | 10 min         | Feb 2026          |
| ARCHITECTURE.md               | ~600              | 30 min         | Feb 2026          |
| ARCHITECTURE_NEW.md           | ~270              | 25 min         | Feb 2026 🆕       |
| FORMS_SYSTEM.md               | ~450              | 15 min         | Feb 2026 🆕       |
| **SURVEY_SCHEMA.md**          | **~1,200**        | **30 min**     | **Feb 2026 🔥**   |
| **DATABASE_SCHEMA.md**        | **~950**          | **35 min**     | **Feb 2026 🔥**   |
| **DATA_ACCESS_LAYER.md**      | **~800**          | **40 min**     | **Feb 2026 🔥**   |
| **CLOUDINARY_INTEGRATION.md** | **~1,100**        | **45 min**     | **Feb 9 2026 🔥** |
| SCHEMAS_EXAMPLES.md           | ~400              | 20 min         | Feb 2026          |
| METADATA_GUIDE.md             | ~400              | 20 min         | Feb 2026 ✨       |
| MIGRATIONS_GUIDE.md           | ~500              | 30 min         | Feb 2026 ✨       |
| MIGRATIONS_VISUAL.md          | ~350              | 15 min         | Feb 2026 ✨       |
| MIGRATIONS_LIFECYCLE.md       | ~550              | 25 min         | Feb 2026 ✨       |
| NEXT_STEPS.md                 | ~300              | 20 min         | Feb 2026          |
| README_IMPLEMENTATION.md      | ~300              | 15 min         | Feb 2026          |
| CHEATSHEET.md                 | ~200              | 20 min         | Feb 2026          |
| CHANGELOG_v2.md               | ~350              | 10 min         | Feb 2026 ✨       |
| REORGANIZATION_SUMMARY.md     | ~250              | 10 min         | Feb 2026 ✨       |
| **TOTAL Documentos**          | **~9,270 líneas** | **6.4 horas**  |                   |

**+ Código de Repositorios (TypeScript)**:

- **DatabaseManager**: ~100 líneas (database.ts)
- **SurveyRepository**: ~200 líneas (8 métodos)
- **ResponseRepository**: ~450 líneas (17 métodos) - CORE
- **SyncRepository**: ~200 líneas (8 métodos)
- **FileRepository**: ~430 líneas (15 métodos) - **Actualizado para Cloudinary**
- **Index + Exports**: ~150 líneas (ejemplos de uso)
- **TOTAL Código**: **~1,530 líneas** (48+ métodos)

**TOTAL PROYECTO**: **~10,800 líneas** (documentación + código)

✨ = Nuevo en v2  
🆕 = Nueva arquitectura (Feb 2026)  
🔥 = Recién agregado/actualizado (Feb 9, 2026)

---

## 🔍 Búsqueda Rápida por Tema

### Quiero aprender sobre...

- **Offline-first**: → [ARCHITECTURE.md](./ARCHITECTURE.md) - Sección "Principios"
- **Nueva arquitectura**: → [ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md) ⭐ **NUEVO**
- **Sistema de formularios**: → [FORMS_SYSTEM.md](./FORMS_SYSTEM.md) ⭐ **IMPORTANTE**
- **React Hook Form vs Custom**: → [FORMS_SYSTEM.md](./FORMS_SYSTEM.md) ⭐⭐
- **Preguntas dinámicas**: → [ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md) - QuestionRenderer
- **Schema JSON de encuestas**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) ⭐⭐⭐ 🔥 **NUEVO**
- **Tipos de preguntas (18+)**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - QuestionType enum
- **Validaciones declarativas**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - Sección "Validaciones"
- **Lógica condicional**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - ConditionalRule + ejemplos
- **Captura de INE + OCR**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - Ejemplo 2
- **Versionado de encuestas**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - Sección "Versionado"
- **Base de datos SQLite**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) ⭐⭐⭐ 🔥 **NUEVO**
- **Tablas y relaciones**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Sección "Tablas Principales"
- **Sincronización offline**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - sync_queue
- **Gestión de archivos locales**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - local_files
- **Auditoría y triggers**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Sección "Triggers"
- **Queries útiles**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Sección "Queries Comunes"
- **SQLite y Drizzle**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)
- **Cómo funcionan las migraciones**: → [MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md) ⭐
- **De dónde vienen las migraciones**: → [MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md) ⭐
- **Schemas JSON**: → [SCHEMAS_EXAMPLES.md](./SCHEMAS_EXAMPLES.md)
- **Guardado inmediato**: → [ARCHITECTURE.md](./ARCHITECTURE.md) - Sección "Flujos"
- **Sincronización**: → [ARCHITECTURE.md](./ARCHITECTURE.md) - Fase 3
- **Migraciones**: → [MIGRATIONS_LIFECYCLE.md](./MIGRATIONS_LIFECYCLE.md) + [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) + [MIGRATIONS_VISUAL.md](./MIGRATIONS_VISUAL.md)
- **Metadata adicional**: → [METADATA_GUIDE.md](./METADATA_GUIDE.md)
- **Validación de encuestas**: → [METADATA_GUIDE.md](./METADATA_GUIDE.md) - Sección "Validación"
- **Testing**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 5
- **Snippets de código**: → [CHEATSHEET.md](./CHEATSHEET.md)

### Necesito implementar...

- **Un tipo de pregunta**: → [FORMS_SYSTEM.md](./FORMS_SYSTEM.md) - Sistema Custom
- **Login/Registro**: → [FORMS_SYSTEM.md](./FORMS_SYSTEM.md) - React Hook Form
- **Formulario dinámico**: → [ARCHITECTURE_NEW.md](./ARCHITECTURE_NEW.md) - QuestionRenderer
- **Nueva encuesta (schema)**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) 🔥 **NUEVO**
- **Campo especial (firma, INE)**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - IneOcrConfig
- **Pregunta condicional**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - ConditionalRule
- **Validación custom**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - ValidationRules
- **Persistencia en SQLite**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) 🔥 **NUEVO**
- **Tabla nueva en BD**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) + [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)
- **Query compleja**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Queries Comunes
- **Vista SQL**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Sección "Vistas"
- **Trigger automático**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Sección "Triggers"
- **Inicialización de BD**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 1
- **Seed data**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 2
- **Hook de usuario**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 3
- **Lista de encuestas**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 4
- **Nueva migración**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - Sección "Crear"
- **Nuevo campo en BD**: → [METADATA_GUIDE.md](./METADATA_GUIDE.md) + [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md)
- **Validación por encargado**: → [METADATA_GUIDE.md](./METADATA_GUIDE.md) - Caso de Uso 3
- **Sistema de tags**: → [METADATA_GUIDE.md](./METADATA_GUIDE.md) - Caso de Uso 2

### Tengo un problema con...

- **Migración fallida**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - "Troubleshooting"
- **Error "Column exists"**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - Problema 2
- **BD desincronizada**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - Problema 4
- **Tests de migraciones**: → [MIGRATIONS_GUIDE.md](./MIGRATIONS_GUIDE.md) - "Testing"
- **Validación de datos**: → [NEXT_STEPS.md](./NEXT_STEPS.md) - Paso 5
- **Schema JSON no válido**: → [SURVEY_SCHEMA.md](./SURVEY_SCHEMA.md) - Mejores prácticas 🔥
- **Query lenta en SQLite**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Índices 🔥
- **Sincronización fallida**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - sync_queue 🔥
- **Archivo no sube**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - local_files 🔥
- **Respuestas huérfanas**: → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Foreign Keys 🔥

---

## 🔄 Orden de Actualización

Los documentos se actualizan en este orden cuando hay cambios:

1. **Código fuente** (`lib/`, `components/`) - Cambios primero aquí
2. **MIGRATIONS_GUIDE.md** - Si hay cambios en BD
3. **METADATA_GUIDE.md** - Si hay nuevos campos
4. **CHANGELOG_v2.md** - Registrar cambios
5. **ARCHITECTURE.md** - Actualizar modelo de datos si aplica
6. **CHEATSHEET.md** - Agregar nuevos snippets
7. **README.md** (raíz) - Actualizar índice principal
8. **README_IMPLEMENTATION.md** - Estado actual
9. **NEXT_STEPS.md** - Actualizar checklist

---

## 📝 Contribuir a la Documentación

### Agregar nuevo documento

1. Crear archivo en `docs/` con nombre descriptivo en MAYÚSCULAS
2. Agregar a este índice (`docs/README.md`)
3. Agregar al índice principal (`../README.md`)
4. Actualizar estadísticas arriba

### Actualizar documento existente

1. Hacer cambios en el documento
2. Actualizar fecha en tabla de estadísticas
3. Si es cambio mayor, agregarlo a [CHANGELOG_v2.md](./CHANGELOG_v2.md)

---

## 🆘 ¿Necesitas Ayuda?

**No encuentras algo?**

- Usa Ctrl+F en este índice
- Busca por palabra clave en la sección "Búsqueda Rápida"
- Lee [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) primero

**Documentación obsoleta?**

- Verifica fecha de actualización en tabla de estadísticas
- Consulta [CHANGELOG_v2.md](./CHANGELOG_v2.md) para cambios recientes

**Falta documentación de X?**

- Revisa el código fuente en `lib/` y `components/`
- Consulta comentarios inline en el código
- Crea un issue para solicitar documentación adicional

---

**Última actualización**: Febrero 2026  
**Total documentos**: 10  
**Total páginas**: ~3,700 líneas  
**Tiempo total lectura**: ~3 horas
