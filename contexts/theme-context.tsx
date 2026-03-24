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
import {
  fetchPublicAppConfig,
  getCachedPublicAppConfig,
} from "@/lib/api/app-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "auto";
type ActiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: ActiveTheme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  allowUserThemeOverride: boolean;
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
const THEME_USER_OVERRIDE_KEY = "@brigada_theme_user_override";
const SCHEME_USER_OVERRIDE_KEY = "@brigada_scheme_user_override";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [colorSchemeId, setColorSchemeIdState] = useState<string>(
    defaultScheme.id,
  );
  const [allowUserThemeOverride, setAllowUserThemeOverride] =
    useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias guardadas
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [
        savedMode,
        savedScheme,
        savedThemeOverride,
        savedSchemeOverride,
        remoteConfig,
      ] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(SCHEME_STORAGE_KEY),
        AsyncStorage.getItem(THEME_USER_OVERRIDE_KEY),
        AsyncStorage.getItem(SCHEME_USER_OVERRIDE_KEY),
        fetchPublicAppConfig(),
      ]);

      const cachedConfig = !remoteConfig
        ? await getCachedPublicAppConfig()
        : null;
      const effectiveRemoteConfig = remoteConfig ?? cachedConfig;

      const userCanOverride =
        effectiveRemoteConfig?.allow_user_theme_override ?? true;
      setAllowUserThemeOverride(userCanOverride);

      const hasUserThemeOverride = savedThemeOverride === "true";
      const hasUserSchemeOverride = savedSchemeOverride === "true";

      if (!userCanOverride) {
        if (
          effectiveRemoteConfig?.default_theme_mode &&
          ["light", "dark", "auto"].includes(
            effectiveRemoteConfig.default_theme_mode,
          )
        ) {
          setThemeModeState(
            effectiveRemoteConfig.default_theme_mode as ThemeMode,
          );
        }

        if (
          effectiveRemoteConfig?.default_color_scheme &&
          getColorScheme(effectiveRemoteConfig.default_color_scheme)
        ) {
          setColorSchemeIdState(effectiveRemoteConfig.default_color_scheme);
        }

        return;
      }

      if (
        hasUserThemeOverride &&
        savedMode &&
        ["light", "dark", "auto"].includes(savedMode)
      ) {
        setThemeModeState(savedMode as ThemeMode);
      } else if (
        effectiveRemoteConfig?.default_theme_mode &&
        ["light", "dark", "auto"].includes(
          effectiveRemoteConfig.default_theme_mode,
        )
      ) {
        setThemeModeState(
          effectiveRemoteConfig.default_theme_mode as ThemeMode,
        );
      } else if (savedMode && ["light", "dark", "auto"].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }

      if (hasUserSchemeOverride && savedScheme && getColorScheme(savedScheme)) {
        setColorSchemeIdState(savedScheme);
      } else if (
        effectiveRemoteConfig?.default_color_scheme &&
        getColorScheme(effectiveRemoteConfig.default_color_scheme)
      ) {
        setColorSchemeIdState(effectiveRemoteConfig.default_color_scheme);
      } else if (savedScheme && getColorScheme(savedScheme)) {
        setColorSchemeIdState(savedScheme);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    if (!allowUserThemeOverride) return;
    try {
      await Promise.all([
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode),
        AsyncStorage.setItem(THEME_USER_OVERRIDE_KEY, "true"),
      ]);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const setColorScheme = async (schemeId: string) => {
    if (!allowUserThemeOverride) return;
    try {
      if (getColorScheme(schemeId)) {
        await Promise.all([
          AsyncStorage.setItem(SCHEME_STORAGE_KEY, schemeId),
          AsyncStorage.setItem(SCHEME_USER_OVERRIDE_KEY, "true"),
        ]);
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
        allowUserThemeOverride,
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
