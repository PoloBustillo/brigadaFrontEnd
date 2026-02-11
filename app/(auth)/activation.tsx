/**
 * Activation Screen - Brigada Digital
 * Código de 6 dígitos para activar cuenta
 * Regla 5: Validación contra whitelist
 */

import { useAuth } from "@/contexts/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { toastManager } from "@/components/ui/toast-enhanced";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";

// Decorative elements similar to welcome screen
const DECORATIVE_ELEMENTS = [
  {
    id: 1,
    icon: "key-outline",
    top: 60,
    left: 20,
    size: 52,
    opacity: 0.3,
    rotate: -12,
  },
  {
    id: 2,
    icon: "shield-checkmark-outline",
    top: 70,
    right: 25,
    size: 56,
    opacity: 0.32,
    rotate: 15,
  },
  {
    id: 3,
    icon: "lock-closed-outline",
    top: 600,
    left: 25,
    size: 54,
    opacity: 0.29,
    rotate: 8,
  },
  {
    id: 4,
    icon: "checkmark-circle-outline",
    top: 620,
    right: 20,
    size: 52,
    opacity: 0.28,
    rotate: -10,
  },
];

// Decorative Background Element
interface DecorativeElementProps {
  icon: string;
  top: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
  rotate: number;
  delay: number;
}

function DecorativeElement({
  icon,
  top,
  left,
  right,
  size,
  opacity,
  rotate,
  delay,
}: DecorativeElementProps) {
  const elementOpacity = useSharedValue(0);
  const elementRotate = useSharedValue(rotate);
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      elementOpacity.value = withTiming(opacity, { duration: 1200 });
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    }, delay);

    setTimeout(() => {
      elementRotate.value = withRepeat(
        withSequence(
          withTiming(rotate + 8, { duration: 3500 }),
          withTiming(rotate - 8, { duration: 3500 }),
        ),
        -1,
        true,
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 3000 }),
          withTiming(0, { duration: 3000 }),
        ),
        -1,
        true,
      );
    }, delay + 800);
  }, [
    delay,
    elementOpacity,
    scale,
    elementRotate,
    translateY,
    opacity,
    rotate,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: elementOpacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${elementRotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const positionStyle = {
    top,
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
  };

  return (
    <Animated.View
      style={[styles.decorativeElement, positionStyle, animatedStyle]}
    >
      <Ionicons
        name={icon as any}
        size={size}
        color="rgba(255, 255, 255, 0.65)"
      />
    </Animated.View>
  );
}

// Code Input Component - 6 digits
function CodeInput({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (text: string) => void;
  error: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.split("");
  const errorShake = useSharedValue(0);

  // CRÍTICO: Re-focus cuando la pantalla recibe foco (navegación hacia atrás)
  useFocusEffect(
    useCallback(() => {
      // Focus inmediato
      inputRef.current?.focus();

      // Focus con InteractionManager (después de animaciones)
      const interactionHandle = InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });

      // Focus adicionales para asegurar
      const timer1 = setTimeout(() => inputRef.current?.focus(), 50);
      const timer2 = setTimeout(() => inputRef.current?.focus(), 150);
      const timer3 = setTimeout(() => inputRef.current?.focus(), 300);
      const timer4 = setTimeout(() => inputRef.current?.focus(), 500);

      return () => {
        interactionHandle.cancel();
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }, []),
  );

  // Re-focus cuando la app vuelve a primer plano
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 200);
        }
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (error) {
      errorShake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, errorShake]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  return (
    <View style={styles.codeInputContainer}>
      <Animated.View style={[styles.digitsRow, shakeStyle]}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.digitBox,
              digits[index] && styles.digitBoxFilled,
              error && styles.digitBoxError,
            ]}
            onPress={() => {
              // Forzar focus y reabrir teclado
              setTimeout(() => {
                inputRef.current?.focus();
              }, 50);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.digitText, error && styles.digitTextError]}>
              {digits[index] || ""}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Hidden input for capturing keyboard input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          // Only allow numbers, max 6 digits
          const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
          onChangeText(cleaned);
        }}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus={true}
        showSoftInputOnFocus={true}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        // Props adicionales para mantener el input enfocable
        editable={true}
        selectTextOnFocus={false}
        caretHidden={true}
        blurOnSubmit={true}
        returnKeyType="done"
      />
    </View>
  );
}

