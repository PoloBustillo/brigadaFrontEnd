# 🚀 Setup Rápido de EAS Build

Guía paso a paso para crear tu primer build y ver el splash screen real.

## ⏱️ Tiempo estimado: 20 minutos

- 5 min: Setup inicial
- 15 min: Tiempo de build en la nube

---

## 📋 Pre-requisitos

- ✅ Cuenta de Expo (gratis)
- ✅ Node.js instalado
- ✅ Proyecto Expo funcionando

---

## 🎯 Paso 1: Instalar EAS CLI (2 min)

```bash
npm install -g eas-cli
```

**Verificar instalación:**

```bash
eas --version
```

Deberías ver algo como: `eas-cli/7.x.x`

---

## 🔐 Paso 2: Login a Expo (1 min)

```bash
eas login
```

**Si NO tienes cuenta:**

```bash
eas register
```

Te pedirá:

- Email
- Username
- Password

**Verificar login:**

```bash
eas whoami
```

Debería mostrar tu username.

---

## ⚙️ Paso 3: Configurar Proyecto (2 min)

```bash
eas build:configure
```

Esto crea `eas.json` con 3 profiles:

- `development`: Para testing en tu dispositivo
- `preview`: Para QA/staging
- `production`: Para Play Store/App Store

**Contenido de `eas.json`:**

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
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## 📦 Paso 4: Actualizar app.json (3 min)

Abre `app.json` y asegúrate de tener:

```json
{
  "expo": {
    "name": "brigadaDigital",
    "slug": "brigada-digital",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",

    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF1B8D"
    },

    "android": {
      "package": "com.brigadadigital.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundColor": "#FF1B8D"
      },
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },

    "ios": {
      "bundleIdentifier": "com.brigadadigital.app",
      "supportsTablet": true
    },

    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },

    "plugins": ["expo-router", "expo-font", "expo-splash-screen"],

    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Campos importantes:**

- `android.package`: Identificador único (cámbialo)
- `ios.bundleIdentifier`: Identificador único (cámbialo)
- `splash.backgroundColor`: Color de fondo (#FF1B8D = rosa Lemonade)

---

## 🏗️ Paso 5: Crear Build (15 min)

### Para Android (más rápido):

```bash
eas build --profile development --platform android
```

### Para iOS (requiere Apple Developer Account):

```bash
eas build --profile development --platform ios
```

**Lo que sucede:**

1. EAS sube tu código a la nube
2. Instala dependencias
3. Compila código nativo
4. Genera APK/IPA
5. Te da un link de descarga

**Output esperado:**

```
✔ Linked to project @tuusername/brigada-digital
✔ Android application id: com.brigadadigital.app
✔ Uploaded project files
✔ Build started, it may take a few minutes to complete

🚀 Build details: https://expo.dev/accounts/tuusername/projects/brigada-digital/builds/xxx

⏳ Waiting for build to complete. You can press Ctrl+C to exit.
```

**Tiempo de espera:**

- Android: 10-15 minutos
- iOS: 15-20 minutos

---

## 📥 Paso 6: Descargar e Instalar (2 min)

Una vez termine:

```
✅ Build finished successfully!
📦 Download: https://expo.dev/builds/xxx
```

### En Android:

1. Abre el link en tu teléfono
2. Descarga el APK
3. Instala (permite "Instalar apps desconocidas")
4. ¡Listo! 🎉

### En iOS:

1. Registra tu dispositivo en Apple Developer
2. Descarga el IPA
3. Instala con TestFlight o Xcode

---

## 🎉 Paso 7: Ver tu Splash

1. Abre la app en tu dispositivo
2. **¡Deberías ver el splash rosa con "brigadaDigital"!**
3. El splash aparece por 2-3 segundos
4. Transición suave a la app principal

**Si funciona:** ¡Éxito! Tienes el splash funcionando.

**Si no funciona:** Revisa los logs de la app.

---

## 🔄 Builds Futuros

Para crear nuevos builds (después de cambios):

```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios

# Ambos
eas build --profile development --platform all
```

**Tip:** Usa `--local` para builds en tu máquina (más rápido, requiere Android Studio/Xcode):

```bash
eas build --profile development --platform android --local
```

---

## 📊 Monitorear Builds

Ver todos tus builds:

```bash
eas build:list
```

Ver build específico:

```bash
eas build:view [BUILD_ID]
```

Cancelar build:

```bash
eas build:cancel [BUILD_ID]
```

---

## 💰 Límites del Plan Free

**Expo Free Plan:**

- ✅ 30 builds/mes
- ✅ Prioridad normal
- ✅ Android ilimitado (localmente)
- ✅ iOS limitado
- ✅ Distribución interna

**Suficiente para:**

- Desarrollo
- Testing
- Demos
- MVPs

**Para producción:** Considera Expo Production Plan ($99/mes) o builds locales.

---

## 🐛 Troubleshooting

### Error: "Package name already exists"

Cambia `android.package` en `app.json`:

```json
"android": {
  "package": "com.tuempresa.brigadadigital"
}
```

### Error: "Bundle identifier already exists"

Cambia `ios.bundleIdentifier` en `app.json`:

```json
"ios": {
  "bundleIdentifier": "com.tuempresa.brigadadigital"
}
```

### Build falla: "Dependencies error"

Asegúrate de tener todas las dependencias instaladas:

```bash
npm install
npx expo install --check
```

### Build tarda mucho

**Normal:** 10-15 min para Android, 15-20 min para iOS.

**Alternativa:** Usa `--local` para builds en tu máquina (requiere setup de Android Studio/Xcode).

---

## 🎯 Checklist Rápido

Antes de crear el build:

- [ ] `eas-cli` instalado (`eas --version`)
- [ ] Login correcto (`eas whoami`)
- [ ] `eas.json` creado (`eas build:configure`)
- [ ] `app.json` configurado (package/bundleIdentifier únicos)
- [ ] Assets listos (icon.png, splash-icon.png)
- [ ] Fuente Pacifico en `assets/fonts/`
- [ ] Código testeado en Expo Go

---

## 🚀 Comando Todo-en-Uno

Para expertos que quieren ir directo:

```bash
# Setup completo
npm install -g eas-cli && \
eas login && \
eas build:configure && \
eas build --profile development --platform android
```

---

## 📚 Recursos

- [Documentación EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS CLI Reference](https://docs.expo.dev/build-reference/eas-json/)
- [Expo Dashboard](https://expo.dev/)
- [Troubleshooting](https://docs.expo.dev/build-reference/troubleshooting/)

---

## ✅ Resultado Final

Después de seguir esta guía, tendrás:

1. ✅ EAS CLI configurado
2. ✅ Proyecto configurado con `eas.json` y `app.json`
3. ✅ Build funcionando en la nube
4. ✅ APK/IPA descargable
5. ✅ App instalada en tu dispositivo
6. ✅ **Splash screen funcionando perfectamente** 🎉

---

**¿Listo para crear tu primer build?** 🚀

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

**15 minutos después:** ¡Tu splash screen funcionando! 🎉
