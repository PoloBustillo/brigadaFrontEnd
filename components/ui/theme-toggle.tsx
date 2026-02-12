/**
 * 🎨 Theme Toggle - Brigada Digital
 * Componente para cambiar entre modo claro/oscuro
 */

import { DesignTokens } from "@/constants/design-tokens";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ThemeToggleProps {
  style?: ViewStyle;
  showLabel?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ThemeToggle({ style, showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const isDark = theme === "dark";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });

    rotation.value = withTiming(rotation.value + 180, { duration: 300 });

    toggleTheme();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        animatedStyle,
        style,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={24}
          color={isDark ? "#FFFFFF" : "#FF1B8D"} // Blanco en dark, rosa en light
        />
      </View>

      {showLabel && (
        <Text
          style={[styles.label, isDark ? styles.labelDark : styles.labelLight]}
        >
          {isDark ? "Modo Oscuro" : "Modo Claro"}
        </Text>
      )}
    </AnimatedTouchable>
  );
}

// Versión compacta solo con icono
export function ThemeToggleIcon({ style }: { style?: ViewStyle }) {
  const { theme, toggleTheme } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const isDark = theme === "dark";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.8, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });

    rotation.value = withTiming(rotation.value + 180, { duration: 300 });

    toggleTheme();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[styles.iconOnly, animatedStyle, style]}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={
        isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      accessibilityHint="Presiona para cambiar el tema de la aplicación"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={isDark ? "moon" : "sunny"}
        size={24}
        color={isDark ? "#FFFFFF" : "#FF1B8D"} // Blanco en dark, rosa en light
      />
    </AnimatedTouchable>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.borderRadius.lg,
    ...DesignTokens.shadows.sm,
  },
  containerLight: {
    backgroundColor: DesignTokens.colors.neutral[0],
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[200],
  },
  containerDark: {
    backgroundColor: DesignTokens.colors.neutral[900],
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[700],
  },
  iconContainer: {
    marginRight: DesignTokens.spacing[3],
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  labelLight: {
    color: DesignTokens.colors.neutral[900],
  },
  labelDark: {
    color: DesignTokens.colors.neutral[50],
  },
  iconOnly: {
    padding: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.full,
  },
});

// ==================== EXPORTACIONES ====================

export default ThemeToggle;

/**
 * @example
 * // Toggle con label
 * <ThemeToggle />
 *
 * @example
 * // Solo icono (para header)
 * <ThemeToggleIcon />
 *
 * @example
 * // Custom styling
 * <ThemeToggle
 *   style={{ marginTop: 20 }}
 *   showLabel={false}
 * />
 */
