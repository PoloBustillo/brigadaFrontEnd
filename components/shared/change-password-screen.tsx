/**
 * ChangePasswordScreen — shared across all roles.
 * Pass `profileRoute` to navigate back to the correct profile page.
 */

import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { toastManager } from "@/components/ui/toast-enhanced";
import { typography } from "@/constants/typography";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { changePassword } from "@/lib/api/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  profileRoute: string;
}

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { pct: 33, label: "Débil", level: 0 };
  if (score <= 4) return { pct: 66, label: "Media", level: 1 };
  return { pct: 100, label: "Fuerte", level: 2 };
}

function RequirementRow({
  met,
  text,
  colors,
}: {
  met: boolean;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={15}
        color={met ? colors.success : colors.textTertiary}
      />
      <Text
        style={[
          styles.reqText,
          { color: met ? colors.text : colors.textTertiary },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function ChangePasswordScreen({ profileRoute }: Props) {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = next ? getStrength(next) : null;
  const strengthColors = [colors.error, colors.warning, colors.success];
  const mismatch = confirm.length > 0 && confirm !== next;

  const handleSubmit = async () => {
    if (!current.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("Ingresa tu contraseña actual");
      return;
    }
    if (next.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(next)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("Incluye al menos una letra mayúscula");
      return;
    }
    if (!/[a-z]/.test(next)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("Incluye al menos una letra minúscula");
      return;
    }
    if (!/[0-9]/.test(next)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("Incluye al menos un número");
      return;
    }
    if (next !== confirm) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (current === next) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toastManager.warning("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await changePassword(current, next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastManager.success("Contraseña actualizada. Inicia sesión nuevamente.");
      setTimeout(() => router.replace("/(auth)/login-enhanced" as any), 1500);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error(
        (err as Error).message || "No se pudo cambiar la contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Flat header ── */}
      <View
        style={[
          styles.flatHeader,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push(profileRoute as any)}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cambiar Contraseña</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Mantén tu cuenta segura con una buena contraseña
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentPadding + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Security notice ── */}
          <View
            style={[
              styles.notice,
              {
                backgroundColor: colors.info + "12",
                borderColor: colors.info + "40",
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.info}
            />
            <Text style={[styles.noticeText, { color: colors.info }]}>
              Después del cambio cerrarás sesión automáticamente.
            </Text>
          </View>

          {/* ── Form card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <InputEnhanced
              label="Contraseña actual"
              required
              leftIcon="lock-closed-outline"
              rightIcon={showCurrent ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowCurrent((v) => !v)}
              secureTextEntry={!showCurrent}
              value={current}
              onChangeText={setCurrent}
              placeholder="Ingresa tu contraseña actual"
              autoCapitalize="none"
              autoComplete="password"
              containerStyle={styles.field}
            />

            <InputEnhanced
              label="Nueva contraseña"
              required
              leftIcon="key-outline"
              rightIcon={showNext ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowNext((v) => !v)}
              secureTextEntry={!showNext}
              value={next}
              onChangeText={setNext}
              placeholder="Mínimo 8 caracteres"
              autoCapitalize="none"
              autoComplete="password-new"
              containerStyle={styles.field}
            />

            {/* Strength bar */}
            {strength && (
              <View style={styles.strengthWrap}>
                <View
                  style={[
                    styles.strengthTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${strength.pct}%` as any,
                        backgroundColor: strengthColors[strength.level],
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: strengthColors[strength.level] },
                  ]}
                >
                  {strength.label}
                </Text>
              </View>
            )}

            <InputEnhanced
              label="Confirmar nueva contraseña"
              required
              leftIcon="shield-outline"
              rightIcon={showConfirm ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowConfirm((v) => !v)}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repite la nueva contraseña"
              autoCapitalize="none"
              autoComplete="password-new"
              error={mismatch ? "Las contraseñas no coinciden" : undefined}
              containerStyle={styles.field}
            />
          </View>

          {/* ── Requirements card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.reqTitle, { color: colors.text }]}>
              Requisitos
            </Text>
            <RequirementRow
              met={next.length >= 8}
              text="Mínimo 8 caracteres"
              colors={colors}
            />
            <RequirementRow
              met={/[A-Z]/.test(next)}
              text="Al menos una mayúscula"
              colors={colors}
            />
            <RequirementRow
              met={/[a-z]/.test(next)}
              text="Al menos una minúscula"
              colors={colors}
            />
            <RequirementRow
              met={/[0-9]/.test(next)}
              text="Al menos un número"
              colors={colors}
            />
          </View>

          {/* ── Action button ── */}
          <ButtonEnhanced
            title="Actualizar Contraseña"
            onPress={handleSubmit}
            variant="gradient"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            icon="checkmark-circle-outline"
            iconPosition="left"
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  /* header */
  flatHeader: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center", marginTop: 4 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSub: {
    ...typography.bodySmall,
    textAlign: "center",
    maxWidth: 260,
  },

  /* body */
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  field: { marginBottom: 8 },

  /* strength */
  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: "600", minWidth: 40 },

  /* requirements */
  reqTitle: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  reqText: { fontSize: 13 },

  /* button */
  btn: { marginTop: 4 },
});
