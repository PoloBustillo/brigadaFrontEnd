/**
 * 🎨 Input Enhanced - Brigada Digital
 * Componente de input mejorado con validación, iconos y estados visuales
 */

import { DesignTokens } from "@/constants/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface InputEnhancedProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: "default" | "filled" | "underlined";
  size?: "sm" | "md" | "lg";
  showCharCount?: boolean;
  containerStyle?: ViewStyle;
}

export function InputEnhanced({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = "default",
  size = "md",
  showCharCount = false,
  maxLength,
  value = "",
  containerStyle,
  style,
  ...props
}: InputEnhancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  // Animación del borde al enfocarse
  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = withTiming(
      error
        ? DesignTokens.colors.error.main
        : focusAnim.value === 1
          ? DesignTokens.colors.primary[600]
          : DesignTokens.colors.neutral[300],
      { duration: 200 },
    );

    const borderWidth = withTiming(focusAnim.value === 1 ? 2 : 1, {
      duration: 200,
    });

    return {
      borderColor,
      borderWidth,
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = 1;
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = 0;
    props.onBlur?.(e);
  };

  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      fontSize: DesignTokens.typography.fontSize.sm,
      iconSize: 16,
      padding: DesignTokens.spacing[2],
    },
    md: {
      fontSize: DesignTokens.typography.fontSize.base,
      iconSize: 20,
      padding: DesignTokens.spacing[3],
    },
    lg: {
      fontSize: DesignTokens.typography.fontSize.lg,
      iconSize: 24,
      padding: DesignTokens.spacing[4],
    },
  };

  // Color de iconos dinámico
  const getIconColor = (): string => {
    if (error) return DesignTokens.colors.error.main;
    if (isFocused) return DesignTokens.colors.primary[600];
    return DesignTokens.colors.neutral[400];
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            error && styles.labelError,
          ]}
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          variantStyles[variant],
          {
            paddingHorizontal: sizeConfig[size].padding,
            paddingVertical: sizeConfig[size].padding,
          },
          animatedBorderStyle,
          error && styles.inputContainerError,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={sizeConfig[size].iconSize}
            color={getIconColor()}
            style={styles.leftIcon}
          />
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              fontSize: sizeConfig[size].fontSize,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={DesignTokens.colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          maxLength={maxLength}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
            activeOpacity={0.6}
          >
            <Ionicons
              name={rightIcon}
              size={sizeConfig[size].iconSize}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Footer: Helper Text / Error / Char Count */}
      <View style={styles.footer}>
        <View style={styles.helperContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={14}
                color={DesignTokens.colors.error.main}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {helperText && !error && (
            <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>

        {/* Character Count */}
        {showCharCount && maxLength && (
          <Text
            style={[
              styles.charCount,
              value.length >= maxLength && styles.charCountLimit,
            ]}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing[4],
  },

  // Label
  label: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.neutral[700],
    marginBottom: DesignTokens.spacing[2],
  },
  labelFocused: {
    color: DesignTokens.colors.primary[600],
  },
  labelError: {
    color: DesignTokens.colors.error.main,
  },
  required: {
    color: DesignTokens.colors.error.main,
  },

  // Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: DesignTokens.borderRadius.base,
    backgroundColor: DesignTokens.colors.neutral[0],
  },
  inputContainerError: {
    borderColor: DesignTokens.colors.error.main,
  },

  // Icons
  leftIcon: {
    marginRight: DesignTokens.spacing[2],
  },
  rightIconContainer: {
    marginLeft: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[1],
  },

  // Input
  input: {
    flex: 1,
    color: DesignTokens.colors.neutral[900],
    paddingVertical: 0, // Evita padding extra en Android
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    marginRight: 0,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: DesignTokens.spacing[2],
  },
  helperContainer: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  errorIcon: {
    marginRight: DesignTokens.spacing[1],
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.error.main,
    flex: 1,
  },
  helperText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.neutral[500],
  },
  charCount: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.neutral[500],
    marginLeft: DesignTokens.spacing[2],
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  charCountLimit: {
    color: DesignTokens.colors.error.main,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});

// Variantes de estilo
const variantStyles = StyleSheet.create({
  default: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[300],
  },
  filled: {
    backgroundColor: DesignTokens.colors.neutral[100],
    borderWidth: 0,
  },
  underlined: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
});

// ==================== EXPORTACIONES ====================

export default InputEnhanced;

// Ejemplo de uso en comentarios JSDoc
/**
 * @example
 * // Input básico con label e icono
 * <InputEnhanced
 *   label="Email"
 *   placeholder="tu@email.com"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   leftIcon="mail-outline"
 *   required
 * />
 *
 * @example
 * // Password con toggle visibility
 * <InputEnhanced
 *   label="Contraseña"
 *   placeholder="••••••••"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry={!showPassword}
 *   leftIcon="lock-closed-outline"
 *   rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
 *   onRightIconPress={() => setShowPassword(!showPassword)}
 *   error={passwordError}
 * />
 *
 * @example
 * // Input con contador de caracteres
 * <InputEnhanced
 *   label="Descripción"
 *   placeholder="Escribe aquí..."
 *   value={description}
 *   onChangeText={setDescription}
 *   multiline
 *   numberOfLines={4}
 *   maxLength={200}
 *   showCharCount
 *   helperText="Máximo 200 caracteres"
 * />
 *
 * @example
 * // Input variant filled con búsqueda
 * <InputEnhanced
 *   label="Buscar"
 *   placeholder="Buscar encuestas..."
 *   value={search}
 *   onChangeText={setSearch}
 *   variant="filled"
 *   leftIcon="search-outline"
 *   rightIcon="close-circle"
 *   onRightIconPress={() => setSearch('')}
 * />
 */