export default function ActivationScreen() {
  const router = useRouter();
  const { pendingEmail, setPendingEmail } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);

  // Reset error state when user starts typing again
  useEffect(() => {
    if (code.length > 0 && error) {
      setError(false);
    }
  }, [code, error]);

  useEffect(() => {
    // Content entrance animation
    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 700 });
      contentTranslateY.value = withSpring(0, { damping: 15 });
    }, 300);
  }, [contentOpacity, contentTranslateY]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleActivate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleActivate = async () => {
    setLoading(true);
    setError(false);

    try {
      // TODO: Implement whitelist validation (Rule 5)
      // 1. Query whitelist table for invitation_code = code
      // 2. Check if code exists and is valid
      // 3. Verify not already used
      // 4. Create or update user with role from invitation
      // 5. Generate offline token (7 days)
      // 6. Navigate to appropriate dashboard based on role

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock validation - replace with actual DB query
      const isValid = code === "123456"; // TODO: Check against whitelist

      if (isValid) {
        // Navigate to create password screen
        toastManager.success(
          "Código válido. Tu cuenta ha sido activada correctamente",
        );
        setTimeout(() => {
          router.replace("/(auth)/create-password" as any);
        }, 1500);
      } else {
        setError(true);
        setCode("");
        toastManager.error(
          "El código ingresado no es válido. Verifica e intenta nuevamente",
        );
      }
    } catch {
      setError(true);
      setCode("");
      toastManager.error(
        "Ocurrió un error al validar el código. Intenta nuevamente",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // No cerrar el teclado, solo navegar
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF1B8D", "#FF4B7D", "#FF6B9D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative Background Elements */}
        {DECORATIVE_ELEMENTS.map((element, index) => (
          <DecorativeElement
            key={element.id}
            icon={element.icon}
            top={element.top}
            left={element.left}
            right={element.right}
            size={element.size}
            opacity={element.opacity}
            rotate={element.rotate}
            delay={200 + index * 100}
          />
        ))}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="rgba(255, 255, 255, 0.95)"
          />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Animated.View
            style={[styles.contentContainer, contentAnimatedStyle]}
          >
            {/* Icon Badge */}
            <View style={styles.iconBadge}>
              <Ionicons name="key" size={48} color="#FF1B8D" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Activa tu cuenta</Text>
            {pendingEmail && (
              <View style={styles.emailContainer}>
                <Text style={styles.emailDisplay}>{pendingEmail}</Text>
                <TouchableOpacity
                  style={styles.changeEmailButton}
                  onPress={async () => {
                    await setPendingEmail(null);
                    router.back();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="pencil"
                    size={12}
                    color="rgba(255, 255, 255, 0.85)"
                  />
                  <Text style={styles.changeEmailText}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.subtitle}>
              Ingresa tu código de invitación de 6 dígitos
            </Text>

            {/* Code Input */}
            <CodeInput value={code} onChangeText={setCode} error={error} />

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Validando código...</Text>
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.helpText}>
                El código fue enviado por el administrador para crear tu cuenta
              </Text>
            </View>

            {/* Resend Button */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                // TODO: Implement resend logic
                toastManager.info(
                  "Si no recibiste el código, contacta al administrador",
                );
              }}
            >
              <Text style={styles.resendButtonText}>
                ¿No recibiste el código?
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeElement: {
    position: "absolute",
    zIndex: 1,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    zIndex: 10,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  title: {
    ...typography.h1,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emailDisplay: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  changeEmailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  changeEmailText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  subtitle: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  subtitleSmall: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
  },

  // Code Input
  codeInputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  digitsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  digitBox: {
    width: 48,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  digitBoxFilled: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  digitBoxError: {
    backgroundColor: "rgba(255, 100, 100, 0.3)",
    borderColor: "rgba(255, 50, 50, 0.8)",
  },
  digitText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: "700",
  },
  digitTextError: {
    color: "#CC0000",
  },
  hiddenInput: {
    position: "absolute",
    top: 0, // En la parte superior pero invisible
    left: 0,
    width: "100%",
    height: 60, // Misma altura que los boxes
    opacity: 0, // Completamente transparente
    color: "transparent", // Texto transparente
    backgroundColor: "transparent", // Fondo transparente
  },

  // Loading
  loadingContainer: {
    marginVertical: 16,
  },
  loadingText: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },

  // Help
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  helpText: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
    lineHeight: 18,
  },

  // Resend
  resendButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resendButtonText: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
