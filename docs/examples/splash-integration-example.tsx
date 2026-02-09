/**
 * Ejemplo de integración del Splash Screen
 *
 * Este archivo muestra cómo usar el componente SplashScreen
 * en el layout principal de la app con Expo Router.
 *
 * @see components/layout/splash-screen.tsx
 */

import SplashScreen from "@/components/layout/splash-screen";
import { Slot, useRouter } from "expo-router";
import { SplashScreen as ExpoSplashScreen } from "expo-splash-screen";
import React, { useEffect, useState } from "react";

// Prevenir que el splash nativo se oculte automáticamente
ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [appState, setAppState] = useState<{
    hasSession: boolean;
    isOnline: boolean;
    surveysLoaded: boolean;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (appReady && appState) {
      // Ocultar splash nativo de Expo
      ExpoSplashScreen.hideAsync();

      // Navegar según el estado de la app
      if (!appState.hasSession) {
        // Si no hay sesión → Login
        router.replace("/login");
      } else {
        // Si hay sesión → Home
        router.replace("/(tabs)");
      }
    }
  }, [appReady, appState]);

  // Callback cuando el splash termina de cargar
  const handleLoadComplete = (state: typeof appState) => {
    console.log("[App] Splash completed. State:", state);
    setAppState(state);
    setAppReady(true);
  };

  // Mostrar custom splash mientras no esté lista la app
  if (!appReady) {
    return <SplashScreen onLoadComplete={handleLoadComplete} />;
  }

  // App lista, renderizar rutas
  return <Slot />;
}
