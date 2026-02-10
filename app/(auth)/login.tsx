/**
 * Login Screen - Brigada Digital
 * Authentication screen with email/password inputs
 * Follows UX guidelines: large inputs, single CTA, immediate feedback
 */

import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function LoginScreen() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  // Validation
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const shake = () => {
    shakeAnim.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
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

  const handleLogin = async () => {
    // Validate
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

    setLoading(true);

    try {
      // TODO: Implement real authentication
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      // Store session token here
      // await AsyncStorage.setItem('userToken', token);

      // Navigate to home/profile
      router.replace("/profile" as any);
    } catch {
      setErrorMessage("Usuario o contraseña incorrectos");
      setShowError(true);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    console.log("Forgot password");
  };

  const isFormValid =
    email.length > 0 && password.length >= 6 && !emailError && !passwordError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <LinearGradient
        colors={["#F5F7FA", "#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand */}
          <View style={styles.header}>
            <Text style={styles.logo}>brigadaDigital</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Inicia sesión para</Text>
            <Text style={styles.subtitle}>acceder a tu cuenta</Text>
          </View>

          {/* Error Alert */}
          {showError && (
            <View style={styles.alertContainer}>
              <Alert
                variant="error"
                title="Error de autenticación"
                message={errorMessage}
              />
            </View>
          )}

          {/* Form */}
          <Animated.View style={[styles.form, shakeAnimatedStyle]}>
            {/* Email Input */}
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              required
            />

            {/* Password Input */}
            <Input
              label="Contraseña"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              error={passwordError}
              helperText={!passwordError ? "Mínimo 6 caracteres" : undefined}
              required
            />

            {/* Login Button */}
            <View style={styles.buttonContainer}>
              <Button
                title="INICIAR SESIÓN"
                onPress={handleLogin}
                variant="primary"
                size="large"
                loading={loading}
                disabled={!isFormValid || loading}
                fullWidth
              />
            </View>

            {/* Forgot Password Link */}
            <Button
              title="¿Olvidaste tu contraseña?"
              onPress={handleForgotPassword}
              variant="outline"
              size="medium"
              fullWidth={false}
              style={styles.linkButton}
            />
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>v1.0.0 • 📶 WiFi</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 52,
    color: "#FF1B8D",
    textShadowColor: "rgba(255, 27, 141, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6C7A89",
    textAlign: "center",
    lineHeight: 24,
  },
  alertContainer: {
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  linkButton: {
    alignSelf: "center",
    paddingVertical: 12,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6C7A89",
  },
});
