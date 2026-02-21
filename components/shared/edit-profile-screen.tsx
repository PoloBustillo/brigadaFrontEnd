/**
 * EditProfileScreen — shared across all roles.
 * Pass `profileRoute` to navigate back to the correct profile page.
 */

import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { toastManager } from "@/components/ui/toast-enhanced";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { updateProfile } from "@/lib/api/auth";
import { getErrorMessage } from "@/utils/translate-error";
import * as Haptics from "expo-haptics";
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

export function EditProfileScreen({ profileRoute }: Props) {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error("El nombre es obligatorio");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const updatedUser = await updateProfile({
        full_name: name.trim(),
        phone: phone.trim() || undefined,
      });

      await updateUser(updatedUser);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastManager.success("Perfil actualizado correctamente");
      setTimeout(() => router.back(), 800);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastManager.error(getErrorMessage(error));
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
          style={[
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
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
            <Ionicons name="person-circle" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Editar Perfil
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Actualiza tu información personal
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
          {/* ── Personal info card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información Personal
            </Text>

            <InputEnhanced
              label="Nombre Completo"
              value={name}
              onChangeText={setName}
              placeholder="Ingresa tu nombre completo"
              autoCapitalize="words"
              leftIcon="person-outline"
              containerStyle={styles.field}
            />

            {/* Email — read-only display row */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Correo Electrónico
              </Text>
              <View
                style={[
                  styles.readonlyRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textTertiary}
                  style={styles.readonlyIcon}
                />
                <Text
                  style={[styles.readonlyValue, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {user?.email || "—"}
                </Text>
              </View>
              <Text style={[styles.readonlyHint, { color: colors.textTertiary }]}>
                El correo se usa para iniciar sesión y no se puede cambiar
              </Text>
            </View>

            <InputEnhanced
              label="Teléfono (Opcional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              leftIcon="call-outline"
              containerStyle={styles.fieldLast}
            />
          </View>

          {/* ── Account info card ── */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Información de Cuenta
            </Text>

            <View
              style={[
                styles.infoRow,
                { borderBottomColor: colors.border + "60" },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Rol
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {user?.role || "—"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoRow,
                { borderBottomColor: colors.border + "60" },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Estado
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      user?.state === "ACTIVE"
                        ? colors.success + "20"
                        : colors.warning + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        user?.state === "ACTIVE"
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  {user?.state === "ACTIVE" ? "Activo" : user?.state || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowLast}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Miembro desde
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>
          </View>

          {/* ── Save button ── */}
          <ButtonEnhanced
            title="Guardar Cambios"
            onPress={handleSave}
            variant="gradient"
            loading={loading}
            disabled={loading}
            fullWidth
            icon="save-outline"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  /* Header */
  flatHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerCenter: { alignItems: "center", gap: 8 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  headerSub: { fontSize: 14, textAlign: "center" },

  /* Scroll */
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },

  /* Cards */
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16 },

  /* Fields */
  field: { marginBottom: 16 },
  fieldLast: { marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 8 },

  /* Read-only email row */
  readonlyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  readonlyIcon: {},
  readonlyValue: { flex: 1, fontSize: 15 },
  readonlyHint: { fontSize: 12, marginTop: 6 },

  /* Account info rows */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoValue: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  /* Save */
  saveButton: { marginTop: 4, marginBottom: 8 },
});
