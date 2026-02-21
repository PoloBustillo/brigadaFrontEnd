/**
 * Color Schemes System
 * Multiple color schemes that users can choose from
 */

export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceVariant: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border colors
  border: string;
  borderLight: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Overlay
  overlay: string;
  backdrop: string;
}

// 🌸 Rosa Vibrante (Default)
const pinkScheme: ColorScheme = {
  id: "pink",
  name: "Rosa Vibrante",
  description: "Esquema original rosa enérgico",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#FFF5F8",
    surface: "#FAFAFA",
    surfaceVariant: "#FFE8F0",

    text: "#FF1B8D",
    textSecondary: "#FF4DA6",
    textTertiary: "#FF6BB8",

    border: "#FFD6E8",
    borderLight: "#FFE8F0",

    primary: "#FF1B8D",
    primaryLight: "#FFE8F0",
    primaryDark: "#CC1670",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(255, 27, 141, 0.15)",
    backdrop: "rgba(255, 27, 141, 0.1)",
  },
  dark: {
    // Neutral dark backgrounds — pink is used only as the accent colour
    background: "#121212",
    backgroundSecondary: "#1C0F15",
    surface: "#1E1619",
    surfaceVariant: "#2A1E25",

    text: "#FFFFFF",
    textSecondary: "#FFAAD4",
    textTertiary: "#FF85BE",

    border: "rgba(255, 27, 141, 0.2)",
    borderLight: "rgba(255, 27, 141, 0.1)",

    primary: "#FF1B8D",
    primaryLight: "#FF85BE",
    primaryDark: "#CC1670",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(255, 27, 141, 0.3)",
    backdrop: "rgba(0, 0, 0, 0.85)",
  },
};

// 🔵 Azul Profesional
const blueScheme: ColorScheme = {
  id: "blue",
  name: "Azul Profesional",
  description: "Elegante y corporativo",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F0F9FF",
    surface: "#FAFAFA",
    surfaceVariant: "#E0F2FE",

    text: "#0C4A6E",
    textSecondary: "#0369A1",
    textTertiary: "#0284C7",

    border: "#BAE6FD",
    borderLight: "#E0F2FE",

    primary: "#0284C7",
    primaryLight: "#E0F2FE",
    primaryDark: "#075985",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(2, 132, 199, 0.15)",
    backdrop: "rgba(2, 132, 199, 0.1)",
  },
  dark: {
    background: "#0C4A6E",
    backgroundSecondary: "#075985",
    surface: "#164E63",
    surfaceVariant: "#0369A1",

    text: "#FFFFFF",
    textSecondary: "#E0F2FE",
    textTertiary: "#BAE6FD",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#E0F2FE",
    primaryDark: "#F0F0F0",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(12, 74, 110, 0.45)",
    backdrop: "rgba(12, 74, 110, 0.9)",
  },
};

// 🟣 Púrpura Moderno
const purpleScheme: ColorScheme = {
  id: "purple",
  name: "Púrpura Moderno",
  description: "Creativo y sofisticado",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#FAF5FF",
    surface: "#FAFAFA",
    surfaceVariant: "#F3E8FF",

    text: "#6B21A8",
    textSecondary: "#7C3AED",
    textTertiary: "#8B5CF6",

    border: "#DDD6FE",
    borderLight: "#F3E8FF",

    primary: "#7C3AED",
    primaryLight: "#F3E8FF",
    primaryDark: "#5B21B6",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(124, 58, 237, 0.15)",
    backdrop: "rgba(124, 58, 237, 0.1)",
  },
  dark: {
    background: "#6B21A8",
    backgroundSecondary: "#7C3AED",
    surface: "#5B21B6",
    surfaceVariant: "#6D28D9",

    text: "#FFFFFF",
    textSecondary: "#F3E8FF",
    textTertiary: "#DDD6FE",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#F3E8FF",
    primaryDark: "#F0F0F0",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(107, 33, 168, 0.45)",
    backdrop: "rgba(107, 33, 168, 0.9)",
  },
};

