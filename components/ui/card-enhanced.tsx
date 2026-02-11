/**
 * 🎨 Card Enhanced - Brigada Digital
 * Componente de tarjeta mejorado con variantes, sombras y estados interactivos
 */

import { DesignTokens } from "@/constants/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
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
} from "react-native-reanimated";

interface CardEnhancedProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: keyof typeof DesignTokens.spacing;
  onPress?: () => void;
  disabled?: boolean;
  header?: {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightElement?: ReactNode;
  };
  footer?: ReactNode;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CardEnhanced({
  children,
  variant = "default",
  padding = 4,
  onPress,
  disabled = false,
  header,
  footer,
  style,
}: CardEnhancedProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 400,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      onPress();
    }
  };

  const paddingValue = DesignTokens.spacing[padding];

  const renderContent = () => (
    <>
      {header && (
        <View style={[styles.header, { paddingBottom: paddingValue }]}>
          <View style={styles.headerLeft}>
            {header.icon && (
              <View style={styles.headerIcon}>
                <Ionicons
                  name={header.icon}
                  size={24}
                  color={DesignTokens.colors.primary[600]}
                />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{header.title}</Text>
              {header.subtitle && (
                <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
              )}
            </View>
          </View>
          {header.rightElement && (
            <View style={styles.headerRight}>{header.rightElement}</View>
          )}
        </View>
      )}

      <View style={header || footer ? styles.content : undefined}>
        {children}
      </View>

      {footer && (
        <View style={[styles.footer, { paddingTop: paddingValue }]}>
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={[
          animatedStyle,
          styles.base,
          variantStyles[variant],
          { padding: paddingValue },
          disabled && styles.disabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {renderContent()}
      </AnimatedTouchable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: paddingValue },
        style,
      ]}
    >
      {renderContent()}
    </View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: "hidden",
  },
  disabled: {
    opacity: DesignTokens.opacity.disabled,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.neutral[200],
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: DesignTokens.spacing[3],
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.neutral[900],
    marginBottom: DesignTokens.spacing[1],
  },
  headerSubtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.neutral[600],
  },
  headerRight: {
    marginLeft: DesignTokens.spacing[3],
  },
  content: {
    // Sin estilos adicionales, el children maneja su propio layout
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.neutral[200],
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: DesignTokens.colors.neutral[0],
    ...DesignTokens.shadows.sm,
  },
  elevated: {
    backgroundColor: DesignTokens.colors.neutral[0],
    ...DesignTokens.shadows.lg,
  },
  outlined: {
    backgroundColor: DesignTokens.colors.neutral[0],
    borderWidth: DesignTokens.borderWidth.base,
    borderColor: DesignTokens.colors.neutral[300],
  },
  filled: {
    backgroundColor: DesignTokens.colors.neutral[100],
  },
});

// ==================== EXPORTACIONES ====================

export default CardEnhanced;

/**
 * @example
 * // Card básico
 * <CardEnhanced>
 *   <Text>Contenido de la tarjeta</Text>
 * </CardEnhanced>
 *
 * @example
 * // Card con header e icono
 * <CardEnhanced
 *   header={{
 *     title: 'Perfil de Usuario',
 *     subtitle: 'Información personal',
 *     icon: 'person-outline',
 *   }}
 * >
 *   <Text>Nombre: Juan Pérez</Text>
 * </CardEnhanced>
 *
 * @example
 * // Card interactivo con variante elevated
 * <CardEnhanced
 *   variant="elevated"
 *   onPress={() => console.log('Card pressed')}
 *   header={{
 *     title: 'Encuesta Pendiente',
 *     rightElement: <Badge text="Nuevo" variant="success" />,
 *   }}
 * >
 *   <Text>Completa la encuesta de satisfacción</Text>
 * </CardEnhanced>
 */
