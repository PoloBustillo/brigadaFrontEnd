/**
 * 🎨 Theme Context - Brigada Digital
 * Contexto para manejar tema claro/oscuro y esquemas de colores
 */

import {
  colorSchemes,
  defaultScheme,
  getColorScheme,
  type ColorScheme,
  type ThemeColors,
} from "@/constants/color-schemes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "auto";
type ActiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: ActiveTheme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  // Color scheme selection
  colorScheme: string;
  availableSchemes: ColorScheme[];
  setColorScheme: (schemeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@brigada_theme_mode";
const SCHEME_STORAGE_KEY = "@brigada_color_scheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [colorSchemeId, setColorSchemeIdState] = useState<string>(
    defaultScheme.id,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias guardadas
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedMode, savedScheme] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(SCHEME_STORAGE_KEY),
      ]);

      if (savedMode && ["light", "dark", "auto"].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }

      if (savedScheme && getColorScheme(savedScheme)) {
        setColorSchemeIdState(savedScheme);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
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

  const setColorScheme = async (schemeId: string) => {
    try {
      if (getColorScheme(schemeId)) {
        await AsyncStorage.setItem(SCHEME_STORAGE_KEY, schemeId);
        setColorSchemeIdState(schemeId);
      }
    } catch (error) {
      console.error("Error saving color scheme:", error);
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

  // Get colors from the selected scheme
  const currentScheme = getColorScheme(colorSchemeId) || defaultScheme;
  const theme = getActiveTheme();
  const colors = theme === "dark" ? currentScheme.dark : currentScheme.light;

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
        colorScheme: colorSchemeId,
        availableSchemes: colorSchemes,
        setColorScheme,
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
