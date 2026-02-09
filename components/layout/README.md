# 🚀 Splash Screen - brigadaDigital

Pantalla de carga inicial con branding elegante inspirada en Lemonade Insurance.

## 📋 Características

- ✅ **Branding elegante** - Logo "brigadaDigital" con fuente script
- ✅ **Gradiente rosa vibrante** - Inspirado en Lemonade
- ✅ **Animaciones suaves** - Fade in/out, spinner pulsante
- ✅ **Mensajes dinámicos** - Feedback del proceso de carga
- ✅ **Estado de conexión** - Indica modo offline
- ✅ **Verificación de sesión** - Detecta si el usuario está logueado
- ✅ **Duración controlada** - Máximo 2-3 segundos
- ✅ **Wave decorativa** - Detalle visual al estilo Lemonade

## 🎨 Preview

```
┌────────────────────────────────┐
│                                │
│    [GRADIENTE ROSA VIBRANTE]   │
│        #FF1B8D → #FF6B9D       │
│                                │
│                                │
│      brigadaDigital            │ ← Fuente Pacifico
│                                │
│         ⚪⚪⚪                   │ ← Spinner animado
│                                │
│    Cargando encuestas...       │ ← Texto dinámico
│                                │
│      [WAVE DECORATIVA]         │
│                                │
│           v1.0.0               │
└────────────────────────────────┘
```

## 📦 Instalación

### 1. Instalar Dependencias

```bash
npx expo install expo-linear-gradient expo-font
```

### 2. Descargar Fuente Pacifico

Descarga la fuente Pacifico de Google Fonts:

**Opción A - Descarga directa:**

```bash
# Crear carpeta de fuentes
mkdir -p assets/fonts

# Descargar Pacifico
curl -o assets/fonts/Pacifico-Regular.ttf \
  https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf
```

**Opción B - Manual:**

1. Visita: https://fonts.google.com/specimen/Pacifico
2. Descarga el archivo `Pacifico-Regular.ttf`
3. Colócalo en `assets/fonts/Pacifico-Regular.ttf`

Ver instrucciones completas: [`docs/SPLASH_FONT_SETUP.md`](./SPLASH_FONT_SETUP.md)

### 3. Importar Componente

```tsx
import SplashScreen from "@/components/layout/splash-screen";
```

## 🔧 Uso Básico

```tsx
import React, { useState } from "react";
import SplashScreen from "@/components/layout/splash-screen";

export default function App() {
  const [loading, setLoading] = useState(true);

  const handleLoadComplete = (state) => {
    console.log("App ready:", state);

    // Verificar estado
    if (state.hasSession) {
      // Navegar a Home
      router.push("/(tabs)");
    } else {
      // Navegar a Login
      router.push("/login");
    }

    setLoading(false);
  };

  if (loading) {
    return <SplashScreen onLoadComplete={handleLoadComplete} />;
  }

  return <YourApp />;
}
```

## 🎯 Props

### SplashScreenProps

```typescript
interface SplashScreenProps {
  /** Callback cuando termina la carga (obligatorio) */
  onLoadComplete: (state: AppInitialState) => void;
}

interface AppInitialState {
  /** ¿Hay sesión válida? */
  hasSession: boolean;

  /** ¿Está online? */
  isOnline: boolean;

  /** ¿Se cargaron las encuestas? */
  surveysLoaded: boolean;
}
```

## 🔄 Secuencia de Mensajes

El splash muestra mensajes dinámicos durante la carga:

1. `🚀 Iniciando...` (0ms)
2. `🔐 Verificando sesión...` (500ms)
3. `📡 Comprobando conexión...` (1000ms)
4. `📊 Cargando encuestas...` (1500ms)
5. `✅ Listo!` (2000ms)

**Mensajes especiales:**

- `📶 Modo offline` - Cuando no hay conexión
- `⚠️ Reconectando...` - Cuando hay error

## ⚙️ Configuración

### Cambiar Colores del Gradiente

Edita las constantes en `splash-screen.tsx`:

```tsx
// Opción 1: Rosa Lemonade (por defecto)
const GRADIENT_COLORS = ["#FF1B8D", "#FF6B9D"] as const;

// Opción 2: Azul profesional
const GRADIENT_COLORS = ["#1E3A8A", "#3B82F6"] as const;

// Opción 3: Verde gobierno
const GRADIENT_COLORS = ["#065F46", "#10B981"] as const;

// Opción 4: Naranja vibrante
const GRADIENT_COLORS = ["#EA580C", "#FB923C"] as const;
```

### Cambiar Duración

