/**
 * 🎨 Color Scheme Selector
 * Component para seleccionar esquemas de colores de la app
 */

import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function ColorSchemeSelector() {
  const { colorScheme, availableSchemes, setColorScheme } = useTheme();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="color-palette" size={24} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>
          Esquema de Colores
        </Text>
      </View>

      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        👉 Desliza para ver más esquemas
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        decelerationRate="fast"
        snapToInterval={172}
        snapToAlignment="start"
        contentContainerStyle={styles.schemesContainer}
      >
        {availableSchemes.map((scheme) => {
          const isSelected = scheme.id === colorScheme;

          return (
            <TouchableOpacity
              key={scheme.id}
              style={[
                styles.schemeCard,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? colors.overlay
                    : colors.surface,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setColorScheme(scheme.id)}
            >
              {/* Color preview — 2×2 grid: light bg, light primary, dark bg, dark primary */}
              <View style={styles.colorPreview}>
                <View style={styles.colorPreviewRow}>
                  <View
                    style={[
                      styles.colorBlock,
                      { backgroundColor: scheme.light.background },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorBlock,
                      { backgroundColor: scheme.light.primary },
                    ]}
                  />
                </View>
                <View style={styles.colorPreviewRow}>
                  <View
                    style={[
                      styles.colorBlock,
                      { backgroundColor: scheme.dark.background },
                    ]}
                  />
                  <View
                    style={[
                      styles.colorBlock,
                      { backgroundColor: scheme.dark.primary },
                    ]}
                  />
                </View>
              </View>

              {/* Scheme name */}
              <Text
                style={[
                  styles.schemeName,
                  {
                    color: isSelected ? colors.text : colors.textSecondary,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {scheme.name}
              </Text>

              {/* Description */}
              <Text
                style={[
                  styles.schemeDescription,
                  { color: colors.textTertiary },
                ]}
                numberOfLines={2}
              >
                {scheme.description}
              </Text>

              {/* Selected indicator */}
              {isSelected && (
                <View style={styles.selectedBadge}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontStyle: "italic",
  },
  schemesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  schemeCard: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  colorPreview: {
    flexDirection: "column",
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  colorPreviewRow: {
    flexDirection: "row",
    flex: 1,
  },
  colorBlock: {
    flex: 1,
  },
  schemeName: {
    fontSize: 16,
    marginBottom: 4,
  },
  schemeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
