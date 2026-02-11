/**
 * 🎨 Badge Enhanced - Brigada Digital
 * Componente de insignia/etiqueta mejorado con variantes y tamaños
 */

import { DesignTokens } from "@/constants/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface BadgeEnhancedProps {
  text: string | number;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral";
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  outlined?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
}

export function BadgeEnhanced({
  text,
  variant = "primary",
  size = "md",
  icon,
  dot = false,
  outlined = false,
  rounded = false,
  style,
}: BadgeEnhancedProps) {
  const sizeConfig = {
    sm: {
      fontSize: DesignTokens.typography.fontSize.xs,
      iconSize: 12,
      paddingH: DesignTokens.spacing[2],
      paddingV: DesignTokens.spacing[1],
      dotSize: 6,
    },
    md: {
      fontSize: DesignTokens.typography.fontSize.sm,
      iconSize: 14,
      paddingH: DesignTokens.spacing[3],
      paddingV: DesignTokens.spacing[1],
      dotSize: 8,
    },
    lg: {
      fontSize: DesignTokens.typography.fontSize.base,
      iconSize: 16,
      paddingH: DesignTokens.spacing[4],
      paddingV: DesignTokens.spacing[2],
      dotSize: 10,
    },
  };

  const config = sizeConfig[size];

  const getColors = () => {
    const variantColors = {
      primary: {
        bg: DesignTokens.colors.primary[100],
        text: DesignTokens.colors.primary[700],
        border: DesignTokens.colors.primary[300],
      },
      secondary: {
        bg: DesignTokens.colors.secondary[100],
        text: DesignTokens.colors.secondary[700],
        border: DesignTokens.colors.secondary[300],
      },
      success: {
        bg: DesignTokens.colors.success.light,
        text: DesignTokens.colors.success.dark,
        border: DesignTokens.colors.success.main,
      },
      warning: {
        bg: DesignTokens.colors.warning.light,
        text: DesignTokens.colors.warning.dark,
        border: DesignTokens.colors.warning.main,
      },
      error: {
        bg: DesignTokens.colors.error.light,
        text: DesignTokens.colors.error.dark,
        border: DesignTokens.colors.error.main,
      },
      info: {
        bg: DesignTokens.colors.info.light,
        text: DesignTokens.colors.info.dark,
        border: DesignTokens.colors.info.main,
      },
      neutral: {
        bg: DesignTokens.colors.neutral[200],
        text: DesignTokens.colors.neutral[700],
        border: DesignTokens.colors.neutral[400],
      },
    };

    return variantColors[variant];
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: outlined ? "transparent" : colors.bg,
          borderColor: outlined ? colors.border : "transparent",
          borderWidth: outlined ? 1 : 0,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          borderRadius: rounded
            ? DesignTokens.borderRadius.full
            : DesignTokens.borderRadius.base,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              width: config.dotSize,
              height: config.dotSize,
              backgroundColor: colors.text,
            },
          ]}
        />
      )}

      {icon && (
        <Ionicons
          name={icon}
          size={config.iconSize}
          color={colors.text}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: config.fontSize,
            fontWeight: DesignTokens.typography.fontWeight.semibold,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  dot: {
    borderRadius: DesignTokens.borderRadius.full,
    marginRight: DesignTokens.spacing[1],
  },
  icon: {
    marginRight: DesignTokens.spacing[1],
  },
  text: {
    // Estilos dinámicos aplicados inline
  },
});

// ==================== EXPORTACIONES ====================

export default BadgeEnhanced;

/**
 * @example
 * // Badge básico
 * <BadgeEnhanced text="Nuevo" variant="success" />
 *
 * @example
 * // Badge con icono
 * <BadgeEnhanced
 *   text="5 Pendientes"
 *   variant="warning"
 *   icon="alert-circle-outline"
 * />
 *
 * @example
 * // Badge con dot indicator
 * <BadgeEnhanced
 *   text="Activo"
 *   variant="success"
 *   dot
 *   rounded
 * />
 *
 * @example
 * // Badge outlined
 * <BadgeEnhanced
 *   text="Premium"
 *   variant="primary"
 *   outlined
 *   size="lg"
 * />
 */
