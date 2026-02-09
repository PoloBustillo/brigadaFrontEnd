# 📱 Flujo de Pantallas - UX para Brigadistas

**Fecha**: Febrero 9, 2026  
**Enfoque**: Velocidad, eficiencia, offline-first  
**Target**: Brigadistas en campo con conectividad intermitente

---

## 🎯 Principios de Diseño

### Reglas de Oro para UX Móvil en Campo

1. **Mínimos Taps** → Cada tap adicional es un punto de fricción
2. **Touch Targets Grandes** → Mínimo 48x48dp (recomendado: 56x56dp)
3. **Feedback Inmediato** → Usuario siempre sabe qué está pasando
4. **Offline-First Visual** → Estado de conexión siempre visible
5. **Auto-Save Agresivo** → Guardar cada respuesta inmediatamente
6. **Progress Claro** → Usuario sabe cuánto falta
7. **Errores Inline** → Validación en tiempo real, no al final
8. **Navegación Simple** → Siempre claro cómo volver o avanzar

---

## 📋 Listado de Pantallas (13 Total)

### Pantallas de Inicio (1)

0. **Splash + Loading** - Pantalla inicial con branding y estado

### Pantallas Principales (8)

1. **Home Dashboard** - Vista principal con estadísticas
2. **Survey List** - Lista de encuestas disponibles
3. **Survey Preview** - Preview antes de iniciar
4. **Survey Form** - Formulario principal (CORE)
5. **Photo Capture** - Captura de fotos/INE
6. **INE OCR Review** - Revisión de datos OCR extraídos
7. **Signature Capture** - Captura de firma digital
8. **Survey Summary** - Resumen antes de enviar

### Pantallas Secundarias (4)

9. **Sync Status** - Estado de sincronización
10. **Draft List** - Encuestas incompletas
11. **Response Detail** - Ver respuesta completada
12. **Settings** - Configuración de la app

---

## 🔄 Flujo Principal: Llenar Encuesta

```
┌────────────────────────────────────────────────────────────────┐
│                    FLUJO HAPPY PATH                             │
└────────────────────────────────────────────────────────────────┘

0. SPLASH + LOADING (2-3 segundos)
   ↓ Auto-transición

1. HOME DASHBOARD
   ↓ [Tap "Nueva Encuesta"]

2. SURVEY LIST
   ↓ [Select "Censo 2026"]

3. SURVEY PREVIEW
   ↓ [Tap "Iniciar"] (auto-crea draft)

4. SURVEY FORM (Auto-save cada respuesta)
   ├─→ Pregunta de texto (teclado inline)
   ├─→ Pregunta numérica (teclado numérico)
   ├─→ Select (bottom sheet con búsqueda)
   ├─→ [Tap ícono cámara] → 5. PHOTO CAPTURE
   │   ├─→ Captura INE frontal
   │   │   ↓ (OCR automático en background)
   │   └─→ 6. INE OCR REVIEW
   │       ↓ [Confirmar datos]
   ├─→ Auto-población de campos (INE)
   ├─→ Rating (estrellas grandes)
   ├─→ [Tap ícono firma] → 7. SIGNATURE CAPTURE
   │   ↓ [Guardar firma]
   └─→ Continúa hasta última pregunta

   ↓ [Tap "Finalizar"]

8. SURVEY SUMMARY (Resumen + validación final)
   ↓ [Tap "Enviar"]

   ✅ Guardado localmente (inmediato)
   📤 En cola para sincronización

   ↓ Redirect a HOME DASHBOARD

9. SYNC STATUS (Background, notificación cuando se sincroniza)
```

---

## 📱 Detalle de Cada Pantalla

### 0. Splash + Loading 🚀 (NUEVO)

**Propósito**: Branding inicial + Verificación de estado (sesión, conexión, datos)

**Duración**: Máximo 2-3 segundos

**Layout**:

```
┌──────────────────────────────────────┐
│ 09:41              📶 🔋 ▮▮▮▮▮     │ ← Status bar (sistema)
│                                      │
│                                      │
│                                      │
│                                      │
│          [GRADIENTE PRINCIPAL]       │
│                                      │
│            #FF1B8D → #FF6B9D         │ ← Degradado rosa vibrante
│                                      │
│                                      │
│                                      │
│          brigadaDigital              │ ← Logo/wordmark
│                                      │   (fuente script elegante)
│                                      │   Color: Blanco (#FFFFFF)
│                                      │   Font: Pacifico / Satisfy
│                                      │   Size: 48sp
│                                      │
│                                      │
│              ⚪⚪⚪                    │ ← Spinner animado
│                                      │   (3 dots pulsantes)
│                                      │   Color: Blanco con 80% opacity
│                                      │
│                                      │
│         Cargando encuestas...        │ ← Texto dinámico
│                                      │   Font: Roboto Regular
│                                      │   Size: 16sp
│                                      │   Color: Blanco 90%
│                                      │
│                                      │
│          [WAVE DECORATIVA]           │ ← Onda inferior (opcional)
│         ~~~~~~~~~~~~~~~~~            │   Similar a Lemonade
│                                      │
│                                      │
│                                      │
│                                      │
│                 v1.0.0               │ ← Versión (pequeña)
│                                      │   Size: 12sp, opacity 60%
└──────────────────────────────────────┘
```

**Estados del Texto Dinámico** (cambia según el proceso):

