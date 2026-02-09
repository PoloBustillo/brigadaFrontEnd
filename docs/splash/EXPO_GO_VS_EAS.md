# 🤔 Expo Go vs EAS Build - Splash Screen

## ¿Por qué no se ve el splash en Expo Go?

### 📱 Limitaciones de Expo Go

**Expo Go ES un sandbox** con limitaciones:

1. **Splash Screen Nativo**: Expo Go usa su PROPIO splash, no el tuyo
2. **Fuentes Custom**: Pueden fallar si el path no se resuelve correctamente
3. **Assets**: Deben estar en el bundle de JS, no pueden ser nativos
4. **Permisos**: No puedes modificar archivos nativos (AndroidManifest.xml, Info.plist)

### ✅ Lo que SÍ funciona en Expo Go:

- ✅ Componentes custom de React Native (como nuestro `<SplashScreen />`)
- ✅ Fuentes cargadas con `expo-font` y `useFonts`
- ✅ Animaciones con `Animated`
- ✅ LinearGradient
- ✅ AsyncStorage, SQLite, etc.

### ❌ Lo que NO funciona en Expo Go:

- ❌ Reemplazar el splash nativo de Expo Go
- ❌ Controlar el splash nativo 100% (aunque `preventAutoHideAsync` ayuda)
- ❌ Modificar archivos nativos
- ❌ Algunos módulos nativos custom

---

## 🔍 Diagnóstico: ¿Por qué no ves el splash?

### Escenario 1: El splash se oculta muy rápido

**Problema**: Expo Go oculta su splash y muestra la app inmediatamente.

**Solución**: Aumentar duración mínima:

```tsx
// En splash-screen.tsx
const SPLASH_DURATION = 3500; // Aumentar a 3.5 segundos
```

### Escenario 2: Fuente no carga

**Problema**: Si Pacifico.ttf no se encuentra, el componente usa fallback pero puede ser invisible.

**Debug**: Abre la consola de Metro y busca:

```
[Splash] Fonts loaded: true
```

Si ves `false` o un error, la fuente no cargó.

**Solución**:

```bash
# Verificar que la fuente existe
dir assets\fonts\Pacifico-Regular.ttf

# Si no existe
npm run setup:splash-font

# Limpiar caché
npx expo start -c
```

### Escenario 3: El componente no se renderiza

**Problema**: `app/_layout.tsx` no muestra el componente.

**Debug**: Agrega logs:

```tsx
if (!appReady) {
  console.log("[App] Showing splash screen");
  return <SplashScreen onLoadComplete={handleLoadComplete} />;
}
console.log("[App] App is ready, hiding splash");
```

### Escenario 4: Expo Go override

**Problema**: Expo Go está mostrando su propio splash encima del tuyo.

**Esto es NORMAL** en Expo Go. El splash custom aparece DESPUÉS del splash de Expo Go.

---

## 🎯 Solución Recomendada: EAS Build

Para tener **control total** del splash screen, necesitas crear un build con EAS.

### ¿Qué es EAS Build?

**EAS Build** = Servicio de Expo que crea APKs/IPAs reales con tu código nativo.

**Ventajas**:

- ✅ Control total del splash nativo
- ✅ Fuentes embedded correctamente
- ✅ Assets nativos
- ✅ Permisos custom
- ✅ App independiente (no necesita Expo Go)

### 🚀 Setup de EAS Build

#### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

#### 2. Login a tu cuenta Expo

```bash
eas login
```

Si no tienes cuenta:

```bash
# Crear cuenta gratis
eas register
```

#### 3. Configurar proyecto

```bash
eas build:configure
```

Esto crea `eas.json` con la configuración.

#### 4. Configurar el splash nativo

Crea `app.json` o actualiza el existente:

```json
{
  "expo": {
    "name": "brigadaDigital",
    "slug": "brigada-digital",
    "version": "1.0.0",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF1B8D"
    },
    "android": {
      "package": "com.brigadadigital.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF1B8D"
      }
    },
    "ios": {
      "bundleIdentifier": "com.brigadadigital.app"
    }
  }
}
```

#### 5. Crear build de desarrollo

**Para Android (más rápido):**

```bash
# APK para instalar en tu teléfono
eas build --profile development --platform android
```

**Para iOS (requiere cuenta Apple Developer):**

