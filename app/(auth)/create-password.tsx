/**
 * Create Password Screen - Brigada Digital
 * Usuario define su contraseña después de activar el código
 * Reglas 1-4: Usuario pasa de PENDING a ACTIVE
 * Regla 22: Genera token offline de 7 días
 */

import { useAuth } from "@/contexts/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

// Decorative elements
const DECORATIVE_ELEMENTS = [
  {
    id: 1,
    icon: "lock-closed-outline",
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
    icon: "key-outline",
    top: 620,
    left: 25,
    size: 54,
    opacity: 0.29,
    rotate: 8,
  },
  {
    id: 4,
    icon: "checkmark-circle-outline",
    top: 640,
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

// Password strength checker
interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=muy débil, 4=muy fuerte
  feedback: string[];
  color: string;
  label: string;
}

function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length === 0) {
    return {
      score: 0,
      feedback: [],
      color: "#999",
      label: "",
    };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("Mínimo 8 caracteres");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Una letra mayúscula");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Una letra minúscula");
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("Un número");
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  }

  const strengthMap = {
    0: { color: "#CC0000", label: "Muy débil" }, // Rojo más oscuro para mejor contraste
    1: { color: "#FF6B6B", label: "Débil" },
    2: { color: "#FFA726", label: "Regular" },
    3: { color: "#66BB6A", label: "Buena" },
    4: { color: "#00FF88", label: "Excelente" },
  };

  const { color, label } = strengthMap[Math.min(score, 4) as 0 | 1 | 2 | 3 | 4];

  return {
    score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4,
    feedback,
    color,
    label,
  };
}

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { pendingEmail, setPendingEmail } = useAuth();
  const [email, setEmail] = useState(pendingEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: "#999",
    label: "",
  });

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);

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

  // Update password strength on change
  useEffect(() => {
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  }, [password]);

  const handleCreatePassword = async () => {
    // Validations
    if (!email.trim()) {
      toastManager.error("Por favor ingresa tu correo electrónico");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastManager.error("Formato de correo inválido");
      return;
    }

    if (password.length < 8) {
      toastManager.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Validar todos los requisitos de contraseña
    if (!/[A-Z]/.test(password)) {
      toastManager.error(
        "La contraseña debe contener al menos una letra mayúscula",
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      toastManager.error(
        "La contraseña debe contener al menos una letra minúscula",
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      toastManager.error("La contraseña debe contener al menos un número");
      return;
    }

    if (passwordStrength.score < 2) {
      toastManager.warning(
        "Incluye mayúsculas, minúsculas y números para mayor seguridad",
      );
      return;
    }

    if (password !== confirmPassword) {
      toastManager.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement password creation
      // 1. Hash password with bcrypt
      // 2. Update user in DB: password_hash, state = ACTIVE
      // 3. Generate offline token (7 days)
      // 4. Save token in AsyncStorage
      // 5. Navigate to dashboard based on role

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success
      toastManager.success("Tu contraseña ha sido configurada exitosamente");

      // Limpiar email pendiente
      setPendingEmail(null);

      setTimeout(() => {
        // TODO: Navigate based on role from whitelist
        // router.replace("/(admin)/" as any);
        // router.replace("/(encargado)/" as any);
        // router.replace("/(brigadista)/" as any);
        router.replace("/(auth)/login-enhanced" as any);
      }, 1500);
    } catch {
      toastManager.error(
        "Ocurrió un error al crear tu contraseña. Intenta nuevamente",
      );
    } finally {
      setLoading(false);
    }
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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="rgba(255, 255, 255, 0.95)"
          />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[styles.contentContainer, contentAnimatedStyle]}
            >
              {/* Icon Badge */}
              <View style={styles.iconBadge}>
                <Ionicons name="lock-closed" size={48} color="#FF1B8D" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Crea tu contraseña</Text>
              <Text style={styles.subtitle}>
                Define una contraseña segura para proteger tu cuenta
              </Text>

              {/* Email Input - BLOQUEADO si viene de activación */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    pendingEmail && styles.inputWrapperDisabled,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      pendingEmail
                        ? "rgba(255, 255, 255, 0.4)"
                        : "rgba(255, 255, 255, 0.7)"
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, pendingEmail && styles.inputDisabled]}
                    placeholder="tu@email.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!pendingEmail}
                  />
                  {pendingEmail && (
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="rgba(255, 255, 255, 0.5)"
                      style={styles.lockIcon}
                    />
                  )}
                </View>
                {pendingEmail && (
                  <Text style={styles.helperText}>
                    Email vinculado a tu código de activación
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255, 255, 255, 0.7)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarContainer}>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.strengthBar,
                            {
                              backgroundColor:
                                index < passwordStrength.score
                                  ? passwordStrength.color
                                  : "rgba(255, 255, 255, 0.2)",
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.strengthLabel,
                        { color: passwordStrength.color },
                      ]}
                    >
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}

                {/* Password Requirements */}
                {passwordStrength.feedback.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Se requiere:</Text>
                    {passwordStrength.feedback.map((req, index) => (
                      <View key={index} style={styles.requirementRow}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={14}
                          color="rgba(255, 255, 255, 0.7)"
                        />
                        <Text style={styles.requirementText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255, 255, 255, 0.7)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={22}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchContainer}>
                    {password === confirmPassword ? (
                      <View style={styles.matchRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#00FF88"
                        />
                        <Text style={styles.matchText}>
                          Las contraseñas coinciden
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.matchRow}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#CC0000"
                        />
                        <Text
                          style={[
                            styles.matchText,
                            {
                              color: "#CC0000",
                              fontWeight: "700",
                              textShadowColor: "rgba(0, 0, 0, 0.5)",
                            },
                          ]}
                        >
                          Las contraseñas no coinciden
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={[
                  styles.createButton,
                  (loading ||
                    password.length < 8 ||
                    !/[A-Z]/.test(password) ||
                    !/[a-z]/.test(password) ||
                    !/[0-9]/.test(password) ||
                    password !== confirmPassword ||
                    confirmPassword.length === 0) &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreatePassword}
                disabled={
                  loading ||
                  password.length < 8 ||
                  !/[A-Z]/.test(password) ||
                  !/[a-z]/.test(password) ||
                  !/[0-9]/.test(password) ||
                  password !== confirmPassword ||
                  confirmPassword.length === 0
                }
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.createButtonText}>Creando cuenta...</Text>
                ) : (
                  <>
                    <Text style={styles.createButtonText}>Crear mi cuenta</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FF1B8D" />
                  </>
                )}
              </TouchableOpacity>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.securityText}>
                  Tu contraseña será encriptada y almacenada de forma segura
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeElement: {
    position: "absolute",
    zIndex: 0,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
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
  subtitle: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Input Group
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    ...typography.label,
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    ...typography.input,
    color: "#FFFFFF",
    height: "100%",
  },
  inputDisabled: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  lockIcon: {
    marginLeft: 8,
  },
  helperText: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 6,
    fontStyle: "italic",
  },
  eyeButton: {
    padding: 4,
  },

  // Password Strength
  strengthContainer: {
    marginTop: 12,
  },
  strengthBarContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  strengthLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
    textAlign: "center",
  },

  // Requirements
  requirementsContainer: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  requirementsTitle: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.95)", // Más contraste (antes era 0.8)
    fontWeight: "500", // Más peso
  },

  // Password Match
  matchContainer: {
    marginTop: 8,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchText: {
    ...typography.bodySmall,
    color: "#00FF88",
    fontWeight: "700", // Más bold (antes era 600)
    textShadowColor: "rgba(0, 0, 0, 0.3)", // Añadir sombra para contraste
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Create Button
  createButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  createButtonDisabled: {
    opacity: 0.4, // Más obvio que está deshabilitado (antes era 0.6)
    backgroundColor: "rgba(200, 200, 200, 0.5)", // Gris cuando está deshabilitado
  },
  createButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: "700",
  },

  // Security Note
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  securityText: {
    ...typography.bodySmall,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
    lineHeight: 18,
  },
});
