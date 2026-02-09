# ❌ Error: No Development Build Installed

## 🔍 ¿Qué significa este error?

```
CommandError: No development build (com.brigadadigital.app) for this project is installed.
```

**Traducción:** Tu proyecto tiene código nativo custom (el splash screen) que NO puede ejecutarse en Expo Go. Necesitas crear un **development build**.

---

## 🎯 SOLUCIÓN RÁPIDA (15 minutos)

### Opción A: Crear Development Build con EAS (Recomendado)

```bash
# 1. Verificar login
eas whoami

# 2. Crear build
eas build --profile development --platform android

# 3. Esperar ~15 minutos

# 4. Descargar APK e instalar en tu Android

# 5. Ejecutar
npx expo start --dev-client
```

---

## 📋 Paso a Paso Detallado

### Paso 1: Verificar que estás logueado

```bash
eas whoami
```

**Resultado esperado:**

```
polobustillo88
```

✅ **Ya estás logueado** (lo verificamos antes)

---

### Paso 2: Crear el Development Build

```bash
eas build --profile development --platform android
```

**Lo que va a pasar:**

```
✔ Checking for updates
✔ Using remote Android credentials
✔ Compressing project files
✔ Uploading to Expo EAS Build

🚀 Build started!
🔗 https://expo.dev/accounts/polobustillo88/projects/brigada2026/builds/xxx

⏳ Waiting for build to complete...
```

**Tiempo:** 10-15 minutos

---

### Paso 3: Instalar el APK

Una vez termine:

```
✅ Build finished!
📦 Download: https://expo.dev/builds/xxx
```

1. **Abre el link en tu Android**
2. **Descarga el APK** (~50-80 MB)
3. **Permite "Instalar apps desconocidas"** (Settings → Security)
4. **Instala la app**

---

### Paso 4: Ejecutar con Dev Client

```bash
# Inicia el metro bundler
npx expo start --dev-client

# O simplemente
npx expo start
```

**Luego:**

1. Abre la app que instalaste en tu Android
2. Escanea el QR code
3. ¡Tu splash funcionará perfectamente! 🎉

---

## 🤔 ¿Por qué necesito esto?

### Expo Go (Lo que usabas antes)

- ❌ Solo apps "estándar" sin código nativo custom
- ❌ No puede ejecutar tu splash custom
- ❌ Limitado

### Development Build (Lo que necesitas ahora)

- ✅ Tu propia app con código nativo
- ✅ Splash screen custom funciona
- ✅ Todas las features nativas
- ✅ Hot reload y desarrollo rápido

**Es como Expo Go, pero con TU código nativo incluido.**

---

## 🚀 EJECUTA ESTO AHORA

```bash
# Crear el build (una sola vez)
eas build --profile development --platform android
```

**Después de instalarlo:**

```bash
# Desarrollar normalmente
npx expo start --dev-client
```

---

## ⏱️ Timeline

| Paso          | Tiempo        |
| ------------- | ------------- |
| Comando build | 30 seg        |
| Subida código | 2 min         |
| Build en nube | 10-15 min     |
| Descarga      | 1 min         |
| Instalación   | 30 seg        |
| **TOTAL**     | **15-20 min** |

---

## 💡 Una Vez Instalado

Después de instalar el development build:

1. **Desarrollas normalmente** con `npx expo start`
2. **Hot reload funciona** (cambios instantáneos)
3. **Solo rebuilds cuando:**
   - Agregas dependencias nativas
   - Cambias configuración nativa
   - Actualizas Expo SDK

**Para desarrollo diario:** ¡No necesitas rebuilds! 🎉

---

## 🐛 Si el Build Falla

### Error: "Package name already exists"

Cambia en `app.json`:

```json
"android": {
  "package": "com.tuempresa.brigadadigital"
}
```

### Error: "Not logged in"

```bash
eas login
```

### Error: "Project not configured"

```bash
eas build:configure
```

---

## 📱 Alternativa: Build Local (Avanzado)

Si tienes Android Studio instalado:

```bash
# Build local (más rápido, pero requiere setup)
eas build --profile development --platform android --local
```

**Ventajas:**

- ⚡ Más rápido (5-10 min)
- 💰 No cuenta en el límite de 30 builds/mes

**Desventajas:**

- ⚙️ Requiere Android Studio
- 💻 Consume recursos locales

---

## ✅ Checklist

Antes de ejecutar el build:

- [x] EAS CLI instalado (`eas --version` = 16.32.0)
- [x] Login correcto (`eas whoami` = polobustillo88)
- [x] eas.json configurado
- [x] app.json con package único
- [x] Internet estable
- [ ] **Ejecutar comando** ← TÚ AHORA

---

## 🎯 Comando a Ejecutar

```bash
eas build --profile development --platform android
```

**Presiona Enter y espera 15 minutos.** ⏱️

---

## 📚 Más Info

- [¿Qué es Development Build?](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Quickstart](./eas-build/QUICKSTART.md)
- [Troubleshooting](./splash-screen/TROUBLESHOOTING.md)

---

## 🆘 ¿Necesitas Ayuda Durante el Build?

1. **No canceles** el proceso (déjalo terminar)
2. **Abre el link** que te da para ver progreso
3. **Si falla:** Copia el error y revisa los logs
4. **Comparte el link** del build para ayuda

---

**TL;DR:**

1. Tu código necesita un development build (no funciona en Expo Go)
2. Ejecuta: `eas build --profile development --platform android`
3. Espera 15 min
4. Instala APK
5. Ejecuta: `npx expo start --dev-client`
6. ¡Listo! 🎉

---

**¿Quieres que ejecute el comando ahora?** Solo dime "sí" 🚀
