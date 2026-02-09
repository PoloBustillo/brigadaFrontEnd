<div align="center">

# 🎯 BRIGADA 2026

### Sistema de Encuestas Offline-First para Trabajo de Campo

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Latest-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

</div>

---

## 📖 Tabla de Contenidos

- [¿Qué Problema Resuelve?](#-qué-problema-resuelve)
- [Arquitectura General](#-arquitectura-general)
- [Decisiones Clave de Diseño](#-decisiones-clave-de-diseño)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Desarrollo Local](#-desarrollo-local)
- [Generación de APK](#-generación-de-apk)
- [Documentación Técnica](#-documentación-técnica)

---

## 🎯 ¿Qué Problema Resuelve?

**BRIGADA 2026** es una aplicación móvil diseñada para resolver los desafíos del **levantamiento de encuestas en campo** donde la conectividad a internet es limitada o inexistente.

### Problemas que Resuelve

1. **❌ Dependencia de Internet**: Encuestadores no pueden trabajar sin conexión
2. **❌ Pérdida de Datos**: Datos se pierden si la app se cierra o falla la conexión
3. **❌ Encuestas Rígidas**: Difícil agregar nuevas preguntas sin actualizar la app
4. **❌ Sincronización Manual**: Proceso tedioso y propenso a errores
5. **❌ Sin Validación en Campo**: Errores detectados hasta después de enviar

### Solución

✅ **Operación 100% Offline**: Todas las funcionalidades disponibles sin internet  
✅ **Persistencia Local**: Datos guardados automáticamente en SQLite  
✅ **Encuestas Dinámicas**: Nuevos formularios desde JSON sin actualizar la app  
✅ **Sincronización Inteligente**: Automática cuando hay conexión disponible  
✅ **Validación en Tiempo Real**: Errores detectados antes de completar encuesta  
✅ **Lógica Condicional**: Preguntas que aparecen según respuestas previas

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     BRIGADA 2026 - SISTEMA                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌──────────────────────────┐
│   📱 MOBILE APP         │         │   🖥️ BACKEND API        │
│   (React Native/Expo)   │◄───────►│   (Node.js / Django)     │
│                         │  HTTPS  │                          │
│  ┌──────────────────┐   │         │  ┌───────────────────┐   │
│  │  UI Components   │   │         │  │  REST API         │   │
│  │  (React)         │   │         │  │  /surveys         │   │
│  └──────────────────┘   │         │  │  /responses       │   │
│           │              │         │  │  /sync            │   │
│  ┌──────────────────┐   │         │  └───────────────────┘   │
│  │  State Manager   │   │         │           │               │
│  │  (Zustand)       │   │         │  ┌───────────────────┐   │
│  └──────────────────┘   │         │  │  Business Logic   │   │
│           │              │         │  │  (Services)       │   │
│  ┌──────────────────┐   │         │  └───────────────────┘   │
│  │  Survey Engine   │   │         │           │               │
│  │  (Logic + Rules) │   │         │  ┌───────────────────┐   │
│  └──────────────────┘   │         │  │  Database         │   │
│           │              │         │  │  (PostgreSQL)     │   │
│  ┌──────────────────┐   │         │  └───────────────────┘   │
│  │  SQLite DB       │   │         │                          │
│  │  (Local Storage) │   │         │  JSON Survey Schemas     │
│  └──────────────────┘   │         │  ↓                       │
│           │              │         │  Mobile App downloads    │
│  ┌──────────────────┐   │         │  and caches schemas      │
│  │  Sync Queue      │   │         │                          │
│  │  (Pending Items) │   │         └──────────────────────────┘
│  └──────────────────┘   │
│                         │
└─────────────────────────┘

📊 FLUJO DE DATOS:

1. Backend publica JSON schemas de encuestas
2. Mobile descarga y cachea schemas (versioning incluido)
3. Usuario completa encuestas OFFLINE (datos en SQLite)
4. Sync Queue acumula respuestas pendientes
5. Cuando hay conexión: sincronización automática
6. Backend procesa y almacena respuestas
7. Mobile recibe confirmación y limpia queue
```

### Componentes Principales

#### 📱 Mobile App (Este Repositorio)

- **Interfaz de Usuario**: Renderizado dinámico de encuestas desde JSON
- **Motor de Encuestas**: Lógica condicional, validación, progreso
- **Almacenamiento Local**: SQLite + Drizzle ORM
- **Sincronización**: Queue de pendientes con retry automático
- **Detección de Red**: Monitoreo de conectividad

#### 🖥️ Backend API (Repositorio Separado)

- **API REST**: Endpoints para schemas, respuestas, sincronización
- **Gestión de Encuestas**: CRUD de schemas JSON
- **Versionado**: Control de versiones de encuestas
- **Procesamiento**: Validación y almacenamiento de respuestas
- **Reportes**: Dashboard y análisis de datos

---

## 💡 Decisiones Clave de Diseño

### 1. **Offline-First como Principio Base**

**Decisión**: Toda la funcionalidad debe operar sin conexión a internet.

**Razón**: Los encuestadores trabajan en zonas rurales/remotas sin cobertura confiable.

**Implementación**:

- SQLite como base de datos local (no AsyncStorage)
- Drizzle ORM para tipado y migraciones
- Zustand para estado en memoria
- Queue persistente para sincronización

### 2. **Schemas JSON Dinámicos**

**Decisión**: Encuestas definidas en JSON, no hardcodeadas en la app.

**Razón**: Permite crear/modificar encuestas sin actualizar la aplicación móvil.

**Implementación**:

```typescript
// Schema JSON descargado del backend
{
  "id": "survey-2026-01",
  "version": "1.0.0",
  "title": "Encuesta de Satisfacción",
  "sections": [
    {
      "id": "section-1",
      "questions": [
        {
          "id": "q1",
          "type": "TEXT",
          "label": "¿Cuál es tu nombre?",
          "required": true,
          "validation": { "minLength": 3 }
        },
        {
          "id": "q2",
          "type": "SELECT",
          "label": "¿Cómo calificas el servicio?",
          "options": [...],
          "conditionalLogic": {
            "showIf": { "questionId": "q1", "operator": "not_empty" }
          }
        }
      ]
    }
  ]
}
```

**Ventajas**:

- ✅ Nuevas encuestas sin redeploy
- ✅ A/B testing de formularios
- ✅ Correcciones rápidas de errores
- ✅ Versionado explícito

### 3. **Versionado de Encuestas**

**Decisión**: Cada schema tiene versión semántica (major.minor.patch).

**Razón**: Permite evolución controlada y compatibilidad con respuestas antiguas.

**Implementación**:

- `version: "1.0.0"` en cada schema
- Backend mantiene historial de versiones
- Mobile puede trabajar con versiones antiguas offline
- Migración de esquemas al sincronizar

**Ejemplo de Evolución**:

```
v1.0.0 → Primera versión
v1.1.0 → Agregar pregunta opcional (cambio menor)
v2.0.0 → Cambiar tipo de pregunta (breaking change)
```

### 4. **Factory Pattern para Preguntas**

**Decisión**: `QuestionRenderer` con factory pattern para 18 tipos de pregunta.

**Razón**: Extensibilidad y mantenibilidad del código.

**Implementación**:

```typescript
// question-renderer.tsx
<QuestionRenderer
  question={question}
  value={answer?.value}
  onChange={handleChange}
/>

// Internamente hace switch por question.type:
// TEXT → TextQuestion
// SELECT → SelectQuestion
// DATE → DateQuestion
// ... etc
```

### 5. **Dos Sistemas de Formularios Separados**

**Decisión**: Sistema custom para encuestas, React Hook Form solo para login.

**Razón**: Encuestas dinámicas requieren lógica especial, formas simples no.

**Implementación**:

- **Encuestas**: `QuestionRenderer` + `SurveyEngine` + Zustand
- **Login/Registro**: React Hook Form + Zod

**📖 Detalle**: Ver [`docs/FORMS_SYSTEM.md`](./docs/FORMS_SYSTEM.md)

### 6. **Feature-Based Architecture**

**Decisión**: Organización por features (questions/, surveys/, sync/) no por capas.

**Razón**: Mejor cohesión, módulos independientes, escalabilidad.

**Implementación**:

```
features/
├── questions/     # Todo lo relacionado con preguntas
│   ├── components/
│   ├── types/
│   ├── hooks/
│   └── utils/
├── surveys/       # Todo lo relacionado con encuestas
└── sync/          # Todo lo relacionado con sincronización
```

---

## 🛠️ Stack Tecnológico

### Frontend Mobile (React Native)

| Tecnología         | Versión              | Propósito                 |
| ------------------ | -------------------- | ------------------------- |
| **Expo**           | SDK 54               | Framework y tooling       |
| **React Native**   | Latest               | UI nativa multiplataforma |
| **TypeScript**     | 5.3+                 | Tipado estático           |
| **Expo Router**    | Latest               | Navegación file-based     |
| **SQLite**         | expo-sqlite ~16.0.10 | Base de datos local       |
| **Drizzle ORM**    | ^0.45.1              | ORM tipado para SQLite    |
| **Zustand**        | ^5.0.0               | State management          |
| **TanStack Query** | ^5.0.0               | Cache y sincronización    |
| **Zod**            | ^3.22.0              | Validación de schemas     |
| **Axios**          | ^1.6.0               | Cliente HTTP              |
| **date-fns**       | ^3.0.0               | Manipulación de fechas    |

### Expo Modules

| Módulo                            | Propósito                     |
| --------------------------------- | ----------------------------- |
| `@react-native-community/netinfo` | Detección de conectividad     |
| `expo-location`                   | Preguntas con geolocalización |
| `expo-image-picker`               | Captura de fotos              |
| `expo-file-system`                | Manejo de archivos            |

### Backend (Separado)

| Tecnología               | Propósito             |
| ------------------------ | --------------------- |
| **Node.js** o **Django** | API REST              |
| **PostgreSQL**           | Base de datos central |
| **Redis** (opcional)     | Cache de sesiones     |

---

## 📦 Instalación y Configuración

### Prerrequisitos

- **Node.js**: v18+ ([Descargar](https://nodejs.org/))
- **npm** o **yarn**: Gestor de paquetes
- **Git**: Control de versiones
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** (para Android): [Descargar](https://developer.android.com/studio)
- **Xcode** (para iOS, solo macOS): [Descargar](https://developer.apple.com/xcode/)

### Instalación

```powershell
# 1. Clonar el repositorio
git clone https://github.com/PoloBustillo/brigadaFrontEnd.git
cd brigadaFrontEnd

# 2. Instalar dependencias esenciales
npm install

# 3. Instalar dependencias específicas de Expo
npx expo install expo-sqlite @react-native-community/netinfo expo-location expo-image-picker expo-file-system

# 4. (Opcional) Instalar React Hook Form para login
npm install react-hook-form @hookform/resolvers

# 5. Verificar instalación
npx expo doctor
```

### Configuración Inicial

1. **Configurar Variables de Entorno**:

   ```powershell
   # Crear archivo .env
   cp .env.example .env
   ```

   ```env
   # .env
   API_BASE_URL=https://api.brigada2026.com
   API_TIMEOUT=30000
   ENABLE_AUTO_SYNC=true
   SYNC_INTERVAL_MINUTES=5
   ```

2. **Inicializar Base de Datos**:

   ```powershell
   # Generar migraciones de Drizzle
   npm run db:generate

   # Aplicar migraciones
   npm run db:migrate
   ```

3. **Configurar Expo EAS** (para builds):
   ```powershell
   npx eas login
   npx eas build:configure
   ```

---

## 💻 Desarrollo Local

### Iniciar Servidor de Desarrollo

```powershell
# Método 1: Expo Go (recomendado para desarrollo)
npx expo start

# Opciones:
# - Presiona 'a' para abrir en Android
# - Presiona 'i' para abrir en iOS
# - Presiona 'w' para abrir en web
# - Escanea QR con Expo Go app en tu móvil

# Método 2: Development Build (para testing de features nativas)
npx expo start --dev-client
```

### Scripts Disponibles

```powershell
# Desarrollo
npm start                    # Iniciar Expo dev server
npm run android              # Correr en Android
npm run ios                  # Correr en iOS (solo macOS)
npm run web                  # Correr en navegador

# Base de Datos
npm run db:generate          # Generar migraciones Drizzle
npm run db:migrate           # Aplicar migraciones
npm run db:studio            # Abrir Drizzle Studio (GUI)
npm run db:seed              # Poblar DB con datos de prueba

# Testing
npm test                     # Correr tests
npm run test:watch           # Tests en modo watch
npm run test:coverage        # Coverage report

# Linting y Formato
npm run lint                 # Linter ESLint
npm run lint:fix             # Fix automático
npm run format               # Formatear con Prettier
npm run typecheck            # Verificar tipos TypeScript

# Build
npm run build:android        # Build APK/AAB local
npm run build:ios            # Build iOS local
```

### Testing en Dispositivo Real

#### Opción 1: Expo Go (Más Rápido)

1. Instalar **Expo Go** en tu móvil:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Correr servidor:

   ```powershell
   npx expo start
   ```

3. Escanear QR code con tu móvil

**Limitación**: No funciona con módulos nativos custom.

#### Opción 2: Development Build (Recomendado)

```powershell
# Crear development build
npx eas build --profile development --platform android

# Descargar e instalar APK generado
# Luego iniciar servidor:
npx expo start --dev-client
```

---

## 📱 Generación de APK

### Opción 1: Build Local (Android Studio)

#### Prerrequisitos

- Android Studio instalado
- Android SDK configurado
- JDK 17+

#### Pasos

```powershell
# 1. Generar carpeta android/
npx expo prebuild --platform android

# 2. Navegar a carpeta android
cd android

# 3. Limpiar builds previos
.\gradlew clean

# 4. Generar APK de desarrollo
.\gradlew assembleDebug

# 5. Generar APK de producción
.\gradlew assembleRelease

# APKs generados en:
# android/app/build/outputs/apk/debug/app-debug.apk
# android/app/build/outputs/apk/release/app-release.apk
```

#### Firmar APK para Producción

```powershell
# 1. Generar keystore (solo primera vez)
keytool -genkey -v -keystore brigada-release-key.keystore `
  -alias brigada-key-alias `
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Configurar gradle.properties
# android/gradle.properties
MYAPP_RELEASE_STORE_FILE=brigada-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=brigada-key-alias
MYAPP_RELEASE_STORE_PASSWORD=tu-password
MYAPP_RELEASE_KEY_PASSWORD=tu-password

# 3. Editar android/app/build.gradle
# (agregar signingConfigs release)

# 4. Generar APK firmado
cd android
.\gradlew assembleRelease
```

### Opción 2: EAS Build (Cloud - Recomendado)

**Expo Application Services** permite generar builds en la nube sin configurar Android Studio.

#### Configuración Inicial

```powershell
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login en Expo
eas login

# 3. Configurar proyecto
eas build:configure
```

Esto genera `eas.json`:

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Generar APK

```powershell
# APK de desarrollo (sin firmar)
eas build --profile development --platform android

# APK de preview (firmado, no en Play Store)
eas build --profile preview --platform android

# AAB de producción (para Play Store)
eas build --profile production --platform android
```

#### Seguimiento del Build

```powershell
# Ver builds en progreso
eas build:list

# Ver detalles de un build
eas build:view [BUILD_ID]

# Descargar APK generado
eas build:download [BUILD_ID]
```

#### Ventajas de EAS Build

✅ No requiere Android Studio instalado  
✅ Builds más rápidos (servidores potentes)  
✅ Historial de builds en la nube  
✅ Firma automática de APKs  
✅ Integración con CI/CD  
✅ Soporte para iOS sin macOS (usando sus servidores)

#### Costos

- **Free**: 30 builds/mes (suficiente para desarrollo)
- **Production**: Unlimited builds ($99/mes)

---

## 📚 Documentación Técnica

### Documentación Completa

El proyecto incluye documentación exhaustiva en la carpeta `docs/`:

| Documento                                                            | Descripción                     | Tiempo Lectura |
| -------------------------------------------------------------------- | ------------------------------- | -------------- |
| [`docs/README.md`](./docs/README.md)                                 | Índice de toda la documentación | 5 min          |
| [`docs/EXECUTIVE_SUMMARY.md`](./docs/EXECUTIVE_SUMMARY.md)           | Resumen ejecutivo del proyecto  | 10 min         |
| [`docs/ARCHITECTURE_NEW.md`](./docs/ARCHITECTURE_NEW.md)             | ⭐ Arquitectura feature-based   | 20 min         |
| [`docs/FORMS_SYSTEM.md`](./docs/FORMS_SYSTEM.md)                     | ⭐ Dos sistemas de formularios  | 15 min         |
| [`docs/SURVEY_SCHEMA.md`](./docs/SURVEY_SCHEMA.md)                   | 🔥 **Schema JSON de encuestas** | 30 min         |
| [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)               | 🔥 **Schema SQLite completo**   | 35 min         |
| [`docs/DATA_ACCESS_LAYER.md`](./docs/DATA_ACCESS_LAYER.md)           | 🔥 **Guía de Repositorios**     | 40 min         |
| [`docs/CLOUDINARY_INTEGRATION.md`](./docs/CLOUDINARY_INTEGRATION.md) | 🔥 **Upload con Cloudinary**    | 45 min         |
| [`docs/NEXT_STEPS.md`](./docs/NEXT_STEPS.md)                         | Roadmap de implementación       | 10 min         |
| [`DEPENDENCIES.md`](./DEPENDENCIES.md)                               | Lista completa de dependencias  | 5 min          |
| [`STRUCTURE_SUMMARY.md`](./STRUCTURE_SUMMARY.md)                     | Resumen de estructura creada    | 10 min         |

### 🔥 Documento Destacado: Survey Schema

**[`docs/SURVEY_SCHEMA.md`](./docs/SURVEY_SCHEMA.md)** es la especificación completa del formato JSON para encuestas dinámicas:

- ✅ **18+ tipos de preguntas**: text, select, rating, signature, photo, INE+OCR, etc.
- ✅ **Validaciones declarativas**: minLength, pattern, custom messages
- ✅ **Lógica condicional**: Preguntas que aparecen según respuestas previas
- ✅ **Campo especial INE**: Captura con OCR automático y población de campos
- ✅ **Metadata automática**: GPS, duración, device info, brigadista
- ✅ **3 ejemplos completos**:
  - Censo poblacional básico (13 preguntas)
  - Registro con INE + OCR (13 preguntas con auto-población)
  - Encuesta de salud con lógica compleja (13 preguntas condicionales)

**📌 Lectura obligatoria antes de diseñar encuestas**

### 🔥 Documento Destacado: Database Schema

**[`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)** es el schema completo de SQLite para la app móvil:

- ✅ **7 tablas principales**: surveys, responses, local_files, sync_queue, audit_log, etc.
- ✅ **3 vistas útiles**: v_responses_with_surveys, v_sync_status, v_brigadista_stats
- ✅ **Sincronización offline-first**: Cola de reintentos con prioridades
- ✅ **Gestión de archivos**: Local storage para INE, fotos, firmas con OCR data
- ✅ **Triggers automáticos**: Auditoría, timestamps, foreign keys
- ✅ **Índices optimizados**: Para queries frecuentes y performance
- ✅ **10+ queries comunes**: Documentadas con ejemplos
- ✅ **Estrategia de migración**: Versionado semántico del schema

**📌 Lectura obligatoria antes de implementar persistencia**

### 🔥 Documento Destacado: Data Access Layer

**[`docs/DATA_ACCESS_LAYER.md`](./docs/DATA_ACCESS_LAYER.md)** es la guía completa de la capa de acceso a datos (Repositories):

- ✅ **4 Repositorios implementados**: 44+ métodos disponibles
- ✅ **SurveyRepository**: CRUD de encuestas (8 métodos)
- ✅ **ResponseRepository**: Lifecycle de respuestas (17 métodos) - CORE
  - `createResponse()` - Guardado inmediato
  - `updateAnswers()` - Auto-save en cada pregunta
  - `getResponseProgress()` - Progress tracking en tiempo real
  - `markAsSynced()` - Gestión de sincronización
- ✅ **SyncRepository**: Cola de sincronización con prioridades (8 métodos)
- ✅ **FileRepository**: Gestión de archivos locales (11 métodos)
  - Fotos, INE (front/back), firmas
  - OCR data storage
  - Cleanup automático
- ✅ **DatabaseManager**: Singleton con soporte de transacciones
- ✅ **Ejemplos completos de uso**: Código listo para copiar y pegar
- ✅ **Mejores prácticas**: Do's y Don'ts documentados
- ✅ **Troubleshooting**: Soluciones a problemas comunes

**📌 Guía definitiva para usar repositorios - NO acceder directamente a SQLite**

### 🔥 Documento Destacado: Cloudinary Integration

**[`docs/CLOUDINARY_INTEGRATION.md`](./docs/CLOUDINARY_INTEGRATION.md)** es la arquitectura completa de upload con Cloudinary:

- ✅ **Signed Uploads**: Seguridad con firmas del backend
- ✅ **Flujo offline-first**: Captura offline → Upload cuando hay conexión
- ✅ **Backend FastAPI**: Endpoints completos con autenticación
- ✅ **Mobile React Native**: Servicio de upload con progress tracking
- ✅ **Metadata dual**: PostgreSQL (backend) + SQLite (mobile)
- ✅ **3 casos de uso completos**:
  - Upload de INE con OCR
  - Captura de firma digital
  - Múltiples fotos
- ✅ **Seguridad**:
  - Autenticación con JWT
  - Autorización por usuario
  - Rate limiting
  - Validación de metadata
  - Expiración de firmas (1 hora)
- ✅ **Troubleshooting**: Soluciones a errores comunes

**📌 Lectura obligatoria antes de implementar uploads de archivos**

### Inicio Rápido para Desarrolladores

1. **👤 Nuevo en el proyecto?** → Lee [`docs/EXECUTIVE_SUMMARY.md`](./docs/EXECUTIVE_SUMMARY.md)
2. **🏗️ Entender la arquitectura?** → Revisa [`docs/ARCHITECTURE_NEW.md`](./docs/ARCHITECTURE_NEW.md)
3. **📝 Implementar formularios?** → ⚠️ Lee [`docs/FORMS_SYSTEM.md`](./docs/FORMS_SYSTEM.md) PRIMERO
4. **👨‍💻 Listo para codear?** → Sigue [`docs/NEXT_STEPS.md`](./docs/NEXT_STEPS.md)

### Arquitectura de Código

```typescript
// Ejemplo: Renderizar una encuesta
import { useSurveyStore } from '@/store/survey-store';
import { QuestionRenderer } from '@/features/questions/components/question-renderer';
import { SurveyEngine } from '@/features/surveys/utils/survey-engine';

function SurveyScreen() {
  const { currentSchema, engine, setAnswer } = useSurveyStore();

  const questions = engine?.getVisibleQuestions(0) || [];

  return (
    <View>
      {questions.map(question => (
        <QuestionRenderer
          key={question.id}
          question={question}
          value={engine?.getAnswer(question.id)}
          onChange={(value) => setAnswer(question.id, value)}
        />
      ))}
    </View>
  );
}
```

### Flujo de Datos

```
User Input → QuestionRenderer → Zustand Store → SurveyEngine
                                      ↓
                                  SQLite DB
                                      ↓
                                  Sync Queue
                                      ↓
                              (cuando hay red)
                                      ↓
                                Backend API
```

---

## 🤝 Contribución

### Branching Strategy

```
main           # Producción estable
  ↓
develop        # Desarrollo activo
  ↓
feature/*      # Nuevas funcionalidades
hotfix/*       # Correcciones urgentes
```

### Workflow

```powershell
# 1. Crear branch desde develop
git checkout develop
git pull
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato de código
refactor: refactorización
test: agregar tests
chore: tareas de mantenimiento
```

---

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

**© 2026 BRIGADA - Sistema de Encuestas**

---

## 📞 Contacto y Soporte

- **Repositorio**: [github.com/PoloBustillo/brigadaFrontEnd](https://github.com/PoloBustillo/brigadaFrontEnd)
- **Issues**: [github.com/PoloBustillo/brigadaFrontEnd/issues](https://github.com/PoloBustillo/brigadaFrontEnd/issues)
- **Documentación**: Ver carpeta `docs/`

---

<div align="center">

**⭐ Si este proyecto te ayuda, considera darle una estrella!**

Construido con ❤️ usando React Native + Expo

</div>
