/**
 * 🎨 Button Enhanced - Brigada Digital
 * Componente de botón mejorado con variantes, tamaños, iconos y animaciones
 */

import { DesignTokens } from "@/constants/design-tokens";
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

  // Colores de iconos y loading
  const getIconColor = (): string => {
    if (variant === "outline" || variant === "ghost") {
      return DesignTokens.colors.primary[600];
    }
    return DesignTokens.colors.neutral[0];
  };

  const getLoadingColor = (): string => {
    if (variant === "outline" || variant === "ghost") {
      return DesignTokens.colors.primary[600];
    }
    return DesignTokens.colors.neutral[0];
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
            textStyles[variant],
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

  // Renderizado con gradiente
  if (isGradient && !isDisabled) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[animatedStyle, fullWidth && styles.fullWidth]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityLabel={title}
      >
        <LinearGradient
          colors={DesignTokens.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            sizeStyles[size],
            rounded && styles.rounded,
            isDisabled && styles.disabled,
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
      activeOpacity={0.8}
      style={[
        animatedStyle,
        styles.base,
        variantStyles[variant],
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

// Variantes de color
const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: DesignTokens.colors.primary[600],
    ...DesignTokens.shadows.sm,
  },
  secondary: {
    backgroundColor: DesignTokens.colors.secondary[600],
    ...DesignTokens.shadows.sm,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: DesignTokens.borderWidth.base,
    borderColor: DesignTokens.colors.primary[600],
  },
  ghost: {
    backgroundColor: "transparent",
  },
  gradient: {
    // Estilo aplicado vía LinearGradient
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: DesignTokens.colors.error.main,
    ...DesignTokens.shadows.sm,
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

// Estilos de texto por variante
const textStyles = StyleSheet.create({
  primary: {
    color: DesignTokens.colors.neutral[0],
  },
  secondary: {
    color: DesignTokens.colors.neutral[0],
  },
  outline: {
    color: DesignTokens.colors.primary[600],
  },
  ghost: {
    color: DesignTokens.colors.primary[600],
  },
  gradient: {
    color: DesignTokens.colors.neutral[0],
  },
  danger: {
    color: DesignTokens.colors.neutral[0],
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
