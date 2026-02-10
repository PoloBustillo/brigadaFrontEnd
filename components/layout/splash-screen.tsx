/**
 * Splash Screen Component - Enhanced Pro Version
 *
 * Pantalla inicial con branding profesional y verificación de estado.
 * Features:
 * - NetInfo para detección real de conectividad
 * - Fuentes premium (Poppins)
 * - Iconos animados profesionales
 * - Animaciones fluidas
 * - Feedback visual en tiempo real
 *
 * Duración: 2.5-3 segundos
 *
 * @see docs/SCREEN_FLOW_UX.md - Sección "Splash + Loading"
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
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
  | "rocket" // 🚀 Iniciando...
  | "shield" // 🔐 Verificando sesión...
  | "wifi" // 📡 Comprobando conexión...
  | "database" // 📊 Cargando encuestas...
  | "offline" // 📶 Modo offline
  | "check" // ✅ Listo!
  | "sync"; // 🔄 Sincronizando...

// ============================================================================
// CONSTANTS
// ============================================================================

const LOADING_STEPS: {
  icon: LoadingMessage;
  text: string;
  color: string;
}[] = [
  { icon: "rocket", text: "Iniciando aplicación", color: "#FFFFFF" }, // Blanco - máximo contraste
  { icon: "shield", text: "Verificando sesión", color: "#FFFFFF" }, // Blanco - consistente
  { icon: "wifi", text: "Conectando a internet", color: "#FFFFFF" }, // Blanco - claro
  { icon: "database", text: "Cargando encuestas", color: "#FFFFFF" }, // Blanco - visible
  { icon: "check", text: "¡Todo listo!", color: "#00FF88" }, // Verde brillante con buen contraste
];

const MESSAGE_DURATION = 500; // ms entre mensajes
const SPLASH_DURATION = 2500; // ms total
const FADE_DURATION = 400; // ms para fade in/out

// Gradiente principal mejorado
const GRADIENT_COLORS = ["#FF1B8D", "#FF4B7D", "#FF6B9D"] as const;
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SplashScreen({ onLoadComplete }: SplashScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("wifi");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  // Removido iconRotate - animación de rotación era mareante y sin sentido

  // Cargar fuentes personalizadas profesionales
  const [fontsLoaded, fontError] = useFonts({
    // Pacifico: fuente script elegante para el logo
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
   * Inicializa la app en paralelo con NetInfo real
   */
  const initializeApp = React.useCallback(async () => {
    try {
      // Detectar estado de red REAL con NetInfo
      const netState = await NetInfo.fetch();
      setIsOnline(netState.isConnected ?? false);
      setConnectionType(netState.type);

      console.log("[Splash] Network state:", {
        isConnected: netState.isConnected,
        type: netState.type,
        isInternetReachable: netState.isInternetReachable,
      });

      const [session, surveys] = await Promise.all([
        checkSession(),
        loadSurveys(),
      ]);

      console.log("[Splash] App initialized:", {
        session,
        surveys,
        network: netState.type,
      });
    } catch (error) {
      console.error("[Splash] Error initializing app:", error);
    }
  }, []);

  useEffect(() => {
    // Inicializar app en paralelo
    initializeApp();

    // Animación de entrada elegante
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso continua
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Cambiar mensajes cada 500ms
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, MESSAGE_DURATION);

    // Terminar después de 2.5s
    const timer = setTimeout(() => {
      // Fade out suave
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Callback con estado REAL de la app
        onLoadComplete({
          hasSession: true, // TODO: implementar verificación real con JWT
          isOnline: isOnline,
          surveysLoaded: true, // TODO: implementar verificación real con SQLite
        });
      });
    }, SPLASH_DURATION);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, [fadeAnim, scaleAnim, pulseAnim, initializeApp, onLoadComplete, isOnline]);

  /**
   * Verifica si hay sesión válida
   * TODO: Implementar verificación real con JWT
   */
  async function checkSession(): Promise<{ isValid: boolean }> {
    await delay(200);
    return { isValid: true };
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

  // Paso actual
  const currentStep = LOADING_STEPS[currentMessageIndex];

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
        {/* Logo/Wordmark con animación */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text
            style={[styles.logo, useSystemFont && styles.logoSystem]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
          >
            brigada Digital
          </Text>
        </Animated.View>

        {/* Ícono animado profesional - SIN rotación molesta */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              // Solo pulso sutil, sin rotación mareante
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <StatusIcon icon={currentStep.icon} color={currentStep.color} />
        </Animated.View>

        {/* Spinner (3 dots mejorado) */}
        <View style={styles.spinnerContainer}>
          <ImprovedDotSpinner color={currentStep.color} />
        </View>

        {/* Mensaje dinámico con fuente pro */}
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: currentStep.color }]}>
            {currentStep.text}
          </Text>

          {/* Badge de conexión */}
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={14} color="#FFF" />
              <Text style={styles.offlineText}>Sin conexión</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${
                  ((currentMessageIndex + 1) / LOADING_STEPS.length) * 100
                }%`,
                backgroundColor: currentStep.color,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Versión y tipo de conexión */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
        {isOnline && (
          <View style={styles.connectionBadge}>
            <Ionicons
              name={
                connectionType === "wifi"
                  ? "wifi"
                  : connectionType === "cellular"
                    ? "phone-portrait"
                    : "cloud"
              }
              size={12}
              color="rgba(255, 255, 255, 0.6)"
            />
            <Text style={styles.connectionText}>
              {connectionType === "wifi"
                ? "WiFi"
                : connectionType === "cellular"
                  ? "Datos móviles"
                  : "Online"}
            </Text>
          </View>
        )}
      </View>

      {/* Wave decorativa mejorada */}
      <WaveDecoration />
    </LinearGradient>
  );
}

// ============================================================================
// STATUS ICON COMPONENT
// ============================================================================

interface StatusIconProps {
  icon: LoadingMessage;
  color: string;
}

function StatusIcon({ icon, color }: StatusIconProps) {
  // Íconos más grandes y con mejor contraste
  const iconMap: Record<LoadingMessage, React.ReactNode> = {
    rocket: <Ionicons name="rocket" size={52} color={color} />,
    shield: (
      <MaterialCommunityIcons name="shield-check" size={52} color={color} />
    ),
    wifi: <Ionicons name="wifi" size={52} color={color} />,
    database: <Ionicons name="server" size={52} color={color} />,
    offline: <Ionicons name="cloud-offline" size={52} color={color} />,
    check: <Ionicons name="checkmark-circle" size={52} color={color} />,
    sync: <Ionicons name="sync" size={52} color={color} />,
  };

  return (
    <View
      style={{
        // Sombra para los íconos para mejor contraste
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {iconMap[icon]}
    </View>
  );
}

// ============================================================================
// IMPROVED DOT SPINNER COMPONENT
// ============================================================================

interface ImprovedDotSpinnerProps {
  color: string;
}

function ImprovedDotSpinner({ color }: ImprovedDotSpinnerProps) {
  const dot1 = React.useRef(new Animated.Value(0.3)).current;
  const dot2 = React.useRef(new Animated.Value(0.3)).current;
  const dot3 = React.useRef(new Animated.Value(0.3)).current;
  const scale1 = React.useRef(new Animated.Value(1)).current;
  const scale2 = React.useRef(new Animated.Value(1)).current;
  const scale3 = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateDot = (
      opacity: Animated.Value,
      scale: Animated.Value,
      delay: number,
    ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1.3,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    };

    animateDot(dot1, scale1, 0);
    animateDot(dot2, scale2, 200);
    animateDot(dot3, scale3, 400);
  }, [dot1, dot2, dot3, scale1, scale2, scale3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot1,
            transform: [{ scale: scale1 }],
            backgroundColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot2,
            transform: [{ scale: scale2 }],
            backgroundColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot3,
            transform: [{ scale: scale3 }],
            backgroundColor: color,
          },
        ]}
      />
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
  logoContainer: {
    marginBottom: 40,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 42,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    width: "100%",
    textAlign: "center",
    // Sombra profesional
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
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
  iconContainer: {
    marginBottom: 32,
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    // Fondo oscuro semi-transparente para mejorar contraste con íconos blancos
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 45,
    // Borde blanco sutil para definir mejor el contenedor
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  spinnerContainer: {
    marginBottom: 24,
    height: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  messageContainer: {
    alignItems: "center",
    minHeight: 50,
  },
  message: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    // Sombra para mejor legibilidad
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 87, 34, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  offlineText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginTop: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
    gap: 8,
  },
  version: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
  },
});

// ============================================================================
// UTILITIES
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
