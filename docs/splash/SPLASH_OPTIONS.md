# 🎯 Opciones para Ver el Splash Screen

## TL;DR

**El splash NO se ve bien en Expo Go** porque tiene limitaciones. Para verlo perfectamente:

### ✅ Opción 1: EAS Build (Recomendado)

```bash
# 1. Setup (5 min)
.\scripts\setup-eas.ps1

# 2. Crear build (15 min)
eas build --profile development --platform android

# 3. Descargar APK e instalar
# ¡Tu splash funcionará perfecto! 🎉
```

### ⚠️ Opción 2: Expo Go (Limitado)

El splash aparece DESPUÉS del splash de Expo Go y puede verse mal.

---

## 📊 Comparación Detallada

|                   | Expo Go          | EAS Build          |
| ----------------- | ---------------- | ------------------ |
| **Velocidad**     | ⚡ Instantáneo   | 🐢 15 min          |
| **Splash Custom** | ⚠️ Limitado      | ✅ Perfecto        |
| **Fuentes**       | ⚠️ A veces falla | ✅ Siempre         |
| **Control**       | ❌ Bajo          | ✅ Total           |
| **Costo**         | 🆓 Gratis        | 🆓 Gratis (30/mes) |
| **Internet**      | ✅ Necesario     | ⚠️ Solo para build |

---

## 🚀 ¿Cómo usar EAS Build?

### Windows PowerShell (Automático):

```powershell
.\scripts\setup-eas.ps1
```

Este script:

- ✅ Verifica Node.js
- ✅ Instala EAS CLI
- ✅ Te ayuda a login/registrarte
- ✅ Configura el proyecto
- ✅ Te ofrece crear el build

### Manual (Cualquier OS):

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configurar proyecto
eas build:configure

# 4. Crear build
eas build --profile development --platform android
```

**Tiempo:** 15 minutos

**Resultado:** APK con tu splash funcionando perfectamente

---

## 🐛 Debug en Expo Go (mientras tanto)

Si quieres seguir probando en Expo Go:

### 1. Aumentar duración del splash

En `components/layout/splash-screen.tsx`:

```tsx
const SPLASH_DURATION = 5000; // De 2500 a 5000 (5 segundos)
```

### 2. Agregar logs

En `app/_layout.tsx`:

```tsx
console.log("[App] Component mounted");
console.log("[App] appReady:", appReady);
```

En `components/layout/splash-screen.tsx`:

```tsx
console.log("[Splash] Component rendered");
console.log("[Splash] Fonts loaded:", fontsLoaded);
```

### 3. Verificar fuente

```powershell
# Verificar que existe
Test-Path assets\fonts\Pacifico-Regular.ttf

# Si no existe
npm run setup:splash-font
```

### 4. Limpiar caché y reiniciar

```bash
npx expo start -c
```

### 5. Observar consola

Busca estos logs:

```
[Splash] Fonts loaded: true
[Splash] App initialized: ...
[App] Splash completed: ...
```

---

## 📝 Documentación Completa

- **Setup EAS**: `docs/EAS_BUILD_QUICKSTART.md`
- **Expo Go vs EAS**: `docs/EXPO_GO_VS_EAS.md`
- **Troubleshooting**: `docs/SPLASH_TROUBLESHOOTING.md`
- **Testing**: `TEST_SPLASH.md`

---

## ❓ FAQ

### ¿Por qué no se ve en Expo Go?

Expo Go tiene limitaciones:

- Usa su propio splash nativo
- No puede reemplazarlo
- Tu splash aparece DESPUÉS
- Fuentes custom pueden fallar

### ¿Es gratis EAS Build?

**Sí!** Plan Free:

- ✅ 30 builds/mes
- ✅ Suficiente para desarrollo
- ✅ No necesitas tarjeta de crédito

### ¿Necesito Google Play Developer?

**No!** Para development builds:

- ✅ Instalas el APK directamente
- ✅ No necesitas publicar
- ✅ Solo para testing

Para producción (Play Store):

- ⚠️ Sí necesitas cuenta ($25 una vez)

### ¿Cuánto tarda el build?

- Android: 10-15 minutos
- iOS: 15-20 minutos

Solo la primera vez. Builds posteriores pueden ser más rápidos.

### ¿Puedo usar builds locales?

**Sí!** Más rápido pero requiere setup:

```bash
# Requiere Android Studio instalado
eas build --profile development --platform android --local
```

---

## 🎯 Recomendación

### Para ahora (testing rápido):

- Usa Expo Go
- Acepta las limitaciones
- Verifica funcionalidad

### Para ver el splash real:

- Usa EAS Build
- 15 minutos de espera
- Resultado perfecto

### Para producción:

- SIEMPRE usa EAS Build
- Control total
- Listo para stores

---

## 🚀 ¿Listo para probar?

```bash
# Windows PowerShell (recomendado)
.\scripts\setup-eas.ps1

# O manualmente
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

**15 minutos después:** ¡Tu splash funcionando perfectamente! 🎉

---

**¿Necesitas ayuda?** Revisa `docs/EAS_BUILD_QUICKSTART.md`