// 🟢 Verde Natural
const greenScheme: ColorScheme = {
  id: "green",
  name: "Verde Natural",
  description: "Fresco y orgánico",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F0FDF4",
    surface: "#FAFAFA",
    surfaceVariant: "#DCFCE7",

    text: "#14532D",
    textSecondary: "#15803D",
    textTertiary: "#16A34A",

    border: "#BBF7D0",
    borderLight: "#DCFCE7",

    primary: "#16A34A",
    primaryLight: "#DCFCE7",
    primaryDark: "#15803D",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(22, 163, 74, 0.15)",
    backdrop: "rgba(22, 163, 74, 0.1)",
  },
  dark: {
    background: "#14532D",
    backgroundSecondary: "#15803D",
    surface: "#166534",
    surfaceVariant: "#16A34A",

    text: "#FFFFFF",
    textSecondary: "#DCFCE7",
    textTertiary: "#BBF7D0",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#DCFCE7",
    primaryDark: "#F0F0F0",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(20, 83, 45, 0.45)",
    backdrop: "rgba(20, 83, 45, 0.9)",
  },
};

// 🟠 Naranja Cálido
const orangeScheme: ColorScheme = {
  id: "orange",
  name: "Naranja Cálido",
  description: "Energético y acogedor",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#FFF7ED",
    surface: "#FAFAFA",
    surfaceVariant: "#FFEDD5",

    text: "#7C2D12",
    textSecondary: "#C2410C",
    textTertiary: "#EA580C",

    border: "#FED7AA",
    borderLight: "#FFEDD5",

    primary: "#EA580C",
    primaryLight: "#FFEDD5",
    primaryDark: "#C2410C",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(234, 88, 12, 0.15)",
    backdrop: "rgba(234, 88, 12, 0.1)",
  },
  dark: {
    background: "#7C2D12",
    backgroundSecondary: "#9A3412",
    surface: "#C2410C",
    surfaceVariant: "#EA580C",

    text: "#FFFFFF",
    textSecondary: "#FFEDD5",
    textTertiary: "#FED7AA",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#FFEDD5",
    primaryDark: "#F0F0F0",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(124, 45, 18, 0.45)",
    backdrop: "rgba(124, 45, 18, 0.9)",
  },
};

// 🔴 Rojo Intenso
const redScheme: ColorScheme = {
  id: "red",
  name: "Rojo Intenso",
  description: "Poderoso y apasionado",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#FEF2F2",
    surface: "#FAFAFA",
    surfaceVariant: "#FEE2E2",

    text: "#7F1D1D",
    textSecondary: "#B91C1C",
    textTertiary: "#DC2626",

    border: "#FECACA",
    borderLight: "#FEE2E2",

    primary: "#DC2626",
    primaryLight: "#FEE2E2",
    primaryDark: "#B91C1C",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(220, 38, 38, 0.15)",
    backdrop: "rgba(220, 38, 38, 0.1)",
  },
  dark: {
    background: "#7F1D1D",
    backgroundSecondary: "#991B1B",
    surface: "#B91C1C",
    surfaceVariant: "#DC2626",

    text: "#FFFFFF",
    textSecondary: "#FEE2E2",
    textTertiary: "#FECACA",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#FEE2E2",
    primaryDark: "#F0F0F0",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(127, 29, 29, 0.45)",
    backdrop: "rgba(127, 29, 29, 0.9)",
  },
};

