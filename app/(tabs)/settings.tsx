/**
 * Settings Screen - Brigada Digital
 * Configuración de la aplicación, incluyendo tema
 */

import { CardEnhanced } from "@/components/ui/card-enhanced";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();
  const [selectedMode, setSelectedMode] = useState(themeMode);

  const handleModeChange = (mode: "light" | "dark" | "auto") => {
    setSelectedMode(mode);
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Configuración
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Personaliza tu experiencia
          </Text>
        </View>

        {/* Appearance Section */}
        <CardEnhanced
          header={{
            title: "Apariencia",
            icon: "color-palette-outline",
          }}
          style={styles.card}
        >
          {/* Theme Toggle Component */}
          <ThemeToggle />

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Selecciona el modo
            </Text>

            <View style={styles.modeButtons}>
              {/* Light Mode */}
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      selectedMode === "light"
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedMode === "light"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => handleModeChange("light")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sunny"
                  size={24}
                  color={
                    selectedMode === "light" ? "#FFFFFF" : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color:
                        selectedMode === "light"
                          ? "#FFFFFF"
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Claro
                </Text>
              </TouchableOpacity>

              {/* Dark Mode */}
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      selectedMode === "dark" ? colors.primary : colors.surface,
                    borderColor:
                      selectedMode === "dark" ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleModeChange("dark")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={
                    selectedMode === "dark" ? "#FFFFFF" : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color:
                        selectedMode === "dark"
                          ? "#FFFFFF"
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Oscuro
                </Text>
              </TouchableOpacity>

              {/* Auto Mode */}
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      selectedMode === "auto" ? colors.primary : colors.surface,
                    borderColor:
                      selectedMode === "auto" ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleModeChange("auto")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={
                    selectedMode === "auto" ? "#FFFFFF" : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color:
                        selectedMode === "auto"
                          ? "#FFFFFF"
                          : colors.textSecondary,
                    },
                  ]}
                >
                  Automático
                </Text>
              </TouchableOpacity>
            </View>

            {/* Helper Text */}
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              {selectedMode === "auto"
                ? "El tema seguirá la configuración del sistema"
                : selectedMode === "light"
                  ? "Modo claro activado"
                  : "Modo oscuro activado"}
            </Text>
          </View>
        </CardEnhanced>

        {/* About Section */}
        <CardEnhanced
          header={{
            title: "Acerca de",
            icon: "information-circle-outline",
          }}
          style={styles.card}
        >
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
              Versión
            </Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>
              1.0.0
            </Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>
              Aplicación
            </Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>
              Brigada Digital
            </Text>
          </View>
        </CardEnhanced>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  modeSelector: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  aboutValue: {
    fontSize: 15,
    fontWeight: "600",
  },
});
