/**
 * Splash Screen Component
 *
 * Pantalla inicial con branding y verificación de estado.
 * Inspirada en el diseño de Lemonade Insurance.
 *
 * Duración: 2-3 segundos máximo
 *
 * @see docs/SCREEN_FLOW_UX.md - Sección "Splash + Loading"
 */

import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ============================================================================
// TYPES
// ============================================================================

interface SplashScreenProps {
  /** Callback cuando termina la carga */
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

type LoadingMessage =
  | "🚀 Iniciando..."
  | "🔐 Verificando sesión..."
  | "📡 Comprobando conexión..."
  | "📊 Cargando encuestas..."
  | "📶 Modo offline"
  | "✅ Listo!"
  | "⚠️ Reconectando...";

// ============================================================================
// CONSTANTS
// ============================================================================

const LOADING_MESSAGES: LoadingMessage[] = [
  "🚀 Iniciando...",
  "🔐 Verificando sesión...",
  "📡 Comprobando conexión...",
  "📊 Cargando encuestas...",
  "✅ Listo!",
];

const MESSAGE_DURATION = 500; // ms entre mensajes
const SPLASH_DURATION = 2500; // ms total
const FADE_DURATION = 300; // ms para fade in/out

// Gradiente principal (inspirado en Lemonade)
const GRADIENT_COLORS = ["#FF1B8D", "#FF6B9D"] as const; // Rosa vibrante
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SplashScreen({ onLoadComplete }: SplashScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  // Cargar fuentes personalizadas
  const [fontsLoaded, fontError] = useFonts({
    // Pacifico: fuente script elegante para el logo
    // Nota: Descarga Pacifico-Regular.ttf de Google Fonts
    // y colócala en assets/fonts/
    Pacifico: require("../../assets/fonts/Pacifico-Regular.ttf"),
  });

  // Log para debug
  React.useEffect(() => {
    console.log("[Splash] Fonts loaded:", fontsLoaded);
    if (fontError) {
      console.error("[Splash] Font error:", fontError);
    }
  }, [fontsLoaded, fontError]);

  /**
   * Inicializa la app en paralelo
   */
  const initializeApp = React.useCallback(async () => {
    try {
      const [session, connection, surveys] = await Promise.all([
        checkSession(),
        checkConnection(),
        loadSurveys(),
      ]);

      // Actualizar estado offline si es necesario
      if (!connection.isOnline) {
        setIsOffline(true);
      }

      console.log("[Splash] App initialized:", {
        session,
        connection,
        surveys,
      });
    } catch (error) {
      console.error("[Splash] Error initializing app:", error);
    }
  }, []);

  useEffect(() => {
    // Inicializar app en paralelo
    initializeApp();

    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Cambiar mensajes cada 500ms
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, MESSAGE_DURATION);

    // Terminar después de 2.5s
    const timer = setTimeout(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Callback con estado de la app
        onLoadComplete({
          hasSession: true, // TODO: implementar verificación real
          isOnline: !isOffline,
          surveysLoaded: true, // TODO: implementar verificación real
        });
      });
    }, SPLASH_DURATION);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, [fadeAnim, scaleAnim, initializeApp, onLoadComplete, isOffline]);

  /**
   * Verifica si hay sesión válida
   * TODO: Implementar verificación real con JWT
   */
  async function checkSession(): Promise<{ isValid: boolean }> {
    await delay(200);
    return { isValid: true };
  }

  /**
   * Verifica estado de conexión
   * TODO: Implementar con NetInfo
   */
  async function checkConnection(): Promise<{ isOnline: boolean }> {
    await delay(200);
    return { isOnline: true };
  }

  /**
   * Carga encuestas iniciales
   * TODO: Implementar con SQLite + API
   */
  async function loadSurveys(): Promise<{ count: number }> {
    await delay(2000);
    return { count: 0 };
  }

  // Esperar a que las fuentes carguen o usar fuente del sistema
  const [useSystemFont, setUseSystemFont] = React.useState(false);

  React.useEffect(() => {
    if (!fontsLoaded) {
      // Fallback a fuente del sistema después de 1 segundo
      const timer = setTimeout(() => {
        console.log("[Splash] Font timeout, using system font");
        setUseSystemFont(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Si la fuente no carga y no ha pasado el timeout, mostrar nada aún
  if (!fontsLoaded && !useSystemFont) {
    return null;
  }

  // Mensaje actual
  const currentMessage = isOffline
    ? "📶 Modo offline"
    : LOADING_MESSAGES[currentMessageIndex];

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={GRADIENT_START}
      end={GRADIENT_END}
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
        <Text style={[styles.logo, useSystemFont && styles.logoSystem]}>
          brigadaDigital
        </Text>

        {/* Spinner (3 dots pulsantes) */}
        <View style={styles.spinnerContainer}>
          <DotSpinner />
        </View>

        {/* Mensaje dinámico */}
        <Text style={styles.message}>{currentMessage}</Text>
      </Animated.View>

      {/* Versión (esquina inferior) */}
      <Text style={styles.version}>v1.0.0</Text>

      {/* Wave decorativa (opcional) */}
      <WaveDecoration />
    </LinearGradient>
  );
}

// ============================================================================
// DOT SPINNER COMPONENT
// ============================================================================

function DotSpinner() {
  const dot1 = React.useRef(new Animated.Value(0.3)).current;
  const dot2 = React.useRef(new Animated.Value(0.3)).current;
  const dot3 = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 400);
    animateDot(dot3, 800);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
}

// ============================================================================
// WAVE DECORATION COMPONENT
// ============================================================================

function WaveDecoration() {
  return (
    <View style={styles.waveContainer}>
      <View style={styles.wave} />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 48,
    color: "#FFFFFF",
    marginBottom: 60,
    // Sombra para mejor legibilidad
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    // Ajuste para Android
    ...(Platform.OS === "android" && {
      includeFontPadding: false,
    }),
  },
  logoSystem: {
    fontFamily: Platform.select({
      ios: "Avenir-Heavy",
      android: "sans-serif-medium",
      default: "System",
    }),
    fontWeight: "700",
    fontStyle: "italic",
  },
  spinnerContainer: {
    marginBottom: 24,
    height: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  message: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
    fontWeight: "400",
  },
  version: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
});

// ============================================================================
// UTILITIES
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
