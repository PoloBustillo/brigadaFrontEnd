import { useThemeColors } from "@/contexts/theme-context";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Componente de botón reutilizable
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    if (hex.length !== 6) {
      return "#FFFFFF";
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#111827" : "#FFFFFF";
  };
  const onPrimary = getContrastTextColor(colors.primary);
  const onSecondary = getContrastTextColor(colors.textSecondary);
  const onDanger = getContrastTextColor(colors.error);
  const variantStyles = {
    primaryButton: { backgroundColor: colors.primary },
    secondaryButton: { backgroundColor: colors.textSecondary },
    outlineButton: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    dangerButton: { backgroundColor: colors.error },
  };
  const variantTextStyles = {
    primaryText: { color: onPrimary },
    secondaryText: { color: onSecondary },
    outlineText: { color: colors.primary },
    dangerText: { color: onDanger },
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[`${variant}Button`],
        styles[`${size}Button`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline"
              ? colors.primary
              : variant === "secondary"
                ? onSecondary
                : variant === "danger"
                  ? onDanger
                  : onPrimary
          }
          size={size === "small" ? "small" : "small"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // Text styles
  text: {
    fontWeight: "600",
  },

  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
