/**
 * Brigada Digital - Color System
 * Professional color palette for the application
 */

export const colors = {
  // Brand Colors
  primary: "#FF1B8D",
  primaryLight: "#FF6B9D",
  primaryDark: "#D01670",
  primaryGradient: ["#FF1B8D", "#FF4B7D", "#FF6B9D"],

  // Feedback Colors
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",

  // Neutral Colors
  background: "#F5F7FA",
  surface: "#FFFFFF",
  border: "#E0E4E8",
  borderLight: "#F0F0F0",

  // Text Colors
  text: "#1A1A2E",
  textSecondary: "#6C7A89",
  textDisabled: "#BDC3C7",
  textInverse: "#FFFFFF",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.5)",
  backdrop: "rgba(0, 0, 0, 0.3)",

  // Component Specific
  inputBackground: "#FFFFFF",
  buttonDisabled: "#BDC3C7",

  // Badge Colors
  successBg: "#E8F5E9",
  successText: "#2E7D32",
  errorBg: "#FFEBEE",
  errorText: "#C62828",
  warningBg: "#FFF3E0",
  warningText: "#E65100",
  infoBg: "#E3F2FD",
  infoText: "#1565C0",
  neutralBg: "#F5F5F5",
  neutralText: "#616161",
};

export type ColorName = keyof typeof colors;
