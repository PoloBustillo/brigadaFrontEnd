/**
 * 🎨 Color Scheme Selector
 * Grid de esquemas de colores — 3 columnas, todo visible sin deslizar
 */

import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ColorSchemeSelector() {
  const { colorScheme, availableSchemes, setColorScheme } = useTheme();
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {availableSchemes.map((scheme) => {
          const isSelected = scheme.id === colorScheme;

          return (
            <TouchableOpacity
              key={scheme.id}
              style={[
                styles.card,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.overlay : colors.surface,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setColorScheme(scheme.id)}
              activeOpacity={0.7}
            >
              {/* Color swatch — horizontal bar with light & dark primary */}
              <View style={styles.swatch}>
                <View
                  style={[
                    styles.swatchHalf,
                    {
                      backgroundColor: scheme.light.primary,
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.swatchHalf,
                    {
                      backgroundColor: scheme.dark.primary,
                      borderTopRightRadius: 6,
                      borderBottomRightRadius: 6,
                    },
                  ]}
                />
              </View>

              {/* Name */}
              <Text
                style={[
                  styles.name,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
                numberOfLines={1}
              >
                {scheme.name}
              </Text>

              {/* Check */}
              {isSelected && (
                <View style={styles.check}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "30.5%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  swatch: {
    flexDirection: "row",
    width: 44,
    height: 26,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  swatchHalf: {
    flex: 1,
  },
  name: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
  },
});