```bash
eas build --profile development --platform ios
```

#### 6. Instalar en tu dispositivo

Una vez termine (10-15 minutos), te da un link:

```
✅ Build complete!
📦 Download: https://expo.dev/builds/xxx
```

Descarga el APK e instálalo en tu Android.

---

## 📋 Comparación Rápida

| Característica          | Expo Go            | EAS Build               |
| ----------------------- | ------------------ | ----------------------- |
| **Splash Custom**       | ⚠️ Limitado        | ✅ Total                |
| **Velocidad de prueba** | ⚡ Instantáneo     | 🐢 10-15 min build      |
| **Fuentes custom**      | ⚠️ A veces falla   | ✅ Siempre funciona     |
| **Control nativo**      | ❌ No              | ✅ Sí                   |
| **Requiere cuenta**     | ✅ No              | ✅ Sí (gratis)          |
| **Internet**            | ✅ Necesario       | ⚠️ Solo para build      |
| **Distribución**        | ❌ Solo desarrollo | ✅ Play Store/App Store |

---

## 🔧 Debugging en Expo Go

Si quieres seguir usando Expo Go mientras testeas:

### 1. Agregar más logs

```tsx
// En app/_layout.tsx
console.log("[App] Component mounted");
console.log("[App] appReady:", appReady);

// En splash-screen.tsx
console.log("[Splash] Component rendered");
console.log("[Splash] Fonts loaded:", fontsLoaded);
```

### 2. Aumentar duración mínima

```tsx
// En splash-screen.tsx
const SPLASH_DURATION = 5000; // 5 segundos para verlo mejor
```

### 3. Cambiar color de fondo

Para ver si el componente se renderiza:

```tsx
<LinearGradient
  colors={["#FF0000", "#00FF00"]} // Rojo a verde (muy visible)
  start={GRADIENT_START}
  end={GRADIENT_END}
  style={styles.container}
>
```

### 4. Agregar border para debug

```tsx
<View style={[styles.content, { borderWidth: 5, borderColor: 'yellow' }]}>
```

---

## 🎯 Recomendación Final

### Para Desarrollo Rápido:

**Usa Expo Go** pero acepta las limitaciones:

- El splash custom aparece DESPUÉS del splash de Expo Go
- Puede no verse perfectamente
- Suficiente para testear funcionalidad

### Para Ver el Splash Real:

**Usa EAS Build**:

```bash
# Una sola vez
npm install -g eas-cli
eas login
eas build:configure

# Cada vez que quieras probar
eas build --profile development --platform android
```

### Para Producción:

**SIEMPRE usa EAS Build**:

- Control total
- Performance optimizado
- Listo para Play Store/App Store

---

## 🆓 EAS Build es GRATIS

**Plan Free de Expo**:

- ✅ 30 builds/mes gratis
- ✅ Android ilimitado
- ✅ iOS con limitaciones
- ✅ Suficiente para desarrollo

**No necesitas pagar nada para probar tu splash!**

---

## 🚀 Workflow Recomendado

1. **Desarrollo inicial**: Expo Go (rápido)
2. **Testing de splash**: EAS Build (una vez al día)
3. **Testing de features**: Expo Go (rápido)
4. **Pre-release**: EAS Build
5. **Producción**: EAS Build + distribución

---

## 📞 ¿Qué hacer AHORA?

### Opción A: Seguir con Expo Go

```bash
# 1. Aumentar duración del splash
# Edita splash-screen.tsx: SPLASH_DURATION = 5000

# 2. Agregar logs
# Agregar console.log en varios puntos

# 3. Reiniciar con caché limpio
npx expo start -c

# 4. Observar consola de Metro
# Buscar: [Splash] y [App]
```

### Opción B: Probar con EAS Build (Recomendado)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configurar
eas build:configure

# 4. Crear build
eas build --profile development --platform android

# 5. Esperar 10-15 min

# 6. Descargar APK e instalar

# 7. Ver tu splash REAL 🎉
```

---

**TL;DR**:

- Expo Go tiene limitaciones con splash screens nativos
- Tu componente `<SplashScreen />` DEBERÍA funcionar en Expo Go
- Para ver el splash perfecto: usa EAS Build (gratis, 15 min)
- Para producción: SIEMPRE usa EAS Build

**¿Quieres que te ayude a configurar EAS Build?** 🚀