```typescript
// Secuencia de mensajes (cada uno ~500ms)
const loadingMessages = [
  '🚀 Iniciando...',
  '🔐 Verificando sesión...',
  '📡 Comprobando conexión...',
  '📊 Cargando encuestas...',
  '✅ Listo!'
];

// Estados especiales
- Si offline: '📶 Modo offline'
- Si sin sesión: '🔐 Iniciando sesión...'
- Si error: '⚠️ Reconectando...'
```

**Animaciones**:

1. **Fade In Inicial** (300ms)
   - Logo aparece con fade + slight scale (0.95 → 1.0)

2. **Spinner Pulsante** (Loop infinito)

   ```
   ⚪⚪⚪ → ⚫⚪⚪ → ⚪⚫⚪ → ⚪⚪⚫ → ⚪⚪⚪
   ```

   - 3 dots que se encienden secuencialmente
   - Duración: 1.2s por ciclo

3. **Fade Out Final** (300ms)
   - Cuando termina carga → fade out + slide up
   - Transición suave a Home Dashboard

**Gradiente Inspirado en Lemonade**:

```typescript
const gradient = {
  colors: ["#FF1B8D", "#FF6B9D"], // Rosa vibrante
  angle: 135, // Diagonal
  locations: [0.0, 1.0],
};

// Alternativa más suave:
const gradientAlt = {
  colors: ["#E91E63", "#F48FB1"], // Material Pink
  angle: 135,
};
```

**Fuente para "brigadaDigital"** (estilo Lemonade):

- **Opción 1**: Pacifico (Google Fonts) - Script redondeada, amigable
- **Opción 2**: Satisfy (Google Fonts) - Más elegante
- **Opción 3**: Cookie (Google Fonts) - Casual y moderna
- **Opción 4**: Custom handwriting font similar

**Implementación React Native**:

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";

