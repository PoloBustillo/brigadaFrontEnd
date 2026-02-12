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
  background: "#FFFFFF", // Blanco puro
  backgroundSecondary: "#FFF5F8", // Rosa pastel muy claro
  surface: "#FAFAFA", // Gris muy claro
  surfaceVariant: "#FFE8F0", // Rosa pastel claro

  text: "#FF1B8D", // Rosa vibrante para texto principal
  textSecondary: "#FF4DA6", // Rosa medio para texto secundario
  textTertiary: "#FF6BB8", // Rosa claro para texto terciario

  border: "#FFD6E8", // Rosa pastel para bordes
  borderLight: "#FFE8F0", // Rosa muy claro

  primary: "#FF1B8D", // Rosa vibrante (tu rosa característico)
  primaryLight: "#FFE8F0", // Rosa pastel
  primaryDark: "#CC1670", // Rosa oscuro

  success: "#10B981", // Verde
  warning: "#F59E0B", // Naranja
  error: "#EF4444", // Rojo
  info: "#3B82F6", // Azul

  overlay: `rgba(255, 27, 141, ${DesignTokens.opacity.overlay})`, // Overlay con rosa
  backdrop: "rgba(255, 27, 141, 0.1)", // Backdrop rosa suave
};

const darkColors: ThemeColors = {
  background: "#FF1B8D", // Rosa vibrante de fondo
  backgroundSecondary: "#FF4DA6", // Rosa claro secundario
  surface: "#CC1670", // Rosa oscuro para superficies
  surfaceVariant: "#E01780", // Rosa medio para variantes

  text: "#FFFFFF", // Blanco puro para texto
  textSecondary: "#FFE8F0", // Rosa pastel muy claro
  textTertiary: "#FFD6E8", // Rosa pastel claro

  border: "#FFFFFF", // Blanco para bordes
  borderLight: "rgba(255, 255, 255, 0.3)", // Blanco semi-transparente

  primary: "#FFFFFF", // Blanco como primario (invierte el esquema)
  primaryLight: "#FFE8F0", // Rosa pastel
  primaryDark: "#F0F0F0", // Gris muy claro

  success: "#34D399", // Verde claro
  warning: "#FBBF24", // Naranja claro
  error: "#FCA5A5", // Rojo claro
  info: "#93C5FD", // Azul claro

  overlay: `rgba(255, 27, 141, ${DesignTokens.opacity.overlay + 0.3})`, // Overlay rosa
  backdrop: "rgba(26, 26, 46, 0.9)", // Backdrop oscuro con tinte
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
