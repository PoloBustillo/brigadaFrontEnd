import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

import { SplashScreen } from "@/components/layout";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Prevenir que el splash nativo se oculte automáticamente
ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (appReady) {
      // Ocultar splash nativo de Expo
      ExpoSplashScreen.hideAsync();
    }
  }, [appReady]);

  const handleLoadComplete = async (state: any) => {
    console.log("[App] Splash completed:", state);

    // TODO: Check for active session
    // const userToken = await AsyncStorage.getItem('userToken');
    // setHasSession(!!userToken);

    // For now, simulate no session (show welcome screen)
    setHasSession(false);
    setAppReady(true);
  };

  // Mostrar custom splash mientras no esté lista la app
  if (!appReady) {
    return <SplashScreen onLoadComplete={handleLoadComplete} />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {!hasSession ? (
          // No session: Show auth flow (includes welcome + login)
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          // Has session: Show main app
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </>
        )}
        {/* Demo screen - remove in production */}
        <Stack.Screen name="components-demo" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
