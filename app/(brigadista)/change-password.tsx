/**
 * Change Password Screen - Brigadista
 * Cambiar contraseña del usuario
 */

import { changePassword } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePasswordScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.push("/(brigadista)/profile" as any);
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una mayúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una minúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validate current password
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Ingresa tu contraseña actual");
      return;
    }

    // Validate new password
    if (!newPassword.trim()) {
      Alert.alert("Error", "Ingresa una nueva contraseña");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Error", passwordError);
      return;
    }

    // Validate confirmation
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      Alert.alert(
        "Error",
        "La nueva contraseña debe ser diferente a la actual",
      );
      return;
    }

    setLoading(true);

    try {
      // Call real API
      await changePassword(currentPassword, newPassword);

      Alert.alert(
        "Éxito",
        "Contraseña actualizada correctamente. Por favor inicia sesión nuevamente.",
        [
          {
            text: "OK",
            onPress: () => {
              // Log out user and redirect to login
              router.replace("/(auth)/login" as any);
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert(
        "Error",
        (error as Error).message || "No se pudo cambiar la contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string,
  ): {
    strength: number;
    label: string;
    color: string;
  } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength: 33, label: "Débil", color: colors.error };
    } else if (strength <= 4) {
      return { strength: 66, label: "Media", color: colors.warning };
    } else {
      return { strength: 100, label: "Fuerte", color: colors.success };
    }
  };

  const passwordStrength = newPassword
    ? getPasswordStrength(newPassword)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cambiar Contraseña
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.info + "10",
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.info }]}>
              Por tu seguridad, te pediremos que inicies sesión nuevamente
              después de cambiar tu contraseña.
            </Text>
          </View>

          {/* Password Form */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Current Password */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Contraseña Actual *
              </Text>
              <View style={styles.passwordContainer}>
                <Input
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Ingresa tu contraseña actual"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nueva Contraseña *
              </Text>
              <View style={styles.passwordContainer}>
                <Input
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ingresa tu nueva contraseña"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <View style={styles.strengthContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
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
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Confirmar Nueva Contraseña *
              </Text>
              <View style={styles.passwordContainer}>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirma tu nueva contraseña"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 &&
                confirmPassword !== newPassword && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Las contraseñas no coinciden
                  </Text>
                )}
            </View>
          </View>

          {/* Password Requirements */}
          <View
            style={[
              styles.requirementsCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Requisitos de contraseña:
            </Text>
            <View style={styles.requirementsList}>
              <RequirementItem
                met={newPassword.length >= 8}
                text="Mínimo 8 caracteres"
                colors={colors}
              />
              <RequirementItem
                met={/[A-Z]/.test(newPassword)}
                text="Al menos una letra mayúscula"
                colors={colors}
              />
              <RequirementItem
                met={/[a-z]/.test(newPassword)}
                text="Al menos una letra minúscula"
                colors={colors}
              />
              <RequirementItem
                met={/[0-9]/.test(newPassword)}
                text="Al menos un número"
                colors={colors}
              />
            </View>
          </View>

          {/* Save Button */}
          <Button
            title="Cambiar Contraseña"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function RequirementItem({
  met,
  text,
  colors,
}: {
  met: boolean;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={met ? colors.success : colors.textTertiary}
      />
      <Text
        style={[
          styles.requirementText,
          {
            color: met ? colors.text : colors.textTertiary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerRight: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 8,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  requirementsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
  },
  saveButton: {
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
