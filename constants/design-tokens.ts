/**
 * 🎨 Design Tokens System - Brigada Digital
 * Sistema centralizado de tokens de diseño para mantener consistencia visual
 */

export const DesignTokens = {
  // ==================== COLORES ====================
  colors: {
    // Primarios (Azul)
    primary: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB", // Principal
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
      contrast: "#FFFFFF",
    },
    warning: {
      light: "#FEF3C7",
      main: "#F59E0B",
      dark: "#92400E",
      contrast: "#FFFFFF",
    },
    error: {
      light: "#FEE2E2",
      main: "#EF4444",
      dark: "#991B1B",
      contrast: "#FFFFFF",
    },
    info: {
      light: "#DBEAFE",
      main: "#3B82F6",
      dark: "#1E40AF",
      contrast: "#FFFFFF",
    },

    // Neutrales (Grises)
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

    // Gradientes predefinidos
    gradients: {
      primary: ["#3B82F6", "#2563EB"],
      secondary: ["#EF4444", "#DC2626"],
      sunset: ["#F59E0B", "#EF4444"],
      ocean: ["#0EA5E9", "#3B82F6"],
      forest: ["#10B981", "#059669"],
      purple: ["#A855F7", "#7C3AED"],
    },
  },

  // ==================== ESPACIADO ====================
  // Basado en múltiplos de 4px
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

  // ==================== TIPOGRAFÍA ====================
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
      "6xl": 60,
    },
    fontWeight: {
      light: "300" as const,
      normal: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
      extrabold: "800" as const,
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

  // ==================== BORDES ====================
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    full: 9999,
  },

  borderWidth: {
    none: 0,
    thin: 1,
    base: 1.5,
    thick: 2,
    heavy: 3,
  },

  // ==================== SOMBRAS ====================
  // Compatibles con iOS y Android
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
    "2xl": {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 16,
    },
  },

  // ==================== ANIMACIONES ====================
  animation: {
    duration: {
      fastest: 100,
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
      slowest: 750,
    },
    easing: {
      linear: "linear" as const,
      easeIn: "ease-in" as const,
      easeOut: "ease-out" as const,
      easeInOut: "ease-in-out" as const,
    },
  },

  // ==================== Z-INDEX ====================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    toast: 1070,
    tooltip: 1080,
  },

  // ==================== OPACIDADES ====================
  opacity: {
    disabled: 0.5,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.4,
  },
} as const;

// ==================== TIPOS ====================
export type ColorKey = keyof typeof DesignTokens.colors.primary;
export type SpacingKey = keyof typeof DesignTokens.spacing;
export type FontSizeKey = keyof typeof DesignTokens.typography.fontSize;
export type FontWeightKey = keyof typeof DesignTokens.typography.fontWeight;
export type BorderRadiusKey = keyof typeof DesignTokens.borderRadius;
export type ShadowKey = keyof typeof DesignTokens.shadows;

// ==================== UTILIDADES ====================

/**
 * Obtener color con soporte de opacidad
 * @example getColor('primary', 600, 0.5) -> '#2563EB' con 50% opacidad
 */
export function getColor(
  palette: keyof typeof DesignTokens.colors,
  shade: ColorKey | "light" | "main" | "dark" | "contrast" = 600,
  opacity?: number,
): string {
  const colors =
    DesignTokens.colors[palette as keyof typeof DesignTokens.colors];

  if (!colors) return DesignTokens.colors.neutral[500];

  const color = (colors as any)[shade];

  if (!color) return DesignTokens.colors.neutral[500];

  if (opacity !== undefined && opacity < 1) {
    // Convertir hex a rgba
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
}

/**
 * Hook personalizado para acceder a tokens de diseño
 */
export function useDesignTokens() {
  return DesignTokens;
}

/**
 * Utilidad para combinar sombras con otros estilos
 */
export function withShadow(shadowKey: ShadowKey, styles: any = {}) {
  return {
    ...styles,
    ...DesignTokens.shadows[shadowKey],
  };
}

/**
 * Utilidad para crear estilos de texto consistentes
 */
export function textStyle(
  size: FontSizeKey = "base",
  weight: FontWeightKey = "normal",
  color: string = DesignTokens.colors.neutral[900],
) {
  return {
    fontSize: DesignTokens.typography.fontSize[size],
    fontWeight: DesignTokens.typography.fontWeight[weight],
    color,
  };
}

// Exportación por defecto
export default DesignTokens;