// ⚫ Oscuro Elegante
const darkElegantScheme: ColorScheme = {
  id: "darkElegant",
  name: "Oscuro Elegante",
  description: "Minimalista y sofisticado",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    surface: "#F3F4F6",
    surfaceVariant: "#E5E7EB",

    text: "#111827",
    textSecondary: "#374151",
    textTertiary: "#6B7280",

    border: "#D1D5DB",
    borderLight: "#E5E7EB",

    primary: "#111827",
    primaryLight: "#E5E7EB",
    primaryDark: "#030712",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(17, 24, 39, 0.15)",
    backdrop: "rgba(17, 24, 39, 0.1)",
  },
  dark: {
    background: "#111827",
    backgroundSecondary: "#1F2937",
    surface: "#374151",
    surfaceVariant: "#4B5563",

    text: "#FFFFFF",
    textSecondary: "#E5E7EB",
    textTertiary: "#D1D5DB",

    border: "#6B7280",
    borderLight: "rgba(255, 255, 255, 0.2)",

    primary: "#FFFFFF",
    primaryLight: "#E5E7EB",
    primaryDark: "#F9FAFB",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(17, 24, 39, 0.6)",
    backdrop: "rgba(17, 24, 39, 0.95)",
  },
};

// 🔷 Índigo Corporativo
const indigoScheme: ColorScheme = {
  id: "indigo",
  name: "Índigo Corporativo",
  description: "Profesional y confiable",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F0F4F8",
    surface: "#FAFAFA",
    surfaceVariant: "#E0E7FF",

    text: "#312E81",
    textSecondary: "#4338CA",
    textTertiary: "#6366F1",

    border: "#C7D2FE",
    borderLight: "#E0E7FF",

    primary: "#4F46E5",
    primaryLight: "#E0E7FF",
    primaryDark: "#3730A3",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(79, 70, 229, 0.15)",
    backdrop: "rgba(79, 70, 229, 0.1)",
  },
  dark: {
    background: "#312E81",
    backgroundSecondary: "#4338CA",
    surface: "#3730A3",
    surfaceVariant: "#4F46E5",

    text: "#FFFFFF",
    textSecondary: "#E0E7FF",
    textTertiary: "#C7D2FE",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#E0E7FF",
    primaryDark: "#F5F7FA",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(49, 46, 129, 0.45)",
    backdrop: "rgba(49, 46, 129, 0.9)",
  },
};

// 🌊 Aguamarina Premium
const tealScheme: ColorScheme = {
  id: "teal",
  name: "Aguamarina Premium",
  description: "Fresco y moderno",
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F0FDFA",
    surface: "#FAFAFA",
    surfaceVariant: "#CCFBF1",

    text: "#115E59",
    textSecondary: "#0F766E",
    textTertiary: "#14B8A6",

    border: "#99F6E4",
    borderLight: "#CCFBF1",

    primary: "#14B8A6",
    primaryLight: "#CCFBF1",
    primaryDark: "#0F766E",

    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    overlay: "rgba(20, 184, 166, 0.15)",
    backdrop: "rgba(20, 184, 166, 0.1)",
  },
  dark: {
    background: "#115E59",
    backgroundSecondary: "#0F766E",
    surface: "#134E4A",
    surfaceVariant: "#14B8A6",

    text: "#FFFFFF",
    textSecondary: "#CCFBF1",
    textTertiary: "#99F6E4",

    border: "#FFFFFF",
    borderLight: "rgba(255, 255, 255, 0.3)",

    primary: "#FFFFFF",
    primaryLight: "#CCFBF1",
    primaryDark: "#F0F9FF",

    success: "#34D399",
    warning: "#FBBF24",
    error: "#FCA5A5",
    info: "#93C5FD",

    overlay: "rgba(17, 94, 89, 0.45)",
    backdrop: "rgba(17, 94, 89, 0.9)",
  },
};

// Export all schemes
export const colorSchemes: ColorScheme[] = [
  pinkScheme,
  blueScheme,
  purpleScheme,
  greenScheme,
  orangeScheme,
  redScheme,
  darkElegantScheme,
  indigoScheme,
  tealScheme,
];

// Helper to get scheme by id
export const getColorScheme = (id: string): ColorScheme | undefined => {
  return colorSchemes.find((scheme) => scheme.id === id);
};

// Default scheme
export const defaultScheme = pinkScheme;
