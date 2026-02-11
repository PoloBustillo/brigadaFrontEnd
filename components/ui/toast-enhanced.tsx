/**
 * 🎨 Toast Enhanced - Brigada Digital
 * Sistema de notificaciones toast con animaciones y variantes
 */

import { DesignTokens } from "@/constants/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TOAST_WIDTH = SCREEN_WIDTH - 40; // Más ancho (antes era -32)

interface ToastProps {
  id: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
  onDismiss: (id: string) => void;
}

export function Toast({
  id,
  message,
  variant = "info",
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const handleDismiss = React.useCallback(() => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)(id);
    });
  }, [translateY, opacity, onDismiss, id]);

  useEffect(() => {
    // Entrada
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getVariantConfig = () => {
    const configs = {
      success: {
        backgroundColor: DesignTokens.colors.success.main,
        icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
      },
      error: {
        backgroundColor: DesignTokens.colors.error.main,
        icon: "close-circle" as keyof typeof Ionicons.glyphMap,
      },
      warning: {
        backgroundColor: DesignTokens.colors.warning.main,
        icon: "warning" as keyof typeof Ionicons.glyphMap,
      },
      info: {
        backgroundColor: DesignTokens.colors.info.main,
        icon: "information-circle" as keyof typeof Ionicons.glyphMap,
      },
    };

    return configs[variant];
  };

  const config = getVariantConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          width: TOAST_WIDTH,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={config.icon}
          size={24}
          color={DesignTokens.colors.neutral[0]}
        />
      </View>

      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>

      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="close"
          size={20}
          color={DesignTokens.colors.neutral[0]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[4], // Más alto (antes era spacing[3])
    borderRadius: DesignTokens.borderRadius.lg,
    ...DesignTokens.shadows.lg,
    marginHorizontal: DesignTokens.spacing[5], // Más margen
    marginTop:
      Platform.OS === "ios"
        ? DesignTokens.spacing[12]
        : DesignTokens.spacing[8],
    minHeight: 64, // Altura mínima para mejor legibilidad
  },
  iconContainer: {
    marginRight: DesignTokens.spacing[3],
  },
  message: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base, // Más grande (antes era sm)
    fontWeight: DesignTokens.typography.fontWeight.semibold, // Más bold
    color: DesignTokens.colors.neutral[0],
    lineHeight: 20, // Mayor altura de línea
  },
  closeButton: {
    marginLeft: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[1],
  },
});

// ==================== TOAST MANAGER ====================

interface ToastItem {
  id: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
}

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<(toasts: ToastItem[]) => void> = new Set();

  show(message: string, options?: Omit<ToastItem, "id" | "message">) {
    const toast: ToastItem = {
      id: Date.now().toString(),
      message,
      ...options,
    };

    this.toasts = [toast, ...this.toasts];
    this.notifyListeners();
  }

  success(message: string, duration?: number) {
    this.show(message, { variant: "success", duration });
  }

  error(message: string, duration?: number) {
    this.show(message, { variant: "error", duration });
  }

  warning(message: string, duration?: number) {
    this.show(message, { variant: "warning", duration });
  }

  info(message: string, duration?: number) {
    this.show(message, { variant: "info", duration });
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notifyListeners();
  }

  dismissAll() {
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: ToastItem[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

export const toastManager = new ToastManager();

// ==================== TOAST CONTAINER ====================

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={containerStyles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onDismiss={toastManager.dismiss.bind(toastManager)}
        />
      ))}
    </View>
  );
}

const containerStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: DesignTokens.zIndex.toast,
  },
});

// ==================== EXPORTACIONES ====================

export default ToastContainer;

/**
 * @example
 * // En tu componente raíz (_layout.tsx)
 * import { ToastContainer } from '@/components/ui/toast-enhanced';
 *
 * export default function RootLayout() {
 *   return (
 *     <>
 *       <Stack />
 *       <ToastContainer />
 *     </>
 *   );
 * }
 *
 * @example
 * // Uso en cualquier componente
 * import { toastManager } from '@/components/ui/toast-enhanced';
 *
 * // Toast básico
 * toastManager.success('Operación exitosa');
 * toastManager.error('Algo salió mal');
 * toastManager.warning('Ten cuidado');
 * toastManager.info('Información importante');
 *
 * // Toast con duración personalizada
 * toastManager.success('Guardado exitoso', 5000);
 */
