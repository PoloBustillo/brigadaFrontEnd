# 🎨 Propuestas de Mejoras UI/UX - Brigada Digital (2026)

## 📋 Índice

1. [Sistema de Design Tokens](#sistema-de-design-tokens)
2. [Componentes UI Mejorados](#componentes-ui-mejorados)
3. [Animaciones y Micro-interacciones](#animaciones)
4. [Accesibilidad](#accesibilidad)
5. [Temas y Modo Oscuro](#temas)
6. [Feedback Visual](#feedback-visual)
7. [Navegación y Gestos](#navegacion)
8. [Empty States y Placeholders](#empty-states)
9. [Mejoras por Pantalla](#mejoras-por-pantalla)

---

## 🎨 1. Sistema de Design Tokens

### Problema Actual

- Colores hard-coded en cada componente
- Inconsistencias en spacing, borders, shadows
- Difícil mantener consistencia visual

### Solución: Sistema de Tokens Centralizado

```typescript
// constants/design-tokens.ts
export const DesignTokens = {
  // Colores principales
  colors: {
    // Primarios
    primary: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6", // Principal
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
    },

    // Secundarios (Brigada Red)
    secondary: {
      50: "#FEF2F2",
      100: "#FEE2E2",
      200: "#FECACA",
      300: "#FCA5A5",
      400: "#F87171",
      500: "#EF4444",
      600: "#DC2626", // Brigada Red
      700: "#B91C1C",
      800: "#991B1B",
      900: "#7F1D1D",
    },

    // Estados
    success: {
      light: "#D1FAE5",
      main: "#10B981",
      dark: "#065F46",
    },
    warning: {
      light: "#FEF3C7",
      main: "#F59E0B",
      dark: "#92400E",
    },
    error: {
      light: "#FEE2E2",
      main: "#EF4444",
      dark: "#991B1B",
    },
    info: {
      light: "#DBEAFE",
      main: "#3B82F6",
      dark: "#1E40AF",
    },

    // Neutrales
    neutral: {
      0: "#FFFFFF",
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
      950: "#030712",
    },

    // Gradientes
    gradients: {
      primary: ["#3B82F6", "#2563EB"],
      secondary: ["#EF4444", "#DC2626"],
      sunset: ["#F59E0B", "#EF4444"],
      ocean: ["#0EA5E9", "#3B82F6"],
      forest: ["#10B981", "#059669"],
    },
  },

  // Espaciado (basado en 4px)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  // Tipografía
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
      "5xl": 48,
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
    },
  },

  // Bordes
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  borderWidth: {
    none: 0,
    thin: 1,
    base: 1.5,
    thick: 2,
    heavy: 3,
  },

  // Sombras
  shadows: {
    none: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Animaciones
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
    },
    easing: {
      linear: [0, 0, 1, 1],
      easeIn: [0.42, 0, 1, 1],
      easeOut: [0, 0, 0.58, 1],
      easeInOut: [0.42, 0, 0.58, 1],
      spring: [0.34, 1.56, 0.64, 1],
    },
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    popover: 1100,
    toast: 1200,
    tooltip: 1300,
  },
};

// Hook para usar design tokens
export function useDesignTokens() {
  return DesignTokens;
}
```

**Uso:**

```typescript
import { DesignTokens } from "@/constants/design-tokens";

const styles = StyleSheet.create({
  container: {
    padding: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.neutral[50],
    borderRadius: DesignTokens.borderRadius.base,
    ...DesignTokens.shadows.sm,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.neutral[900],
  },
});
```

**Beneficios:**

- ✅ Consistencia visual en toda la app
- ✅ Fácil cambiar toda la paleta de colores
- ✅ Mejor colaboración diseño-desarrollo
- ✅ Facilita implementación de modo oscuro

---

## 🧩 2. Componentes UI Mejorados

### 2.1 Botón con Variantes Extendidas

```typescript
// components/ui/button-enhanced.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/design-tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  haptic?: boolean;
  rounded?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ButtonEnhanced({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  haptic = true,
  rounded = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (haptic) {
      // Haptic feedback
    }
    onPress();
  };

  const isDisabled = disabled || loading;
  const isGradient = variant === 'gradient';

  const renderContent = () => (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={sizeConfig[size].iconSize}
          color={getIconColor(variant)}
          style={styles.iconLeft}
        />
      )}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoadingColor(variant)}
        />
      ) : (
        <Text style={[styles.text, textStyles[variant], textStyles[size]]}>
          {title}
        </Text>
      )}
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={sizeConfig[size].iconSize}
          color={getIconColor(variant)}
          style={styles.iconRight}
        />
      )}
    </View>
  );

  if (isGradient && !isDisabled) {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[animatedStyle, fullWidth && styles.fullWidth]}
      >
        <LinearGradient
          colors={DesignTokens.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            styles[size],
            rounded && styles.rounded,
            isDisabled && styles.disabled,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        rounded && styles.rounded,
        isDisabled && styles.disabled,
      ]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
}

const sizeConfig = {
  xs: { iconSize: 14, padding: DesignTokens.spacing[2] },
  sm: { iconSize: 16, padding: DesignTokens.spacing[3] },
  md: { iconSize: 18, padding: DesignTokens.spacing[4] },
  lg: { iconSize: 20, padding: DesignTokens.spacing[5] },
  xl: { iconSize: 24, padding: DesignTokens.spacing[6] },
};

const getIconColor = (variant: string) => {
  switch (variant) {
    case 'outline':
    case 'ghost':
      return DesignTokens.colors.primary[600];
    default:
      return DesignTokens.colors.neutral[0];
  }
};

const getLoadingColor = (variant: string) => {
  switch (variant) {
    case 'outline':
    case 'ghost':
      return DesignTokens.colors.primary[600];
    default:
      return DesignTokens.colors.neutral[0];
  }
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.borderRadius.base,
  },
  fullWidth: {
    width: '100%',
  },
  rounded: {
    borderRadius: DesignTokens.borderRadius.full,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: DesignTokens.spacing[2],
  },
  iconRight: {
    marginLeft: DesignTokens.spacing[2],
  },

  // Variants
  primary: {
    backgroundColor: DesignTokens.colors.primary[600],
  },
  secondary: {
    backgroundColor: DesignTokens.colors.secondary[600],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: DesignTokens.borderWidth.base,
    borderColor: DesignTokens.colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: DesignTokens.colors.error.main,
  },

  // Sizes
  xs: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[1],
  },
  sm: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
  },
  md: {
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[3],
  },
  lg: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
  },
  xl: {
    paddingHorizontal: DesignTokens.spacing[8],
    paddingVertical: DesignTokens.spacing[5],
  },

  text: {
    fontWeight: '600',
  },
});

const textStyles = StyleSheet.create({
  // Variant text colors
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

  // Size text
  xs: {
    fontSize: DesignTokens.typography.fontSize.xs,
  },
  sm: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  md: {
    fontSize: DesignTokens.typography.fontSize.base,
  },
  lg: {
    fontSize: DesignTokens.typography.fontSize.lg,
  },
  xl: {
    fontSize: DesignTokens.typography.fontSize.xl,
  },
});
```

**Ejemplos de uso:**

```typescript
// Botón primary con icono
<ButtonEnhanced
  title="Iniciar Sesión"
  onPress={handleLogin}
  icon="log-in-outline"
  iconPosition="left"
  variant="primary"
  size="lg"
  fullWidth
/>

// Botón con gradiente
<ButtonEnhanced
  title="Continuar"
  onPress={handleContinue}
  variant="gradient"
  size="lg"
  icon="arrow-forward"
  iconPosition="right"
  rounded
/>

// Botón outline pequeño
<ButtonEnhanced
  title="Cancelar"
  onPress={handleCancel}
  variant="outline"
  size="sm"
/>

// Botón con loading
<ButtonEnhanced
  title="Guardando..."
  onPress={handleSave}
  loading={isSaving}
  variant="primary"
/>
```

---

### 2.2 Input con Estados Visuales Mejorados

```typescript
// components/ui/input-enhanced.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/design-tokens';

interface InputEnhancedProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  showCharCount?: boolean;
  maxLength?: number;
}

export function InputEnhanced({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  showCharCount = false,
  maxLength,
  value = '',
  style,
  ...props
}: InputEnhancedProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      error
        ? DesignTokens.colors.error.main
        : focusAnim.value === 1
        ? DesignTokens.colors.primary[600]
        : DesignTokens.colors.neutral[300],
      { duration: 200 }
    ),
    borderWidth: focusAnim.value === 1 ? 2 : 1,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    focusAnim.value = 1;
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnim.value = 0;
  };

  return (
    <View style={styles.container}>
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
          styles[`${variant}Container`],
          styles[`${size}Container`],
          animatedBorderStyle,
          error && styles.inputContainerError,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              error
                ? DesignTokens.colors.error.main
                : isFocused
                ? DesignTokens.colors.primary[600]
                : DesignTokens.colors.neutral[400]
            }
            style={styles.leftIcon}
          />
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            styles[`${size}Input`],
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
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={
                error
                  ? DesignTokens.colors.error.main
                  : isFocused
                  ? DesignTokens.colors.primary[600]
                  : DesignTokens.colors.neutral[400]
              }
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Helper/Error Text */}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing[4],
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DesignTokens.borderRadius.base,
  },
  defaultContainer: {
    backgroundColor: DesignTokens.colors.neutral[0],
    borderWidth: 1,
    borderColor: DesignTokens.colors.neutral[300],
  },
  filledContainer: {
    backgroundColor: DesignTokens.colors.neutral[100],
    borderWidth: 0,
  },
  underlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  inputContainerError: {
    borderColor: DesignTokens.colors.error.main,
  },

  // Sizes
  smContainer: {
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
  },
  mdContainer: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
  },
  lgContainer: {
    paddingHorizontal: DesignTokens.spacing[5],
    paddingVertical: DesignTokens.spacing[4],
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
    fontSize: DesignTokens.typography.fontSize.base,
  },
  smInput: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  mdInput: {
    fontSize: DesignTokens.typography.fontSize.base,
  },
  lgInput: {
    fontSize: DesignTokens.typography.fontSize.lg,
  },
  inputWithLeftIcon: {
    marginLeft: 0,
  },
  inputWithRightIcon: {
    marginRight: 0,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: DesignTokens.spacing[2],
  },
  helperContainer: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  charCountLimit: {
    color: DesignTokens.colors.error.main,
    fontWeight: '600',
  },
});
```

**Ejemplos de uso:**

```typescript
// Input básico con label
<InputEnhanced
  label="Email"
  placeholder="tu@email.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  leftIcon="mail-outline"
  required
/>

// Password con toggle visibility
<InputEnhanced
  label="Contraseña"
  placeholder="••••••••"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  leftIcon="lock-closed-outline"
  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
  onRightIconPress={() => setShowPassword(!showPassword)}
  error={passwordError}
/>

// Input con contador de caracteres
<InputEnhanced
  label="Descripción"
  placeholder="Escribe aquí..."
  value={description}
  onChangeText={setDescription}
  multiline
  numberOfLines={4}
  maxLength={200}
  showCharCount
  helperText="Máximo 200 caracteres"
/>

// Input variant filled
<InputEnhanced
  label="Buscar"
  placeholder="Buscar encuestas..."
  value={search}
  onChangeText={setSearch}
  variant="filled"
  leftIcon="search-outline"
  rightIcon="close-circle"
  onRightIconPress={() => setSearch('')}
/>
```

---

### 2.3 Card Component Mejorado

```typescript
// components/ui/card.tsx
import React, { ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/design-tokens';

interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  pressable?: boolean;
  onPress?: () => void;
  padding?: keyof typeof DesignTokens.spacing;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export function Card({
  children,
  variant = 'elevated',
  pressable = false,
  onPress,
  padding = 4,
  style,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1);
    }
  };

  const containerStyle = [
    styles.base,
    styles[variant],
    { padding: DesignTokens.spacing[padding] },
    style,
  ];

  if (pressable && onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[animatedStyle, containerStyle]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedView style={[animatedStyle, containerStyle]}>
      {children}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.borderRadius.md,
    backgroundColor: DesignTokens.colors.neutral[0],
  },
  elevated: {
    ...DesignTokens.shadows.md,
  },
  outlined: {
    borderWidth: DesignTokens.borderWidth.thin,
    borderColor: DesignTokens.colors.neutral[200],
  },
  filled: {
    backgroundColor: DesignTokens.colors.neutral[50],
  },
});

// Subcomponentes
export function CardHeader({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardBody({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

export function CardFooter({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const subStyles = StyleSheet.create({
  header: {
    marginBottom: DesignTokens.spacing[3],
  },
  body: {
    flex: 1,
  },
  footer: {
    marginTop: DesignTokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.neutral[200],
    paddingTop: DesignTokens.spacing[3],
  },
});
```

---

## ✨ 3. Animaciones y Micro-interacciones

### 3.1 Skeleton Loader

```typescript
// components/ui/skeleton.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/design-tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = DesignTokens.borderRadius.base,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton presets
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={16}
          style={styles.textLine}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={60} height={60} borderRadius={DesignTokens.borderRadius.full} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: DesignTokens.colors.neutral[200],
  },
  textContainer: {
    width: '100%',
  },
  textLine: {
    marginBottom: DesignTokens.spacing[2],
  },
  card: {
    flexDirection: 'row',
    padding: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.neutral[0],
    borderRadius: DesignTokens.borderRadius.md,
    ...DesignTokens.shadows.sm,
  },
  cardContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing[4],
  },
});
```

---

### 3.2 Pull to Refresh Custom

```typescript
// components/ui/pull-to-refresh.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DesignTokens } from '@/constants/design-tokens';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshing,
}: PullToRefreshProps) {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  React.useEffect(() => {
    if (refreshing) {
      rotation.value = withSpring(360, {}, () => {
        rotation.value = 0;
      });
    }
  }, [refreshing]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DesignTokens.colors.primary[600]}
          colors={[DesignTokens.colors.primary[600]]}
          progressViewOffset={20}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
```

---

## ♿ 4. Accesibilidad

### 4.1 Mejoras de Accesibilidad

```typescript
// components/ui/accessible-button.tsx
import React from 'react';
import { AccessibilityRole, TouchableOpacity, Text } from 'react-native';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

export function AccessibleButton({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
}: AccessibleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

---

## 🌙 5. Temas y Modo Oscuro

```typescript
// constants/themes.ts
export const LightTheme = {
  name: "light",
  colors: {
    background: "#FFFFFF",
    surface: "#F9FAFB",
    primary: "#3B82F6",
    secondary: "#DC2626",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
};

export const DarkTheme = {
  name: "dark",
  colors: {
    background: "#111827",
    surface: "#1F2937",
    primary: "#60A5FA",
    secondary: "#F87171",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
    error: "#F87171",
    success: "#34D399",
    warning: "#FBBF24",
  },
};

// Hook para usar tema
import { useColorScheme } from "react-native";

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? DarkTheme : LightTheme;
}
```

---

## 📱 6. Feedback Visual Mejorado

### 6.1 Toast System Avanzado

```typescript
// components/ui/toast-config.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { DesignTokens } from '@/constants/design-tokens';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={DesignTokens.colors.success.main}
          />
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="alert-circle"
            size={24}
            color={DesignTokens.colors.error.main}
          />
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="information-circle"
            size={24}
            color={DesignTokens.colors.info.main}
          />
        </View>
      )}
    />
  ),
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={styles.warningToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="warning"
            size={24}
            color={DesignTokens.colors.warning.main}
          />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: DesignTokens.colors.success.main,
    borderLeftWidth: 5,
    backgroundColor: DesignTokens.colors.success.light,
    ...DesignTokens.shadows.md,
  },
  errorToast: {
    borderLeftColor: DesignTokens.colors.error.main,
    borderLeftWidth: 5,
    backgroundColor: DesignTokens.colors.error.light,
    ...DesignTokens.shadows.md,
  },
  infoToast: {
    borderLeftColor: DesignTokens.colors.info.main,
    borderLeftWidth: 5,
    backgroundColor: DesignTokens.colors.info.light,
    ...DesignTokens.shadows.md,
  },
  warningToast: {
    borderLeftColor: DesignTokens.colors.warning.main,
    borderLeftWidth: 5,
    backgroundColor: DesignTokens.colors.warning.light,
    ...DesignTokens.shadows.md,
  },
  contentContainer: {
    paddingHorizontal: DesignTokens.spacing[4],
  },
  iconContainer: {
    justifyContent: 'center',
    paddingLeft: DesignTokens.spacing[4],
  },
  text1: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: '600',
    color: DesignTokens.colors.neutral[900],
  },
  text2: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.neutral[700],
  },
});
```

---

## 🎯 7. Empty States

```typescript
// components/ui/empty-state.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ButtonEnhanced } from './button-enhanced';
import { DesignTokens } from '@/constants/design-tokens';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={80}
          color={DesignTokens.colors.neutral[300]}
        />
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {actionLabel && onAction && (
        <ButtonEnhanced
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing[8],
  },
  iconContainer: {
    marginBottom: DesignTokens.spacing[6],
  },
  title: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: '700',
    color: DesignTokens.colors.neutral[900],
    textAlign: 'center',
    marginBottom: DesignTokens.spacing[3],
  },
  description: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.neutral[600],
    textAlign: 'center',
    marginBottom: DesignTokens.spacing[6],
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
});
```

---

## 📊 Resumen de Mejoras UI

### Prioridad Alta (Implementar Ya)

1. ✅ Design Tokens System (4-6h)
2. ✅ Button Enhanced Component (2-3h)
3. ✅ Input Enhanced Component (3-4h)
4. ✅ Toast System Mejorado (1-2h)

### Prioridad Media

5. ✅ Card Component (2h)
6. ✅ Skeleton Loaders (1-2h)
7. ✅ Empty States (1h)
8. ✅ Accesibilidad (2-3h)

### Prioridad Baja

9. ✅ Dark Mode (4-6h)
10. ✅ Animaciones avanzadas (3-4h)

**Esfuerzo Total Estimado:** 24-35 horas

---

**Fecha:** Febrero 10, 2026  
**Versión:** 1.0  
**Documento:** Propuestas UI/UX Brigada Digital
