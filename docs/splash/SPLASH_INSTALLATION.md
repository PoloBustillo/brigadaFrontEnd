# 🎉 Instalación Completa del Splash Screen

## ✅ Paso a Paso

### 1️⃣ Instalar Dependencias

```bash
npx expo install expo-linear-gradient expo-font
```

**Dependencias instaladas:**

- ✅ `expo-linear-gradient` - Para el gradiente rosa
- ✅ `expo-font` - Para cargar fuentes personalizadas

---

### 2️⃣ Descargar la Fuente Pacifico

**Opción A - Automático (Recomendado):**

```bash
npm run setup:splash-font
```

Esto descargará automáticamente `Pacifico-Regular.ttf` a `assets/fonts/`.

**Opción B - Manual:**

1. Visita: https://fonts.google.com/specimen/Pacifico
2. Click en "Download family"
3. Extrae `Pacifico-Regular.ttf`
4. Colócalo en `assets/fonts/Pacifico-Regular.ttf`

**Opción C - Comando directo:**

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" -OutFile "assets/fonts/Pacifico-Regular.ttf"

# macOS/Linux
curl -o assets/fonts/Pacifico-Regular.ttf https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf
```

---

### 3️⃣ Verificar Estructura de Archivos

Asegúrate de que tu proyecto tenga esta estructura:

```
brigadaFrontEnd/
├── assets/
│   └── fonts/
│       └── Pacifico-Regular.ttf    ✅ Fuente descargada
├── components/
│   └── layout/
│       ├── splash-screen.tsx       ✅ Componente principal
│       ├── index.ts                ✅ Export
│       └── README.md               ✅ Documentación
├── docs/
│   ├── SCREEN_FLOW_UX.md           ✅ Diseño UX
│   ├── SPLASH_FONT_SETUP.md        ✅ Setup de fuentes
│   └── examples/
│       └── splash-integration-example.tsx
└── scripts/
    └── download-splash-font.js     ✅ Script de descarga
```

---

### 4️⃣ Integrar en tu App

Edita `app/_layout.tsx`:

```tsx
import React, { useState, useEffect } from "react";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useRouter, Slot } from "expo-router";
import { SplashScreen } from "@/components/layout";

// Prevenir que el splash nativo se oculte automáticamente
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (appReady) {
      // Ocultar splash nativo de Expo
      ExpoSplashScreen.hideAsync();
    }
  }, [appReady]);

  const handleLoadComplete = (state) => {
    console.log("[App] Splash completed:", state);

    // Navegar según el estado
    if (state.hasSession) {
      router.replace("/(tabs)");
    } else {
      // TODO: Crear ruta de login
      router.replace("/(tabs)"); // Temporal
    }

    setAppReady(true);
  };

  if (!appReady) {
    return <SplashScreen onLoadComplete={handleLoadComplete} />;
  }

  return <Slot />;
}
```

---

### 5️⃣ Probar el Splash Screen

```bash
# Limpiar caché (recomendado en primera ejecución)
npx expo start -c

# O simplemente
npx expo start
```

Luego presiona:

- `a` para Android
- `i` para iOS
- `w` para Web

---

## 🎨 Personalización Rápida

### Cambiar Colores

Edita `components/layout/splash-screen.tsx`:

```tsx
// Línea 60-61
const GRADIENT_COLORS = ["#FF1B8D", "#FF6B9D"] as const;

// Cambiar a azul:
const GRADIENT_COLORS = ["#1E3A8A", "#3B82F6"] as const;

// O verde:
const GRADIENT_COLORS = ["#065F46", "#10B981"] as const;
```

### Cambiar Texto del Logo

Busca `brigadaDigital` en el componente y cámbialo:

```tsx
<Text style={styles.logo}>brigadaDigital</Text>
// Cambiar a:
<Text style={styles.logo}>Tu Texto Aquí</Text>
```

### Cambiar Duración

```tsx
// Línea 55-56
const SPLASH_DURATION = 2500; // Cambiar a 3000 para 3 segundos
const MESSAGE_DURATION = 500; // Tiempo entre mensajes
```

---

## 🐛 Solución de Problemas

### Problema: "Unable to resolve module expo-linear-gradient"

**Solución:**

```bash
npx expo install expo-linear-gradient
npx expo start -c
```

### Problema: "Unable to load font: Pacifico"

**Causa:** Archivo de fuente no encontrado

**Solución:**

```bash
# Verificar si existe
ls assets/fonts/Pacifico-Regular.ttf

# Si no existe, descargar:
npm run setup:splash-font

# Limpiar caché
npx expo start -c
```

### Problema: Pantalla blanca en lugar del splash

**Causa:** Fuente no cargada y componente retorna `null`

**Solución temporal:** Edita `splash-screen.tsx`:

```tsx
if (!fontsLoaded) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#FF1B8D" />
    </View>
  );
}
```

### Problema: Splash no desaparece

**Causa:** `onLoadComplete` no se llama

**Debug:**

```tsx
const handleLoadComplete = (state) => {
  console.log("🎯 Load complete:", state); // Agregar log
  setAppReady(true);
};
```

Si no ves el log, verifica que las verificaciones terminen:

- `checkSession()`
- `checkConnection()`
- `loadSurveys()`

---

## ✅ Checklist de Verificación

Antes de ejecutar, verifica:

- [ ] `expo-linear-gradient` instalado
- [ ] `expo-font` instalado
- [ ] `Pacifico-Regular.ttf` en `assets/fonts/`
- [ ] Componente `splash-screen.tsx` creado
- [ ] `app/_layout.tsx` actualizado con integración
- [ ] `onLoadComplete` callback implementado

---

## 📚 Documentación Adicional

- **Diseño UX completo**: [`docs/SCREEN_FLOW_UX.md`](../SCREEN_FLOW_UX.md)
- **Setup de fuentes**: [`docs/SPLASH_FONT_SETUP.md`](../SPLASH_FONT_SETUP.md)
- **README del componente**: [`components/layout/README.md`](../../components/layout/README.md)
- **Ejemplo de integración**: [`docs/examples/splash-integration-example.tsx`](./examples/splash-integration-example.tsx)

---

## 🎬 ¡Listo para Usar!

Tu splash screen está configurado y listo. Al ejecutar la app verás:

1. **Fade in** (300ms) - Logo aparece suavemente
2. **Spinner animado** - 3 dots pulsantes
3. **Mensajes dinámicos** - Feedback del proceso
4. **Fade out** (300ms) - Transición suave a la app
5. **Navegación automática** - A Home o Login según el estado

**Duración total:** 2-3 segundos máximo

---

**¿Necesitas ayuda?** Revisa los ejemplos en `docs/examples/` o consulta el README completo.
