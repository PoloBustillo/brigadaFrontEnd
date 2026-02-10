/**
 * Login Screen - Brigada Digital (Enhanced)
 * Authentication with whitelist validation and state verification
 * Rules 5: Whitelist required, 22: Offline token, 1-4: User states
 */

import { ConnectionStatus } from "@/components/shared/connection-status";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole, UserState } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    role: UserRole;
    state: UserState;
  };
  error?: {
    code: string;
    message: string;
  };
}

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

  const checkWhitelist = async (email: string): Promise<boolean> => {
    // TODO: Query whitelist table
    // const whitelisted = await db
    //   .select()
    //   .from(whitelist)
    //   .where(eq(whitelist.email, email))
    //   .limit(1);
    //
    // return whitelisted.length > 0;

    // Mock: Allow any email for now
    console.log("Checking whitelist for:", email);
    return true;
  };

  const authenticateUser = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    // TODO: Implement real authentication with database
    // 1. Query user by email
    // 2. Verify password hash
    // 3. Return user data

    // Mock authentication
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate different scenarios for testing
    const mockUser = {
      id: 1,
      email: email,
      role: "BRIGADISTA" as UserRole,
      state: "ACTIVE" as UserState,
    };

    return {
      success: true,
      user: mockUser,
    };
  };

  const generateOfflineToken = async (userId: number): Promise<string> => {
    // TODO: Generate and store offline token (7 days expiry)
    // const token = crypto.randomUUID();
    // const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    //
    // await db.insert(offlineTokens).values({
    //   user_id: userId,
    //   token: token,
    //   expires_at: expiresAt,
    //   created_at: Date.now(),
    // });
    //
    // return token;

    console.log("Generating offline token for user:", userId);
    return "mock-token-" + userId;
  };

  const navigateByRole = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        router.replace("/(admin)/" as any);
        break;
      case "ENCARGADO":
        router.replace("/(encargado)/" as any);
        break;
      case "BRIGADISTA":
        router.replace("/(brigadista)/" as any);
        break;
      default:
        router.replace("/(brigadista)/" as any);
    }
  };

  const handleUserState = (state: UserState, email: string) => {
    switch (state) {
      case "INVITED":
        // User hasn't activated yet, redirect to activation
        setErrorMessage(
          "Tu cuenta aún no ha sido activada. Usa el código de activación.",
        );
        setShowError(true);
        setTimeout(() => {
          router.push("/(auth)/activation" as any);
        }, 2000);
        break;

      case "PENDING":
        // Account created but profile incomplete
        setErrorMessage("Completa tu perfil para continuar.");
        setShowError(true);
        // TODO: Navigate to complete profile screen
        // setTimeout(() => {
        //   router.push("/(auth)/complete-profile" as any);
        // }, 2000);
        break;

      case "DISABLED":
        // Account disabled by admin
        throw new Error(
          "Tu cuenta ha sido desactivada. Contacta al administrador.",
        );

      case "ACTIVE":
        // Normal flow, continue
        break;

      default:
        throw new Error("Estado de cuenta desconocido.");
    }
  };

  const handleLogin = async () => {
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

    setLoading(true);

    try {
      // 2. Check whitelist (Rule 5)
      const isWhitelisted = await checkWhitelist(email);
      if (!isWhitelisted) {
        throw new Error(
          "Email no autorizado. Debes estar en la whitelist para acceder.",
        );
      }

      // 3. Authenticate user
      const authResult = await authenticateUser(email, password);

      if (!authResult.success || !authResult.user) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const user = authResult.user;

      // 4. Check user state (Rules 1-4)
      handleUserState(user.state, user.email);

      // If state is not ACTIVE, handleUserState will redirect
      if (user.state !== "ACTIVE") {
        return;
      }

      // 5. Generate offline token (Rule 22)
      const token = await generateOfflineToken(user.id);
      console.log("Login successful, token:", token);

      // TODO: Store session
      // await AsyncStorage.setItem('userToken', token);
      // await AsyncStorage.setItem('userId', user.id.toString());
      // await AsyncStorage.setItem('userRole', user.role);

      // 6. Navigate based on role
      navigateByRole(user.role);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al iniciar sesión";
      setErrorMessage(message);
      setShowError(true);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>

        {/* Connection Status */}
        <View style={styles.connectionStatusContainer}>
          <ConnectionStatus variant="compact" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand */}
          <View style={styles.header}>
            <Text
              style={styles.logo}
              numberOfLines={1}
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
            >
              brigadaDigital{" "}
            </Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>Accede con tu cuenta autorizada</Text>
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

          {/* Info Box - Whitelist */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#0066CC"
            />
            <Text style={styles.infoText}>
              Solo usuarios autorizados en la whitelist pueden acceder
            </Text>
          </View>

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
            <Text style={styles.footerText}>
              ¿Primera vez? Usa tu código de activación
            </Text>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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
    right: 20,
    zIndex: 100,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 50, // Aumentado aún más
  },
  logo: {
    fontFamily: "Pacifico",
    fontSize: 46, // Reducido un poco más
    color: "#FF1B8D",
    letterSpacing: -0.5, // LetterSpacing NEGATIVO para comprimir
    textShadowColor: "rgba(255, 27, 141, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  titleContainer: {
    marginBottom: 24,
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#0066CC",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0066CC",
    lineHeight: 18,
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
    fontSize: 13,
    color: "#6C7A89",
    textAlign: "center",
  },
});
