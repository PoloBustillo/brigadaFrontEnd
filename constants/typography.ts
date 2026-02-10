/**
 * Brigada Digital - Typography System
 * Consistent text styles across the application
 */

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },

  // Body Text
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400" as const,
    lineHeight: 26,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },

  // Button Text
  button: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 20,
  },

  // Input Text
  input: {
    fontSize: 17, // Important: prevents zoom on iOS
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  helper: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },

  // Logo
  logo: {
    fontSize: 52,
    fontWeight: "400" as const,
    fontFamily: "Pacifico",
  },
};

export type TypographyStyle = keyof typeof typography;
