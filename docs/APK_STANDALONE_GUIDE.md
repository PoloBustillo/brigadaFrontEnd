# 📦 APK Standalone para Android - Guía Completa

## 🎯 ¿Qué es un APK Standalone?

Un **APK standalone** es una aplicación Android **completamente independiente** que:

- ✅ Se instala como cualquier app de Google Play
- ✅ NO requiere Expo Go
- ✅ Funciona sin internet (después de instalada)
- ✅ Tiene tu código nativo incluido
- ✅ Se puede distribuir por fuera de las stores

---

## 🚀 OPCIÓN 1: EAS Build (Lo que estás haciendo AHORA)

### Development Build (Testing)

**Comando que ya ejecutamos:**

```bash
eas build --profile development --platform android
```

**Resultado:**

- ✅ APK standalone con Expo Dev Client
- ✅ Hot reload para desarrollo
- ✅ Perfecto para testing

**Limitación:**

- ⚠️ Incluye herramientas de desarrollo
- ⚠️ Tamaño más grande (~80 MB)
- ⚠️ No optimizado para producción

### Production Build (Distribución Final)

**Para crear APK de producción standalone:**

```bash
eas build --profile production --platform android
```

**Resultado:**

- ✅ APK completamente standalone
- ✅ NO requiere Expo Go
- ✅ NO requiere internet para funcionar
- ✅ Optimizado y minificado
- ✅ Listo para Google Play o distribución directa
- ✅ Tamaño reducido (~30-50 MB)

---

## 📋 PASO A PASO: APK Production Standalone

### 1. Actualizar eas.json

Abre `eas.json` y verifica que tenga el profile `production`:

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 2. Crear Build de Producción

```bash
eas build --profile production --platform android
```

**Tiempo:** ~15-20 minutos

### 3. Resultado

```
✅ Build finished!
📦 Download: https://expo.dev/builds/xxx

APK: app-release.apk (~30-50 MB)
```

Este APK es **completamente standalone**:

- ✅ Se instala en cualquier Android
- ✅ NO necesita Expo Go
- ✅ NO necesita conexión a Metro Bundler
- ✅ Funciona 100% offline
- ✅ Listo para distribuir

---

## 🎯 OPCIÓN 2: Preview Build (Intermedio)

Para testing antes de producción:

```bash
eas build --profile preview --platform android
```

**Diferencias con production:**

- ✅ Standalone (no requiere Expo Go)
- ✅ Más rápido de construir
- ⚠️ Menos optimizado que production
- ✅ Bueno para QA/testing

---

## 🏗️ OPCIÓN 3: Build Local (Avanzado)

Si tienes Android Studio instalado:

```bash
# Development build local
eas build --profile development --platform android --local

# Production build local
eas build --profile production --platform android --local
```

**Ventajas:**

- ⚡ Más rápido (5-10 min)
- 🆓 No cuenta en límite de 30 builds/mes
- 💾 Control total del proceso

**Requisitos:**

- Android Studio instalado
- Java JDK configurado
- Variables de entorno configuradas

---

## 📊 Comparación de Tipos de Build

| Tipo                | Expo Go | Development | Preview | Production |
| ------------------- | ------- | ----------- | ------- | ---------- |
| **Standalone**      | ❌      | ✅          | ✅      | ✅         |
| **Hot Reload**      | ✅      | ✅          | ❌      | ❌         |
| **Tamaño**          | N/A     | ~80 MB      | ~50 MB  | ~30-40 MB  |
| **Optimizado**      | N/A     | ❌          | ⚠️      | ✅         |
| **Para producción** | ❌      | ❌          | ⚠️      | ✅         |
| **Debug tools**     | ✅      | ✅          | ⚠️      | ❌         |
| **Google Play**     | ❌      | ❌          | ❌      | ✅         |

---

## 🎯 Workflow Recomendado

### Durante Desarrollo

```bash
# 1. Crear development build (una sola vez)
eas build --profile development --platform android

# 2. Instalar en tu dispositivo

# 3. Desarrollar con hot reload
npx expo start --dev-client
```

### Para Testing/QA

