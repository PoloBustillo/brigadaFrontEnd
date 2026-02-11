/**
 * 🎨 Theme Context - Brigada Digital
 * Contexto para manejar tema claro/oscuro con Design Tokens
 */

import { DesignTokens } from "@/constants/design-tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "auto";
type ActiveTheme = "light" | "dark";

interface ThemeColors {
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

interface ThemeContextType {
  theme: ActiveTheme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  background: DesignTokens.colors.neutral[0],
  backgroundSecondary: DesignTokens.colors.neutral[50],
  surface: DesignTokens.colors.neutral[0],
  surfaceVariant: DesignTokens.colors.neutral[100],

  text: DesignTokens.colors.neutral[900],
  textSecondary: DesignTokens.colors.neutral[700],
  textTertiary: DesignTokens.colors.neutral[500],

  border: DesignTokens.colors.neutral[300],
  borderLight: DesignTokens.colors.neutral[200],

  primary: DesignTokens.colors.primary[600],
  primaryLight: DesignTokens.colors.primary[100],
  primaryDark: DesignTokens.colors.primary[800],

  success: DesignTokens.colors.success.main,
  warning: DesignTokens.colors.warning.main,
  error: DesignTokens.colors.error.main,
  info: DesignTokens.colors.info.main,

  overlay: `rgba(0, 0, 0, ${DesignTokens.opacity.overlay})`,
  backdrop: "rgba(0, 0, 0, 0.5)",
};

const darkColors: ThemeColors = {
  background: DesignTokens.colors.neutral[950],
  backgroundSecondary: DesignTokens.colors.neutral[900],
  surface: DesignTokens.colors.neutral[900],
  surfaceVariant: DesignTokens.colors.neutral[800],

  text: DesignTokens.colors.neutral[50],
  textSecondary: DesignTokens.colors.neutral[300],
  textTertiary: DesignTokens.colors.neutral[500],

  border: DesignTokens.colors.neutral[700],
  borderLight: DesignTokens.colors.neutral[800],

  primary: DesignTokens.colors.primary[400],
  primaryLight: DesignTokens.colors.primary[900],
  primaryDark: DesignTokens.colors.primary[200],

  success: DesignTokens.colors.success.light,
  warning: DesignTokens.colors.warning.light,
  error: DesignTokens.colors.error.light,
  info: DesignTokens.colors.info.light,

  overlay: `rgba(0, 0, 0, ${DesignTokens.opacity.overlay + 0.2})`,
  backdrop: "rgba(0, 0, 0, 0.7)",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@brigada_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencia guardada
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ["light", "dark", "auto"].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const currentTheme = getActiveTheme();
    setThemeMode(currentTheme === "light" ? "dark" : "light");
  };

  const getActiveTheme = (): ActiveTheme => {
    if (themeMode === "auto") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  };

  const theme = getActiveTheme();
  const colors = theme === "dark" ? darkColors : lightColors;

  if (isLoading) {
    return null; // O un loader
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Hook para obtener colores dinámicos fácilmente
export function useThemeColors() {
  const { colors } = useTheme();
  return colors;
}

// Utilidad para crear estilos con tema
export function createThemedStyles<T extends Record<string, any>>(
  stylesFn: (colors: ThemeColors) => T,
) {
  return (colors: ThemeColors): T => stylesFn(colors);
}

export default ThemeContext;

/**
 * @example
 * // En tu componente raíz (_layout.tsx)
 * import { ThemeProvider } from '@/contexts/theme-context';
 *
 * export default function RootLayout() {
 *   return (
 *     <ThemeProvider>
 *       <Stack />
 *     </ThemeProvider>
 *   );
 * }
 *
 * @example
 * // Uso en componentes
 * import { useTheme, useThemeColors } from '@/contexts/theme-context';
 *
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   const colors = useThemeColors();
 *
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>
 *         Tema actual: {theme}
 *       </Text>
 *       <Button onPress={toggleTheme} title="Cambiar tema" />
 *     </View>
 *   );
 * }
 *
 * @example
 * // Crear estilos con tema
 * const getStyles = createThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *     borderColor: colors.border,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }));
 *
 * // En el componente
 * const colors = useThemeColors();
 * const styles = getStyles(colors);
 */
