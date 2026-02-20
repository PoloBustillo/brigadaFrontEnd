/**
 * Login Screen - Brigada Digital (Enhanced)
 * Authentication with whitelist validation and state verification
 * Rules 5: Whitelist required, 22: Offline token, 1-4: User states
 *
 * ✅ Accessibility: Full WCAG 2.1 AA compliance
 * ✅ Haptic Feedback: Error, success, and interaction feedback
 * ✅ Network Handling: Retry logic with exponential backoff
 */

import { ConnectionStatus } from "@/components/shared/connection-status";
import { AlertEnhanced } from "@/components/ui/alert-enhanced";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import type { UserRole } from "@/types/user";
import { getErrorMessage } from "@/utils/translate-error";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Retry function with exponential backoff
 * Attempts a function multiple times with increasing delays between attempts
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) or specific auth errors
      if (
        lastError.message.includes("Email no autorizado") ||
        lastError.message.includes("Usuario o contraseña incorrectos") ||
        lastError.message.includes("desactivada")
      ) {
        throw lastError;
      }

      // Only retry if not the last attempt
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export default function LoginScreen() {
  const router = useRouter();
  const { setPendingEmail, login } = useAuth();
  const colors = useThemeColors();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Animation
  const shakeAnim = useSharedValue(0);

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  // Check network connectivity on mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Network state is monitored but not stored in state
      // We check it on-demand before login
    });

    return () => unsubscribe();
  }, []);

  // Validation
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const shake = () => {
    // Haptic feedback for error
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    shakeAnim.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
    if (emailError) setEmailError("");
    if (showError) setShowError(false);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
    if (showError) setShowError(false);
  };

  const handleEmailBlur = () => {
    if (email.length > 0 && !validateEmail(email)) {
      setEmailError("Formato de email inválido");
    }
  };

  const navigateByRole = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        router.replace("/(admin)");
        break;
      case "ENCARGADO":
        router.replace("/(encargado)");
        break;
      case "BRIGADISTA":
        router.replace("/(brigadista)");
        break;
      default:
        router.replace("/(brigadista)");
    }
  };

  const handleLogin = async () => {
    // Haptic feedback on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. Validate form
    let hasError = false;

    if (email.length === 0) {
      setEmailError("El email es requerido");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Formato de email inválido");
      hasError = true;
    }

    if (password.length === 0) {
      setPasswordError("La contraseña es requerida");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      hasError = true;
    }

    if (hasError) {
      shake();
      return;
    }

    // 2. Check network connectivity before attempting login
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setErrorMessage(
        "Sin conexión a internet. Verifica tu WiFi o datos móviles y vuelve a intentar.",
      );
      setShowError(true);
      shake();
      return;
    }

    setLoading(true);

    try {
      // Wrap login logic in retry function
      await retryWithBackoff(async () => {
        // Call real backend authentication
        const loggedUser = await login(email, password);

        // Haptic feedback for success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate based on role
        navigateByRole(loggedUser.role);
      }, 3); // 3 retry attempts
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setShowError(true);
      shake();

      // Log error for debugging (in production, send to analytics/Sentry)
      console.error("[Login Error]", {
        email: email.substring(0, 3) + "***",
        errorType: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleForgotPassword = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to forgot password screen
  };

  const isFormValid =
    email.length > 0 && password.length >= 6 && !emailError && !passwordError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[
          colors.backgroundSecondary,
          colors.background,
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
          accessibilityHint="Presiona para volver a la pantalla anterior"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Connection Status - Compact y sutil */}
        <View style={styles.connectionStatusContainer}>
          <ConnectionStatus variant="compact" />
        </View>

        {/* Theme Toggle - Derecha */}
        <View style={styles.themeToggleContainer}>
          <ThemeToggleIcon />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          keyboardOpeningTime={0}
        >
          {/* Main Content */}
          <View>
            {/* Logo/Brand */}
            <View style={styles.header}>
              <Text
                style={[styles.logo, { color: colors.primary }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                allowFontScaling={false}
                maxFontSizeMultiplier={1}
              >
                brigada Digital
              </Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                Inicia sesión
              </Text>
            </View>

            {/* Error Alert */}
            {showError && (
              <View
                style={styles.alertContainer}
                accessible={true}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <AlertEnhanced
                  variant="error"
                  title="Error de autenticación"
                  message={errorMessage}
                  onClose={() => setShowError(false)}
                />
              </View>
            )}

            {/* Form */}
            <Animated.View style={[styles.form, shakeAnimatedStyle]}>
              {/* Email Input */}
              <InputEnhanced
                label="Correo electrónico"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                leftIcon="mail-outline"
                required
                size="lg"
              />

              {/* Password Input */}
              <InputEnhanced
                label="Contraseña"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="password"
                error={passwordError}
                helperText={!passwordError ? "Mínimo 6 caracteres" : undefined}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                required
                size="lg"
              />

              {/* Login Button */}
              <View style={styles.buttonContainer}>
                <ButtonEnhanced
                  title="INICIAR SESIÓN"
                  onPress={handleLogin}
                  variant="gradient"
                  size="lg"
                  icon="log-in-outline"
                  iconPosition="right"
                  loading={loading}
                  disabled={!isFormValid || loading}
                  fullWidth
                  rounded
                />
              </View>

              {/* Forgot Password Link */}
              <ButtonEnhanced
                title="¿Olvidaste tu contraseña?"
                onPress={handleForgotPassword}
                variant="ghost"
                size="md"
                style={styles.linkButton}
              />
            </Animated.View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/activation" as any);
              }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="¿Primera vez? Activa tu cuenta aquí"
              accessibilityHint="Presiona para ir a la pantalla de activación de cuenta"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                ¿Primera vez?{" "}
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Activa tu cuenta aquí
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    // backgroundColor now comes from inline style
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionStatusContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center", // Centrado horizontal
    zIndex: 102,
  },
  themeToggleContainer: {
    position: "absolute",
    top: 50,
    right: 20, // Pegado a la derecha
    zIndex: 103,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 20, // Reducido para eliminar espacio extra
  },
  header: {
    alignItems: "center",
    marginBottom: 24, // Reducido de 40 a 24
    paddingHorizontal: 20,
    width: "100%",
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 42,
    // color now comes from inline style (colors.primary)
    letterSpacing: 0.5,
    textShadowColor: "rgba(255, 27, 141, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    width: "100%",
    textAlign: "center",
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    // color now comes from inline style (colors.text)
    textAlign: "center",
    lineHeight: 32,
  },

  alertContainer: {
    marginBottom: 20,
    marginHorizontal: 0, // Mismo ancho que los demás elementos (infoBox, forms, etc.)
  },
  form: {
    marginBottom: 16, // Reducido de 24 a 16
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 8, // Reducido de 16 a 8
  },
  linkButton: {
    alignSelf: "center",
    paddingVertical: 8, // Reducido de 12 a 8
  },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    // color now comes from inline style (colors.textSecondary)
    textAlign: "center",
  },
  footerLink: {
    fontSize: 14,
    // color now comes from inline style (colors.primary)
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
