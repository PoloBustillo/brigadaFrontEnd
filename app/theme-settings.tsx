/**
 * 🎨 Theme Settings Screen
 * Página de personalización de tema y esquema de colores
 */

import { ColorSchemeSelector } from "@/components/ui/color-scheme-selector";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ThemeSettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const router = useRouter();

  const themeModes = [
    { id: "light", name: "Claro", icon: "sunny" },
    { id: "dark", name: "Oscuro", icon: "moon" },
    { id: "auto", name: "Auto", icon: "phone-portrait" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Personalización
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modo de Tema */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="contrast" size={24} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Modo de Tema
            </Text>
          </View>

          <View style={styles.optionsGrid}>
            {themeModes.map((mode) => {
              const isSelected = themeMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.overlay
                        : colors.surface,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setThemeMode(mode.id)}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={32}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeName,
                      {
                        color: isSelected ? colors.text : colors.textSecondary,
                        fontWeight: isSelected ? "600" : "400",
                      },
                    ]}
                  >
                    {mode.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text
            style={[styles.sectionDescription, { color: colors.textTertiary }]}
          >
            En modo &quot;Auto&quot;, el tema se ajusta automáticamente según la
            configuración de tu dispositivo.
          </Text>
        </View>

        {/* Divisor */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Esquema de Colores */}
        <View style={styles.section}>
          <ColorSchemeSelector />
          <Text
            style={[styles.sectionDescription, { color: colors.textTertiary }]}
          >
            Elige el esquema de colores que mejor se adapte a tu estilo. Los
            cambios se aplican inmediatamente.
          </Text>
        </View>

        {/* Divisor */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Vista previa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye" size={24} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Vista Previa
            </Text>
          </View>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              Texto Principal
            </Text>
            <Text
              style={[styles.previewSubtitle, { color: colors.textSecondary }]}
            >
              Texto Secundario
            </Text>
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[
                  styles.previewButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.previewButtonText,
                    { color: colors.background },
                  ]}
                >
                  Botón Primario
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.previewButtonOutline,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.previewButtonOutlineText,
                    { color: colors.text },
                  ]}
                >
                  Secundario
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status badges */}
            <View style={styles.statusBadges}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.success + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  Éxito
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.warning + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.warning }]}>
                  Alerta
                </Text>
              </View>
              <View
                style={[styles.badge, { backgroundColor: colors.error + "20" }]}
              >
                <Text style={[styles.badgeText, { color: colors.error }]}>
                  Error
                </Text>
              </View>
              <View
                style={[styles.badge, { backgroundColor: colors.info + "20" }]}
              >
                <Text style={[styles.badgeText, { color: colors.info }]}>
                  Info
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  modeName: {
    fontSize: 14,
    marginTop: 8,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 24,
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  previewButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewButtonOutline: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  previewButtonOutlineText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