```tsx
const SPLASH_DURATION = 2500; // ms (por defecto 2.5s)
const MESSAGE_DURATION = 500; // ms entre mensajes
```

### Cambiar Fuente

```tsx
// En el hook useFonts
const [fontsLoaded] = useFonts({
  // Cambiar a Satisfy
  'MyLogo': require('../../assets/fonts/Satisfy-Regular.ttf'),
});

// Y en los estilos
logo: {
  fontFamily: 'MyLogo', // <- Actualizar también aquí
  fontSize: 48,
  // ...
}
```

### Ocultar Wave Decorativa

```tsx
// En el JSX, comentar:
{
  /* <WaveDecoration /> */
}
```

## 🔧 Implementación de Verificaciones

El splash ejecuta estas verificaciones **en paralelo**:

### 1. Verificar Sesión (checkSession)

```tsx
async function checkSession(): Promise<{ isValid: boolean }> {
  try {
    // TODO: Implementar con tu sistema de auth
    const token = await AsyncStorage.getItem("auth_token");

    if (!token) {
      return { isValid: false };
    }

    // Verificar si el token es válido
    const response = await api.post("/auth/verify", { token });
    return { isValid: response.data.valid };
  } catch (error) {
    console.error("Session check failed:", error);
    return { isValid: false };
  }
}
```

### 2. Verificar Conexión (checkConnection)

```tsx
import NetInfo from "@react-native-community/netinfo";

async function checkConnection(): Promise<{ isOnline: boolean }> {
  const state = await NetInfo.fetch();
  return {
    isOnline: state.isConnected && state.isInternetReachable,
  };
}
```

### 3. Cargar Encuestas (loadSurveys)

```tsx
async function loadSurveys(): Promise<{ count: number }> {
  try {
    // Cargar desde SQLite
    const surveys = await surveyRepository.getAll();

    // Si está online, sincronizar
    if (isOnline) {
      await syncSurveys();
    }

    return { count: surveys.length };
  } catch (error) {
    console.error("Failed to load surveys:", error);
    return { count: 0 };
  }
}
```

## 🎭 Animaciones

### Fade In Inicial

- Duración: 300ms
- Opacity: 0 → 1
- Scale: 0.95 → 1.0

### Spinner (3 Dots)

- Loop infinito
- 3 dots que pulsan secuencialmente
- Duración del ciclo: 1.2s
- Opacity: 0.3 → 1.0 → 0.3

### Fade Out Final

- Duración: 300ms
- Opacity: 1 → 0
- Callback ejecutado al terminar

## 📱 Integración con Expo Router

Ver ejemplo completo: [`docs/examples/splash-integration-example.tsx`](./examples/splash-integration-example.tsx)

```tsx
import { SplashScreen as ExpoSplashScreen } from "expo-splash-screen";

// Prevenir que el splash nativo se oculte
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (appReady) {
      // Ocultar splash nativo
      ExpoSplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return (
      <SplashScreen
        onLoadComplete={(state) => {
          setAppReady(true);
          // Navegar según el estado
        }}
      />
    );
  }

  return <Slot />;
}
```

## 🐛 Troubleshooting

### Problema: Fuente no se muestra

**Causa**: Archivo de fuente no encontrado

**Solución**:

```bash
# Verificar que el archivo existe
ls -la assets/fonts/Pacifico-Regular.ttf

# Limpiar caché
npx expo start -c
```

### Problema: Splash no desaparece

**Causa**: `onLoadComplete` no se está llamando

**Solución**: Verifica que las verificaciones terminen correctamente:

```tsx
console.log("[Splash] Load complete called:", state);
```

### Problema: App se queda en blanco

**Causa**: Fuente no cargada y componente retorna `null`

**Solución**: Agregar fallback:

```tsx
if (!fontsLoaded) {
  return <ActivityIndicator />; // En lugar de null
}
```

### Problema: Gradiente no se ve

**Causa**: `expo-linear-gradient` no instalado

**Solución**:

```bash
npx expo install expo-linear-gradient
```

## 📚 Referencias

- **Diseño UX**: [`docs/SCREEN_FLOW_UX.md`](./SCREEN_FLOW_UX.md)
- **Setup de Fuentes**: [`docs/SPLASH_FONT_SETUP.md`](./SPLASH_FONT_SETUP.md)
- **Ejemplo de Integración**: [`docs/examples/splash-integration-example.tsx`](./examples/splash-integration-example.tsx)

## 📄 Licencia

Este componente es parte de brigadaDigital.

Fuente Pacifico: SIL Open Font License (uso libre)

---

**Hecho con ❤️ para brigadistas en campo**
