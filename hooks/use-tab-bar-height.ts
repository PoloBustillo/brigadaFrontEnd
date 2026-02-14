/**
 * 🎯 useTabBarHeight Hook
 * Calcula la altura de la tab bar para agregar padding a los contenidos
 */

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Hook que retorna la altura de la tab bar para agregar padding al contenido
 * Previene que los elementos sean tapados por la barra de navegación
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();

  // Altura base de la tab bar: 52px (minHeight del content optimizado)
  const baseHeight = 52;

  // Padding bottom del BlurView (respeta safe area)
  const bottomPadding = Math.max(insets.bottom, 4);

  // Total de espacio que ocupa la tab bar
  const tabBarHeight = baseHeight + bottomPadding;

  // Espacio recomendado para padding (margen optimizado de 16px)
  const contentPadding = tabBarHeight + 16;

  return {
    tabBarHeight,
    contentPadding,
    bottomInset: insets.bottom,
  };
}