export default function SplashScreen({ onLoadComplete }: Props) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  const [fontsLoaded] = useFonts({
    Pacifico: require("./assets/fonts/Pacifico-Regular.ttf"),
  });

  const messages = [
    "🚀 Iniciando...",
    "🔐 Verificando sesión...",
    "📡 Comprobando conexión...",
    "📊 Cargando encuestas...",
    "✅ Listo!",
  ];

  useEffect(() => {
    // Fade in inicial
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Cambiar mensajes cada 500ms
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    // Terminar después de 2.5s
    const timer = setTimeout(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onLoadComplete();
      });
    }, 2500);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, []);

  if (!fontsLoaded) {
    return null; // Esperar fuentes
  }

  return (
    <LinearGradient
      colors={["#FF1B8D", "#FF6B9D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Wordmark */}
        <Text style={styles.logo}>brigadaDigital</Text>

        {/* Spinner (3 dots) */}
        <View style={styles.spinnerContainer}>
          <DotSpinner />
        </View>

        {/* Mensaje dinámico */}
        <Text style={styles.message}>{messages[currentMessage]}</Text>

        {/* Versión */}
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>

      {/* Wave decorativa opcional */}
      <View style={styles.waveContainer}>
        <WaveShape />
      </View>
    </LinearGradient>
  );
}

// Componente de spinner con 3 dots
function DotSpinner() {
  const dot1 = useState(new Animated.Value(0))[0];
  const dot2 = useState(new Animated.Value(0))[0];
  const dot3 = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 400);
    animate(dot3, 800);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 48,
    color: "#FFFFFF",
    marginBottom: 60,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  message: {
    fontFamily: "Roboto",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  version: {
    position: "absolute",
    bottom: 40,
    fontFamily: "Roboto",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
```

**Lógica de Carga en Paralelo**:

```typescript
async function initializeApp() {
  try {
    // Ejecutar en paralelo
    const [session, connection, surveys] = await Promise.all([
      checkSession(), // 🔐 Verificar sesión
      checkConnection(), // 📡 Estado de red
      loadSurveys(), // 📊 Cargar encuestas
    ]);

    return {
      hasSession: session.isValid,
      isOnline: connection.isOnline,
      surveysLoaded: surveys.length > 0,
    };
  } catch (error) {
    console.error("Error initializing app:", error);
    return null;
  }
}
```

**Estados Especiales**:

```typescript
// Si está offline
if (!isOnline) {
  setCurrentMessage(messages.indexOf("📶 Modo offline"));
}

// Si no hay sesión
if (!hasSession) {
  // Redirect a Login después del splash
  navigation.replace("Login");
} else {
  // Redirect a Home
  navigation.replace("Home");
}

// Si hay error crítico
if (error) {
  setCurrentMessage("⚠️ Error de conexión");
  // Mostrar retry button después de 3s
}
```

**Interacciones**:

- **Ninguna** - El splash es completamente automático
- No permite skip (importante para verificaciones de seguridad)
- Máximo 2-3 segundos
- Auto-transición a:
  - **Home Dashboard** (si hay sesión válida)
  - **Login Screen** (si no hay sesión)
  - **Error Screen** (si falla carga crítica)

**Variantes de Color** (opcionales):

```typescript
// Variante 1: Rosa Lemonade (Principal)
colors: ["#FF1B8D", "#FF6B9D"];

// Variante 2: Azul Profesional
colors: ["#1E3A8A", "#3B82F6"];

// Variante 3: Verde Gobierno
colors: ["#065F46", "#10B981"];

// Variante 4: Naranja Vibrante
colors: ["#EA580C", "#FB923C"];
```

**Optimizaciones**:

- Cargar assets críticos durante el splash
- Pre-cargar primera pantalla (Home Dashboard)
- Cachear fuentes y recursos
- Ejecutar verificaciones en paralelo
- No bloquear UI thread

**Checklist de Carga**:

- ✅ SQLite inicializado
- ✅ Sesión verificada (JWT válido)
- ✅ Estado de conexión detectado
- ✅ Encuestas básicas cargadas (si online)
- ✅ Permisos verificados (cámara, ubicación)
- ✅ First screen pre-rendered

---

### 1. Home Dashboard 📊

**Propósito**: Vista principal, estadísticas rápidas, acceso rápido

**Layout**:

```
┌──────────────────────────────────────┐
│ ☰  BRIGADA 2026          🔔  👤      │ ← Header (56dp)
├──────────────────────────────────────┤
│ 📶 Offline  🔄 3 pendientes         │ ← Estado (48dp)
├──────────────────────────────────────┤
│                                      │
│  📊 Resumen del Día                 │
│  ┌──────────────────────────────┐   │
│  │  ✅ Completadas: 12          │   │
│  │  📝 En proceso: 2            │   │
│  │  📤 Por sincronizar: 8       │   │
│  │  ⚠️  Con errores: 1          │   │
│  └──────────────────────────────┘   │
│                                      │
│  🚀 Acceso Rápido                   │
│  ┌──────────────┐ ┌──────────────┐  │
│  │  📋 Nueva    │ │  📝 Borradores│  │ ← Botones grandes
│  │  Encuesta    │ │     (2)      │  │   (120dp altura)
│  └──────────────┘ └──────────────┘  │
│                                      │
│  📜 Recientes                        │
│  ┌──────────────────────────────┐   │
│  │ Censo - Juan Pérez           │   │ ← Lista de items
│  │ Hace 5 min  📤 Sincronizando │   │   (72dp altura)
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Censo - María García         │   │
│  │ Hace 15 min  ✅ Enviado      │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
   ↑ Bottom Navigation (56dp)
   🏠 Inicio | 📋 Encuestas | 📤 Sync | ⚙️ Config
```

**Interacciones**:

- **Tap "Nueva Encuesta"** → Survey List
- **Tap "Borradores (2)"** → Draft List
- **Tap item reciente** → Response Detail
- **Tap 🔄 icono** → Sync Status
- **Pull to refresh** → Actualizar estadísticas

**Touch Targets**:

- Botones acceso rápido: **120dp altura x full width**
- Items lista: **72dp altura**
- Bottom nav icons: **56x56dp**

**Indicadores Offline**:

- 🌐 Online (verde) | 📶 Offline (gris)
- 🔄 Sincronizando (animado)
- Badge con número pendientes

---

### 2. Survey List 📋

**Propósito**: Seleccionar encuesta a llenar

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Encuestas Disponibles     🔍      │
├──────────────────────────────────────┤
│ 📶 Offline                          │
├──────────────────────────────────────┤
│                                      │
│  🔎 Buscar encuesta...               │ ← Search bar (56dp)
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 📊 Censo Poblacional 2026    │   │
│  │ 13 preguntas • ~15 min       │   │ ← Card (120dp)
│  │ ✅ Disponible offline        │   │
│  │                              │   │
│  │         [INICIAR] ──────────→│   │ ← CTA button
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 🏥 Encuesta de Salud         │   │
│  │ 8 preguntas • ~10 min        │   │
│  │ ⚠️ Requiere conexión         │   │
│  │                              │   │
│  │         [DESCARGAR]          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 😊 Satisfacción del Servicio │   │
│  │ 5 preguntas • ~5 min         │   │
│  │ ✅ Disponible offline        │   │
│  │                              │   │
│  │         [INICIAR] ──────────→│   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap card** → Survey Preview
- **Tap "INICIAR"** → Survey Preview (directo)
- **Tap "DESCARGAR"** → Descarga schema (con progress)
- **Search** → Filtrado en tiempo real

**Touch Targets**:

- Cards: **120dp altura**
- Botón "INICIAR": **48dp altura x 120dp ancho**

**Estados Visuales**:

- ✅ Disponible offline (verde)
- ⚠️ Requiere descarga (amarillo)
- 🔒 Bloqueada (gris)

---

### 3. Survey Preview 👁️

**Propósito**: Preview rápido antes de iniciar (opcional, puede saltarse)

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Censo Poblacional 2026            │
├──────────────────────────────────────┤
│ 📶 Offline                          │
├──────────────────────────────────────┤
│                                      │
│  📊 Censo Poblacional 2026          │
│  Versión 1.0.0                      │
│                                      │
│  ⏱️ Duración estimada: 15 min       │
│  📝 13 preguntas                     │
│  📷 Incluye captura de INE          │
│  ✍️ Requiere firma                  │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  Secciones:                          │
│  1. Datos Personales (5 preguntas)  │
│  2. Dirección (3 preguntas)         │
│  3. INE + Captura (2 preguntas)     │
│  4. Información Adicional (3 preg.) │
│                                      │
│                                      │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      ✅ INICIAR ENCUESTA    │    │ ← CTA principal
│  │                             │    │   (64dp altura)
│  └─────────────────────────────┘    │
│                                      │
│  Ver ejemplo de formulario →        │ ← Link secundario
│                                      │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap "INICIAR ENCUESTA"** → Survey Form (crea draft)
- **Tap "Ver ejemplo"** → Modal con screenshot
- **Tap atrás** → Survey List

**Auto-Actions**:

- Si vuelves a entrar, detecta draft existente
- Muestra: "Continuar donde lo dejaste" o "Iniciar nueva"

---

### 4. Survey Form 📝 (CORE - La pantalla más importante)

**Propósito**: Captura de respuestas con máxima eficiencia

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Censo 2026    [3/13]  ⋮           │ ← Progress (56dp)
│ ●●●○○○○○○○○○○ 23%                   │ ← Progress bar
├──────────────────────────────────────┤
│ 📶 Offline  💾 Guardado hace 2s     │ ← Estado (auto-save)
├──────────────────────────────────────┤
│                                      │
│  📋 Datos Personales (Sección 1/4)  │ ← Sección header
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ❓ ¿Cuál es tu nombre completo? *  │ ← Pregunta
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Juan Pérez Martínez            │ │ ← Input grande
│  └────────────────────────────────┘ │   (56dp altura)
│                                      │
│  ⓘ Nombre como aparece en INE       │ ← Helper text
│                                      │
│  ✓ Validado                          │ ← Feedback inline
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ❓ ¿Cuántos años tienes? *          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │         35                     │ │ ← Number input
│  │    [  -  ]      [  +  ]        │ │   con +/- buttons
│  └────────────────────────────────┘ │   (72dp altura)
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ⬇️ Scroll para más preguntas       │
│                                      │
└──────────────────────────────────────┘
│  [  ANTERIOR  ] [   SIGUIENTE →  ]  │ ← Navigation
│      (Optional)      (Primary)      │   (56dp altura)
└──────────────────────────────────────┘
```

**Tipos de Inputs Optimizados**:

#### Text Input

```
┌────────────────────────────────┐
│ Juan Pérez                  🗑️│ ← Clear button
└────────────────────────────────┘
  56dp altura, padding 16dp
```

#### Number Input con Stepper

```
┌────────────────────────────────┐
│          35                    │
│   ┌──────┐        ┌──────┐    │
│   │  -   │        │  +   │    │ ← Botones grandes
│   └──────┘        └──────┘    │   (48x48dp cada uno)
└────────────────────────────────┘
  72dp altura total
```

#### Select (Bottom Sheet)

```
Tap input abre bottom sheet:

┌────────────────────────────────┐
│ Selecciona una opción          │
│                                │
│ 🔍 Buscar...                   │
│                                │
│ ┌────────────────────────────┐│
│ │ ✓ Opción A                 ││ ← Opción seleccionada
│ └────────────────────────────┘│   (64dp altura)
│ ┌────────────────────────────┐│
│ │   Opción B                 ││
│ └────────────────────────────┘│
│ ┌────────────────────────────┐│
│ │   Opción C                 ││
│ └────────────────────────────┘│
│                                │
│      [CONFIRMAR]               │
└────────────────────────────────┘
```

#### Radio/Checkbox (Inline)

```
○ Masculino          ← 56dp altura
○ Femenino           ← Touch target completo
○ Otro               ← No solo el radio
```

#### Rating (Estrellas)

```
★ ★ ★ ★ ☆  (4/5)    ← 48x48dp cada estrella
```

#### Slider

```
┌────────●──────────┐  75 km
│                   │
└───────────────────┘
  Thumb: 32dp, track: 8dp altura
```

#### Date Picker (Native)

```
┌────────────────────────────────┐
│ 📅  15 / Febrero / 2026   🗓️  │ ← Tap abre calendar
└────────────────────────────────┘
  56dp altura
```

#### Photo/INE Capture

```
┌────────────────────────────────┐
│                                │
│        📷 Capturar INE         │ ← Botón grande con ícono
│                                │   (80dp altura)
│  ⓘ Frente y reverso requeridos │
└────────────────────────────────┘
```

#### Signature

```
┌────────────────────────────────┐
│                                │
│        ✍️ Firmar Aquí          │
│                                │   (80dp altura)
│  ⓘ Use su dedo para firmar     │
└────────────────────────────────┘
```

**Interacciones Clave**:

1. **Auto-Save Agresivo**:
   - `onBlur` de cada input → `updateAnswers()`
   - Debounce 500ms para no saturar
   - Toast sutil: "💾 Guardado" (2 segundos)

2. **Navegación**:
   - **Swipe left** → Siguiente pregunta
   - **Swipe right** → Pregunta anterior
   - **Tap "SIGUIENTE"** → Valida + avanza
   - **Tap "ANTERIOR"** → Vuelve sin validar

3. **Lógica Condicional**:
   - Preguntas aparecen/desaparecen con animación
   - Progress bar se actualiza en tiempo real

4. **Validación Inline**:
   - ✓ Verde → Válido
   - ⚠️ Amarillo → Advertencia (puede continuar)
   - ✗ Rojo → Error (debe corregir)

5. **Captura de Archivos**:
   - Tap ícono cámara → Abre cámara directamente
   - Tap ícono firma → Abre signature pad
   - Muestra thumbnail después de captura

**Estados de Carga**:

```
┌────────────────────────────────────┐
│ Procesando OCR...                  │
│ ┌────────────────────────────────┐ │
│ │ ████████████░░░░░░░░░░░░  60% │ │
│ └────────────────────────────────┘ │
│                                    │
│ Por favor espere                   │
└────────────────────────────────────┘
```

**Touch Targets Mínimos**:

- Text inputs: **56dp altura**
- Buttons: **48dp altura x 120dp ancho (mínimo)**
- Radio/Checkbox: **48x48dp** (área completa clickeable)
- Icons: **24dp** dentro de **48x48dp** touch target

---

### 5. Photo Capture 📷

**Propósito**: Captura de fotos/INE con preview

**Layout (Modo Cámara)**:

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│          [PREVIEW CÁMARA]            │
│                                      │
│          ┌─────────────┐             │
│          │  Guía INE   │             │ ← Overlay guide
│          │  Frontal    │             │
│          └─────────────┘             │
│                                      │
│                                      │
│  ⓘ Centra el INE en el recuadro     │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  🔦        ⭕         🔄             │ ← Controles
│ Flash    CAPTURAR   Voltear          │   (grandes)
│          (64x64dp)                   │
└──────────────────────────────────────┘
```

**Layout (Después de Captura)**:

```
┌──────────────────────────────────────┐
│ × Captura de INE Frontal            │
├──────────────────────────────────────┤
│                                      │
│                                      │
│        [PREVIEW DE FOTO]             │
│                                      │
│                                      │
│  ✓ Foto capturada correctamente     │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ REPETIR  │  │  ✓ USAR ESTA    │ │
│  │          │  │     FOTO        │ │
│  └──────────┘  └──────────────────┘ │
│   (Secundario)    (Primario, 60%)  │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap "CAPTURAR"** → Toma foto + muestra preview
- **Tap "USAR ESTA FOTO"** →
  - Si es INE → Inicia OCR automático → INE OCR Review
  - Si es foto normal → Vuelve a Survey Form con thumbnail
- **Tap "REPETIR"** → Vuelve a modo cámara
- **Tap ×** → Cancela, vuelve a Survey Form

**Optimizaciones**:

- Comprime foto a 1920x1080 max (calidad 0.8)
- Genera thumbnail 300x300
- Guarda en FileSystem inmediatamente
- Registra en SQLite con `sync_status='pending'`

---

### 6. INE OCR Review ✅ (Nueva pantalla crítica)

**Propósito**: Revisar y corregir datos extraídos por OCR del INE

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Revisión de Datos INE             │
├──────────────────────────────────────┤
│ 📶 Offline  🤖 OCR: 95% confianza   │ ← Nivel de confianza
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  │    [THUMBNAIL INE CAPTURADO]   │ │ ← Preview pequeño
│  │                                │ │   (tap para ver grande)
│  └────────────────────────────────┘ │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  📝 Datos Extraídos                  │
│                                      │
│  Nombre Completo                     │
│  ┌────────────────────────────────┐ │
│  │ JUAN PEREZ MARTINEZ        ✏️  │ │ ← Editable inline
│  └────────────────────────────────┘ │   ✓ = Validado
│  ✓ Confianza: 98%                    │   ⚠️ = Revisar
│                                      │   ✗ = Error
│  CURP                                │
│  ┌────────────────────────────────┐ │
│  │ PEMJ850315HDFRXN09         ✏️  │ │
│  └────────────────────────────────┘ │
│  ✓ Confianza: 95%                    │
│                                      │
│  Clave de Elector ⚠️                 │
│  ┌────────────────────────────────┐ │
│  │ PRMRJN85031H300        ✏️  │ │ ← Baja confianza
│  └────────────────────────────────┘ │   (amarillo)
│  ⚠️ Confianza: 72% - Revisar         │
│                                      │
│  Fecha de Nacimiento                 │
│  ┌────────────────────────────────┐ │
│  │ 15 / 03 / 1985             ✏️  │ │
│  └────────────────────────────────┘ │
│  ✓ Confianza: 99%                    │
│                                      │
│  Sección Electoral                   │
│  ┌────────────────────────────────┐ │
│  │ 1234                       ✏️  │ │
│  └────────────────────────────────┘ │
│  ✓ Confianza: 90%                    │
│                                      │
│  ⬇️ Más campos (scroll)              │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌─────────────┐ ┌────────────────┐ │
│  │  REPETIR    │ │  ✓ CONFIRMAR   │ │
│  │  CAPTURA    │ │     DATOS      │ │
│  └─────────────┘ └────────────────┘ │
│   (Secundario)     (Primario)       │
└──────────────────────────────────────┘
```

**Interacciones**:

1. **Confianza por Campo**:
   - **✓ Verde (>85%)** → Auto-aprobado
   - **⚠️ Amarillo (70-85%)** → Revisar recomendado
   - **✗ Rojo (<70%)** → Debe corregirse

2. **Edición Inline**:
   - Tap ✏️ o tap campo → Activa edición
   - `onChange` → Marca como "manualmente validado"
   - Campo editado muestra badge: "✋ Editado"

3. **Acciones**:
   - **Tap "CONFIRMAR DATOS"**:
     - Auto-puebla preguntas del formulario
     - Marca campos con `autoPopulated: true`
     - Vuelve a Survey Form con campos llenos
     - Toast: "✓ Datos aplicados a la encuesta"
   - **Tap "REPETIR CAPTURA"**:
     - Vuelve a Photo Capture
     - Descarta datos OCR actuales

4. **Ver Foto Grande**:
   - Tap thumbnail → Modal fullscreen con zoom
   - Útil para verificar datos dudosos

**Validaciones Especiales**:

- **CURP**: Valida formato (18 caracteres)
- **Clave de Elector**: Valida formato (18 dígitos)
- **Fecha**: Valida formato DD/MM/YYYY
- Si validación falla → Campo se marca en rojo

**Estados de Carga**:

```
Durante procesamiento OCR:

┌────────────────────────────────────┐
│ 🤖 Procesando INE...               │
│                                    │
│ ┌────────────────────────────────┐│
│ │ ████████████████░░░░░░  75%   ││
│ └────────────────────────────────┘│
│                                    │
│ Extrayendo información...          │
│ • Nombre ✓                         │
│ • CURP ✓                           │
│ • Clave de Elector...              │
└────────────────────────────────────┘
```

**Caso: OCR Falla Completamente**:

```
┌────────────────────────────────────┐
│ ⚠️ No se pudo procesar el INE      │
│                                    │
│ La foto no tiene suficiente        │
│ claridad o el INE está muy         │
│ deteriorado.                       │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ REPETIR CAPTURA              │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ LLENAR MANUALMENTE           │  │ ← Fallback
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

### 7. Signature Capture ✍️

**Propósito**: Captura de firma digital

**Layout**:

```
┌──────────────────────────────────────┐
│ × Firma Digital                     │
├──────────────────────────────────────┤
│ ⓘ Firme con su dedo en el espacio   │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  │                                │ │
│  │    ✍️ [ÁREA DE FIRMA]          │ │ ← Canvas grande
│  │                                │ │   (400dp altura)
│  │                                │ │
│  │      Signature here...         │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│  🎨 Negro  📏 Medio                  │ ← Controles simples
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ LIMPIAR  │  │  ✓ GUARDAR       │ │
│  │          │  │     FIRMA        │ │
│  └──────────┘  └──────────────────┘ │
│   (Secundario)    (Primario)        │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Draw on canvas** → Captura trazo en tiempo real
- **Tap "LIMPIAR"** → Borra canvas
- **Tap "GUARDAR FIRMA"** →
  - Convierte a PNG (transparente)
  - Guarda en FileSystem
  - Registra en SQLite
  - Vuelve a Survey Form con preview

**Configuración**:

- Stroke color: Negro
- Stroke width: 3dp (medio)
- Background: Blanco
- Export: PNG 800x400px

---

### 8. Survey Summary 📄

**Propósito**: Resumen final antes de enviar

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Resumen Final                     │
├──────────────────────────────────────┤
│ 📶 Offline  ✅ Todo guardado        │
├──────────────────────────────────────┤
│                                      │
│  📊 Censo Poblacional 2026          │
│  Versión 1.0.0                      │
│                                      │
│  ✓ 13/13 preguntas respondidas      │
│  ⏱️ Tiempo: 12 minutos              │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  📋 Datos Personales                 │
│  Nombre: Juan Pérez Martínez        │
│  Edad: 35 años                      │
│  CURP: PEMJ850315HDFRXN09           │
│                                      │
│  📍 Dirección                        │
│  Calle: Av. Reforma 123             │
│  Colonia: Centro                    │
│  CP: 06600                          │
│                                      │
│  📷 Archivos Adjuntos               │
│  • INE Frontal ✓                    │
│  • INE Reverso ✓                    │
│  • Firma Digital ✓                  │
│                                      │
│  ⬇️ Ver todas las respuestas        │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ⚠️ Importante                       │
│  Al enviar, los datos no podrán     │
│  ser modificados.                   │
│                                      │
│  📤 Los archivos se subirán         │
│  cuando haya conexión a internet.   │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ REVISAR  │  │  ✓ CONFIRMAR     │ │
│  │ DATOS    │  │     ENVÍO        │ │
│  └──────────┘  └──────────────────┘ │
│   (Secundario)    (Primario)        │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap "REVISAR DATOS"** → Vuelve a Survey Form (modo edición)
- **Tap "CONFIRMAR ENVÍO"** →
  - Marca como `status='completed'`
  - Calcula `duration_seconds`
  - Añade a sync queue (si offline)
  - Muestra success modal
  - Redirect a Home Dashboard

**Success Modal**:

```
┌────────────────────────────────────┐
│         ✅                         │
│                                    │
│   ¡Encuesta Completada!            │
│                                    │
│ Se guardó correctamente.           │
│                                    │
│ 📤 Se enviará cuando haya          │
│    conexión a internet.            │
│                                    │
│ ┌──────────────────────────────┐  │
│ │      IR AL INICIO            │  │
│ └──────────────────────────────┘  │
│                                    │
│ Nueva encuesta →                   │
└────────────────────────────────────┘
```

---

### 9. Sync Status 🔄

**Propósito**: Monitorear sincronización en background

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Estado de Sincronización          │
├──────────────────────────────────────┤
│ 🌐 Online  🔄 Sincronizando...      │
├──────────────────────────────────────┤
│                                      │
│  📊 Resumen                          │
│  ┌──────────────────────────────┐   │
│  │ ✅ Enviadas: 8                │   │
│  │ 🔄 En proceso: 3              │   │
│  │ ⏳ Pendientes: 2              │   │
│  │ ⚠️ Con error: 1               │   │
│  └──────────────────────────────┘   │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  🔄 En Proceso                       │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Censo - Juan Pérez             │ │
│  │ ███████████░░░░░░░░  60%       │ │ ← Progress bar
│  │ Subiendo archivos (2/3)...     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ⏳ Pendientes                       │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Censo - María García           │ │
│  │ Esperando conexión...          │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Satisfacción - Pedro López     │ │
│  │ En cola...                     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ⚠️ Con Error                        │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Censo - Ana Martínez       🔄  │ │
│  │ Error: Timeout de red          │ │ ← Acción: reintentar
│  │ [REINTENTAR]                   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ✅ Enviadas Hoy (8)                │
│  Ver historial →                    │
│                                      │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap item** → Response Detail
- **Tap "REINTENTAR"** → Reintenta sincronización
- **Pull to refresh** → Fuerza sincronización manual
- **Tap "Ver historial"** → Lista completa

**Estados Visuales**:

- 🔄 Sincronizando (animación)
- ✅ Enviado (verde)
- ⏳ Pendiente (gris)
- ⚠️ Error (rojo)

**Notificaciones**:

- Background task revisa cada 5 minutos
- Notifica cuando sincroniza exitosamente
- Notifica si hay errores persistentes

---

### 10. Draft List 📝

**Propósito**: Ver y continuar encuestas incompletas

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Borradores                        │
├──────────────────────────────────────┤
│ 📶 Offline                          │
├──────────────────────────────────────┤
│                                      │
│  2 encuestas pendientes              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📊 Censo - Juan Pérez          │ │
│  │ ●●●●●○○○○○○○○ 38%              │ │
│  │ Hace 2 horas                   │ │
│  │                                │ │
│  │ [CONTINUAR] [🗑️]              │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 😊 Satisfacción - María G.     │ │
│  │ ●●○○○ 40%                      │ │
│  │ Hace 1 día                     │ │
│  │                                │ │
│  │ [CONTINUAR] [🗑️]              │ │
│  └────────────────────────────────┘ │
│                                      │
│  ⓘ Los borradores se guardan       │
│     automáticamente                 │
│                                      │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap "CONTINUAR"** → Survey Form (en la última pregunta)
- **Tap 🗑️** → Confirma eliminación
- **Swipe left** → Acciones rápidas (eliminar)

---

### 11. Response Detail 👁️

**Propósito**: Ver respuesta completada (read-only)

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Censo - Juan Pérez                │
├──────────────────────────────────────┤
│ ✅ Enviado  📅 Hace 2 horas         │
├──────────────────────────────────────┤
│                                      │
│  📊 Censo Poblacional 2026          │
│                                      │
│  📅 9 Feb 2026, 10:35 AM            │
│  ⏱️ Duración: 12 minutos            │
│  🌐 Estado: Sincronizado            │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  📋 Respuestas                       │
│                                      │
│  Nombre Completo                     │
│  Juan Pérez Martínez                │
│                                      │
│  Edad                                │
│  35 años                            │
│                                      │
│  CURP                                │
│  PEMJ850315HDFRXN09                 │
│                                      │
│  📍 Ubicación                        │
│  19.4326, -99.1332 (±5m)            │
│  [Ver en mapa]                      │
│                                      │
│  📷 Archivos                         │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │[IMG] │ │[IMG] │ │[SIG] │        │ ← Thumbnails
│  │ INE  │ │ INE  │ │Firma │        │   (tap para ver)
│  │Front │ │Back  │ │      │        │
│  └──────┘ └──────┘ └──────┘        │
│                                      │
│  ⬇️ Ver todas las respuestas        │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  [📤 REENVIAR] [🗑️ ELIMINAR]        │ ← Solo si hay error
│                                      │
└──────────────────────────────────────┘
```

**Interacciones**:

- **Tap thumbnail** → Visor de imagen fullscreen
- **Tap "Ver en mapa"** → Abre mapa con pin
- **Tap "REENVIAR"** → Reintenta sincronización (si error)
- **Tap "ELIMINAR"** → Confirma + elimina (solo drafts)

---

### 12. Settings ⚙️

**Propósito**: Configuración de la app

**Layout**:

```
┌──────────────────────────────────────┐
│ ← Configuración                     │
├──────────────────────────────────────┤
│                                      │
│  👤 Usuario                          │
│  Juan Pérez (Brigadista)            │
│  ID: user-123                       │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  🔄 Sincronización                   │
│                                      │
│  ⚡ Auto-sincronización              │
│  ────────────────────────── ●       │ ← Toggle
│                                      │
│  📶 Solo con WiFi                    │
│  ────────────────────────── ○       │
│                                      │
│  ⚙️ Frecuencia: Cada 15 min         │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  📷 Captura de Fotos                 │
│                                      │
│  🎨 Calidad: Alta (80%)              │
│  📏 Máximo tamaño: 10 MB             │
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  🗄️ Almacenamiento                   │
│                                      │
│  Usado: 156 MB / 500 MB             │
│  ████░░░░░░░░░░░░░░░░░ 31%          │
│                                      │
│  [LIMPIAR ARCHIVOS SINCRONIZADOS]   │ ← Liberar espacio
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  ℹ️ Información                      │
│  Versión: 1.0.0                     │
│  Última sincronización: Hace 5 min  │
│                                      │
│  [CERRAR SESIÓN]                    │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎨 Sistema de Design Tokens

### Colores

```typescript
const colors = {
  // Primary
  primary: "#2563EB", // Blue 600
  primaryDark: "#1E40AF", // Blue 700
  primaryLight: "#60A5FA", // Blue 400

  // Status
  success: "#10B981", // Green 500
  warning: "#F59E0B", // Amber 500
  error: "#EF4444", // Red 500
  info: "#3B82F6", // Blue 500

  // Offline/Sync
  offline: "#6B7280", // Gray 500
  syncing: "#8B5CF6", // Purple 500
  synced: "#10B981", // Green 500

  // Background
  background: "#FFFFFF",
  backgroundSecondary: "#F9FAFB", // Gray 50

  // Text
  textPrimary: "#111827", // Gray 900
  textSecondary: "#6B7280", // Gray 500
  textDisabled: "#D1D5DB", // Gray 300

  // Border
  border: "#E5E7EB", // Gray 200
  borderFocus: "#2563EB", // Blue 600
};
```

### Spacing

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Typography

```typescript
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
};
```

### Touch Targets

```typescript
const touchTargets = {
  minimum: 48, // Material Design minimum
  recommended: 56, // Nuestro estándar
  large: 64, // Para acciones primarias
  extraLarge: 80, // Para captura de fotos/firma
};
```

---

## 🔔 Sistema de Feedback

### 1. Indicadores de Estado Persistentes

**Header Bar** (Siempre visible):

```
┌────────────────────────────────────┐
│ 🌐 Online  💾 Guardado  🔄 3      │ ← Sticky header
└────────────────────────────────────┘
```

Estados:

- 🌐 **Online** (verde) - Conexión activa
- 📶 **Offline** (gris) - Sin conexión
- 🔄 **Sincronizando** (animado) - Sync en proceso
- ⚠️ **Error de sync** (rojo) - Falló sincronización

### 2. Auto-Save Feedback

```typescript
// Cada vez que se guarda
showToast({
  message: "💾 Guardado",
  duration: 2000,
  position: "bottom",
  type: "success",
});
```

### 3. Progress Indicators

#### Linear Progress (Survey Form)

```
●●●●●○○○○○○○○ 38%
```

#### Circular Progress (Upload Files)

```
   ⭕ 60%
```

#### Skeleton Loading (Inicial)

```
┌─────────────────────┐
│ ░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░    │
│ ░░░░░░░░░░░░░░░░░░ │
└─────────────────────┘
```

### 4. Empty States

```
┌────────────────────────────────────┐
│                                    │
│         📋                         │
│                                    │
│   No hay encuestas                 │
│   pendientes                       │
│                                    │
│   ¡Todo sincronizado!              │
│                                    │
│  [INICIAR NUEVA ENCUESTA]          │
│                                    │
└────────────────────────────────────┘
```

### 5. Error States

```
┌────────────────────────────────────┐
│         ⚠️                         │
│                                    │
│   Error de Sincronización          │
│                                    │
│   No se pudo conectar al servidor. │
│   Los datos están guardados        │
│   localmente y se reintentará      │
│   automáticamente.                 │
│                                    │
│  [REINTENTAR AHORA]                │
│                                    │
└────────────────────────────────────┘
```

---

## 🚀 Optimizaciones de Performance

### 1. Lazy Loading de Secciones

Solo renderizar sección visible + siguiente:

```typescript
<VirtualizedSectionList
  sections={survey.sections}
  windowSize={2} // Actual + siguiente
  removeClippedSubviews={true}
/>
```

### 2. Debounced Auto-Save

```typescript
const debouncedSave = useDebouncedCallback(
  (answers) => {
    responseRepository.updateAnswers(responseId, answers);
  },
  500, // Espera 500ms después de última edición
);
```

### 3. Optimistic UI

```typescript
// Actualizar UI inmediatamente
setAnswers((prev) => ({ ...prev, [questionId]: value }));

// Guardar en background
saveAnswerAsync(questionId, value);
```

### 4. Image Optimization

- Captura: 1920x1080 max
- Compresión: 0.8 quality
- Thumbnail: 300x300
- Formato: JPEG (fotos), PNG (firma)

### 5. Background Sync

```typescript
// Tarea en background cada 15 min
BackgroundTask.register(async () => {
  if (isOnline) {
    await syncPendingResponses();
  }
});
```

---

## 📊 Métricas de Éxito

### KPIs de UX

1. **Time to Complete Survey**
   - Target: <15 minutos para censo
   - Medida: `completed_at - started_at`

2. **Número de Taps**
   - Target: <100 taps para encuesta de 13 preguntas
   - Medida: Event tracking

3. **Auto-Save Success Rate**
   - Target: >99%
   - Medida: `saves_successful / saves_attempted`

4. **OCR Accuracy**
   - Target: >90% confidence promedio
   - Medida: `ocrData.confidence`

5. **Sync Success Rate**
   - Target: >95% en primer intento
   - Medida: `synced / attempted`

6. **Draft Completion Rate**
   - Target: >80% de drafts se completan
   - Medida: `completed / drafts_created`

---

## 🎯 Resumen Ejecutivo

### Total de Pantallas: 12

**Pantallas Críticas (5)** - Path principal:

1. Home Dashboard
2. Survey List
3. Survey Form (CORE)
4. INE OCR Review (Nueva)
5. Survey Summary

**Pantallas de Captura (2)**: 6. Photo Capture 7. Signature Capture

**Pantallas de Gestión (3)**: 8. Sync Status 9. Draft List 10. Response Detail

**Pantallas Secundarias (2)**: 11. Survey Preview 12. Settings

### Taps Mínimos para Flujo Completo

```
Home → Survey List → Survey Form (13 preguntas) → Summary → Enviar
  1   +      1      +          13            +    1     +    1   = 17 taps

+ 2 taps para captura INE (frontal + confirmar)
+ 1 tap para firma

TOTAL: ~20 taps para encuesta completa ✅
```

### Touch Targets Garantizados

- **Mínimo**: 48x48dp (Material Design)
- **Estándar**: 56x56dp (inputs, buttons)
- **Primary Actions**: 64dp altura
- **Captura (foto/firma)**: 80dp altura

### Feedback Omnipresente

- **Header persistente**: Estado offline + sync + save
- **Progress bar**: Siempre visible en Survey Form
- **Auto-save toast**: Cada 2 segundos después de guardar
- **Inline validation**: Tiempo real, no al final

### Offline-First Garantizado

- ✅ Todas las pantallas funcionan offline
- ✅ Auto-save cada respuesta
- ✅ Indicador de estado persistente
- ✅ Queue de sincronización con reintentos
- ✅ Archivos se suben cuando hay conexión

**🎉 UX optimizado para velocidad, claridad y confiabilidad en campo!**
