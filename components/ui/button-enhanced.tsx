/**
 * 🎨 Button Enhanced - Brigada Digital
 * Componente de botón mejorado con variantes, tamaños, iconos y animaciones
 */

import { DesignTokens } from "@/constants/design-tokens";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface ButtonEnhancedProps {
  title: string;
  onPress: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "gradient"
    | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ButtonEnhanced({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  rounded = false,
  style,
  textStyle: customTextStyle,
}: ButtonEnhancedProps) {
  const colors = useThemeColors();
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  // Animación de escala al presionar
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const isDisabled = disabled || loading;
  const isGradient = variant === "gradient";

  // Configuración de tamaño
  const sizeConfig = {
    xs: { iconSize: 14, fontSize: DesignTokens.typography.fontSize.xs },
    sm: { iconSize: 16, fontSize: DesignTokens.typography.fontSize.sm },
    md: { iconSize: 18, fontSize: DesignTokens.typography.fontSize.base },
    lg: { iconSize: 20, fontSize: DesignTokens.typography.fontSize.lg },
    xl: { iconSize: 24, fontSize: DesignTokens.typography.fontSize.xl },
  };

  // Colores de iconos y loading (adaptados al tema)
  const getIconColor = (): string => {
    // Para gradient, siempre blanco para máximo contraste
    if (variant === "gradient") {
      return "#FFFFFF";
    }

    if (variant === "outline" || variant === "ghost") {
      return colors.primary;
    }
    return "#FFFFFF"; // Blanco para botones con fondo
  };

  const getLoadingColor = (): string => {
    // Para gradient, siempre blanco para máximo contraste
    if (variant === "gradient") {
      return "#FFFFFF";
    }

    if (variant === "outline" || variant === "ghost") {
      return colors.primary;
    }
    return "#FFFFFF"; // Blanco para botones con fondo
  };

  // Contenido del botón
  const renderContent = () => (
    <View style={styles.content}>
      {icon && iconPosition === "left" && !loading && (
        <Ionicons
          name={icon}
          size={sizeConfig[size].iconSize}
          color={getIconColor()}
          style={styles.iconLeft}
        />
      )}

      {loading ? (
        <ActivityIndicator size="small" color={getLoadingColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            { fontSize: sizeConfig[size].fontSize },
            customTextStyle,
          ]}
        >
          {title}
        </Text>
      )}

      {icon && iconPosition === "right" && !loading && (
        <Ionicons
          name={icon}
          size={sizeConfig[size].iconSize}
          color={getIconColor()}
          style={styles.iconRight}
        />
      )}
    </View>
  );

  // Obtener estilos de variante dinámicamente
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary,
          ...DesignTokens.shadows.sm,
        };
      case "secondary":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: DesignTokens.borderWidth.base,
          borderColor: colors.primary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "danger":
        return {
          backgroundColor: colors.error,
          ...DesignTokens.shadows.sm,
        };
      default:
        return {};
    }
  };

  // Obtener color de texto dinámicamente
  const getTextColor = (): string => {
    // Para variant gradient: siempre blanco para máximo contraste
    if (variant === "gradient") {
      return "#FFFFFF";
    }

    if (
      variant === "outline" ||
      variant === "ghost" ||
      variant === "secondary"
    ) {
      return colors.text;
    }
    return "#FFFFFF";
  };

  // Renderizado con gradiente
  if (isGradient) {
    // ✅ Quitamos la condición !isDisabled
    // Gradiente MUY contrastante y visible en ambos temas
    const gradientColors = (
      theme === "dark"
        ? ["#8B0A3D", "#5C0727"] // Rosa MUY OSCURO en dark (casi borgoña)
        : ["#FF0080", "#E6006F"]
    ) as [string, string]; // Rosa MUY vibrante en light

    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[animatedStyle, fullWidth && styles.fullWidth]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={title}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            sizeStyles[size],
            rounded && styles.rounded,
            isDisabled && styles.disabled, // ✅ Aplica opacity cuando disabled
            {
              shadowColor: theme === "dark" ? "#000" : "#FF0080",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDisabled ? 0.2 : 0.4, // ✅ Menos sombra cuando disabled
              shadowRadius: 10,
              elevation: isDisabled ? 3 : 8, // ✅ Menos elevation cuando disabled
            },
            style,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  // Renderizado normal
  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[
        animatedStyle,
        styles.base,
        getVariantStyle(),
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        rounded && styles.rounded,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={title}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignTokens.borderRadius.base,
    flexDirection: "row",
  },
  fullWidth: {
    width: "100%",
  },
  rounded: {
    borderRadius: DesignTokens.borderRadius.full,
  },
  disabled: {
    opacity: DesignTokens.opacity.disabled,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: DesignTokens.spacing[2],
  },
  iconRight: {
    marginLeft: DesignTokens.spacing[2],
  },
  text: {
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});

// Tamaños
const sizeStyles = StyleSheet.create({
  xs: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[1],
    minHeight: 28,
  },
  sm: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    minHeight: 36,
  },
  md: {
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[3],
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    minHeight: 52,
  },
  xl: {
    paddingHorizontal: DesignTokens.spacing[8],
    paddingVertical: DesignTokens.spacing[5],
    minHeight: 60,
  },
});

// ==================== EXPORTACIONES ====================

export default ButtonEnhanced;

// Ejemplo de uso en comentarios JSDoc
/**
 * @example
 * // Botón primary con icono
 * <ButtonEnhanced
 *   title="Iniciar Sesión"
 *   onPress={handleLogin}
 *   icon="log-in-outline"
 *   variant="primary"
 *   size="lg"
 *   fullWidth
 * />
 *
 * @example
 * // Botón con gradiente y loading
 * <ButtonEnhanced
 *   title="Guardando..."
 *   onPress={handleSave}
 *   variant="gradient"
 *   loading={isSaving}
 *   icon="save-outline"
 *   iconPosition="left"
 * />
 *
 * @example
 * // Botón outline pequeño
 * <ButtonEnhanced
 *   title="Cancelar"
 *   onPress={handleCancel}
 *   variant="outline"
 *   size="sm"
 * />
 */