```bash
# Build preview para testers
eas build --profile preview --platform android
```

### Para Producción

```bash
# Build final para distribución
eas build --profile production --platform android
```

---

## 📱 Cómo Usar el APK Production

### 1. Descargar APK

```
https://expo.dev/builds/xxx
```

### 2. Instalar en Android

- Transferir APK a dispositivo
- O descargar directamente en el teléfono
- Permitir "Fuentes desconocidas"
- Instalar

### 3. ¡Listo!

- La app funciona completamente standalone
- NO necesita Expo Go
- NO necesita Metro Bundler
- Funciona offline

---

## 🔐 Para Google Play Store

Si quieres publicar en Google Play:

### 1. Cambiar a AAB (Android App Bundle)

En `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 2. Crear build

```bash
eas build --profile production --platform android
```

### 3. Submit a Google Play

```bash
eas submit --platform android
```

**Requisitos:**

- Cuenta Google Play Developer ($25 una vez)
- App configurada en Play Console

---

## 🎨 Personalización del APK

### Nombre y Package

En `app.json`:

```json
{
  "expo": {
    "name": "Brigada Digital",
    "android": {
      "package": "com.brigadadigital.app",
      "versionCode": 1
    }
  }
}
```

### Ícono y Splash

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "backgroundColor": "#FF1B8D"
    }
  }
}
```

### Permisos

```json
{
  "expo": {
    "android": {
      "permissions": ["CAMERA", "ACCESS_FINE_LOCATION", "RECORD_AUDIO"]
    }
  }
}
```

---

## 💡 Tu Situación Actual

### Lo que está pasando AHORA:

```bash
eas build --profile development --platform android
```

**Esto crea:**

- ✅ APK standalone con dev tools
- ✅ NO requiere Expo Go
- ✅ Perfecto para desarrollo

### Para APK final sin dependencias:

**DESPUÉS de que termine el build actual:**

```bash
eas build --profile production --platform android
```

**Esto crea:**

- ✅ APK completamente standalone
- ✅ Optimizado para producción
- ✅ Sin herramientas de desarrollo
- ✅ Listo para distribuir

---

## 🚀 SIGUIENTE PASO

### Ahora (Development Build en progreso)

1. ⏳ Esperar que termine (10-15 min restantes)
2. 📥 Descargar APK
3. 📱 Instalar en Android
4. 🎉 ¡Tu splash funcionará!

### Después (Production Build)

```bash
# Crear APK final standalone
eas build --profile production --platform android

# Esperar 15-20 min

# Descargar e instalar

# ¡Listo para distribuir!
```

---

## 📊 Estado Actual del Build

**Build en progreso:** Development Build
**Link:** https://expo.dev/accounts/polobustillo88/projects/brigada2026/builds/808ddf3c-fe23-4789-a58f-5b9a073aeeac
**Tiempo restante:** ~10-15 minutos

**Tipo de APK que obtendrás:**

- ✅ Standalone (no requiere Expo Go)
- ✅ Con dev tools para desarrollo
- ✅ Hot reload habilitado
- ⚠️ Tamaño más grande (~80 MB)

**Para APK de producción:**

- Espera a que termine este
- Ejecuta: `eas build --profile production --platform android`

---

## ✅ Resumen

| Pregunta                 | Respuesta                    |
| ------------------------ | ---------------------------- |
| ¿Requiere Expo Go?       | ❌ No                        |
| ¿Requiere internet?      | ❌ No (después de instalado) |
| ¿Es standalone?          | ✅ Sí                        |
| ¿Se puede distribuir?    | ✅ Sí                        |
| ¿Funciona offline?       | ✅ Sí                        |
| ¿Listo para Google Play? | Production build ✅          |

---

**TL;DR:**

**Ahora (Development):**

```bash
# Ya ejecutándose
eas build --profile development --platform android
```

**Después (Production Standalone Final):**

```bash
# Para APK optimizado
eas build --profile production --platform android
```

**Ambos son standalone y NO requieren Expo Go.** 🎉

---

¿Quieres que después del build actual creemos el production build? 🚀
