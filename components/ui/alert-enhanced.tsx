/**
 * 🎨 Alert Enhanced - Brigada Digital
 * Componente de alerta mejorado con variantes, iconos y acciones
 */

import { DesignTokens } from "@/constants/design-tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface AlertEnhancedProps {
  title?: string;
  message: string;
  variant?: "success" | "warning" | "error" | "info";
  icon?: keyof typeof Ionicons.glyphMap | boolean;
  onClose?: () => void;
  actions?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
  }[];
  style?: ViewStyle;
}

export function AlertEnhanced({
  title,
  message,
  variant = "info",
  icon = true,
  onClose,
  actions,
  style,
}: AlertEnhancedProps) {
  const getVariantConfig = () => {
    const configs = {
      success: {
        backgroundColor: DesignTokens.colors.success.light,
        borderColor: DesignTokens.colors.success.main,
        textColor: DesignTokens.colors.success.dark,
        iconName: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
        iconColor: DesignTokens.colors.success.main,
      },
      warning: {
        backgroundColor: DesignTokens.colors.warning.light,
        borderColor: DesignTokens.colors.warning.main,
        textColor: DesignTokens.colors.warning.dark,
        iconName: "warning" as keyof typeof Ionicons.glyphMap,
        iconColor: DesignTokens.colors.warning.main,
      },
      error: {
        backgroundColor: DesignTokens.colors.error.light,
        borderColor: DesignTokens.colors.error.main,
        textColor: DesignTokens.colors.error.dark,
        iconName: "close-circle" as keyof typeof Ionicons.glyphMap,
        iconColor: DesignTokens.colors.error.main,
      },
      info: {
        backgroundColor: DesignTokens.colors.info.light,
        borderColor: DesignTokens.colors.info.main,
        textColor: DesignTokens.colors.info.dark,
        iconName: "information-circle" as keyof typeof Ionicons.glyphMap,
        iconColor: DesignTokens.colors.info.main,
      },
    };

    return configs[variant];
  };

  const config = getVariantConfig();
  const showIcon = icon !== false;
  const iconName = typeof icon === "string" ? icon : config.iconName;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={24} color={config.iconColor} />
          </View>
        )}

        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: config.textColor }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={config.textColor} />
          </TouchableOpacity>
        )}
      </View>

      {actions && actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={[
                styles.actionButton,
                action.variant === "primary" && {
                  backgroundColor: config.iconColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      action.variant === "primary"
                        ? DesignTokens.colors.neutral[0]
                        : config.textColor,
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[5],
    ...DesignTokens.shadows.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: DesignTokens.spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    marginBottom: DesignTokens.spacing[2],
  },
  message: {
    fontSize: DesignTokens.typography.fontSize.sm,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[1],
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[2],
  },
  actionButton: {
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[2],
    borderRadius: DesignTokens.borderRadius.base,
    alignItems: "center",
  },
  actionText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
  },
});

// ==================== EXPORTACIONES ====================

export default AlertEnhanced;

/**
 * @example
 * // Alert básico
 * <AlertEnhanced
 *   message="Operación completada exitosamente"
 *   variant="success"
 * />
 *
 * @example
 * // Alert con título y botón cerrar
 * <AlertEnhanced
 *   title="Advertencia"
 *   message="Verifica que todos los campos estén completos"
 *   variant="warning"
 *   onClose={() => console.log('Alert closed')}
 * />
 *
 * @example
 * // Alert con acciones
 * <AlertEnhanced
 *   title="Error de conexión"
 *   message="No se pudo conectar al servidor"
 *   variant="error"
 *   actions={[
 *     { label: 'Reintentar', onPress: retry, variant: 'primary' },
 *     { label: 'Cancelar', onPress: cancel, variant: 'secondary' },
 *   ]}
 * />
 */
