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
import { ToastContainer } from "@/components/ui/toast-enhanced";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeDatabase } from "@/lib/db";

// Prevenir que el splash nativo se oculte automáticamente
ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </CustomThemeProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (appReady) {
      // Ocultar splash nativo de Expo
      ExpoSplashScreen.hideAsync();
    }
  }, [appReady]);

  const handleLoadComplete = async (state: any) => {
    console.log("[App] Splash completed:", state);

    try {
      // Inicializar base de datos
      console.log("🚀 Inicializando base de datos...");
      await initializeDatabase();
      console.log("✅ Base de datos inicializada correctamente");
    } catch (error) {
      console.error("❌ Error inicializando base de datos:", error);
    }

    // AuthContext will automatically load session
    setAppReady(true);
  };

  // Mostrar custom splash mientras no esté lista la app o cargando auth
  if (!appReady || authLoading) {
    return <SplashScreen onLoadComplete={handleLoadComplete} />;
  }

  const hasSession = !!user;

  // Determine initial route based on user role
  const getInitialRoute = () => {
    if (!hasSession) return "(auth)";

    switch (user?.role) {
      case "ADMIN":
        return "(admin)";
      case "ENCARGADO":
        return "(encargado)";
      case "BRIGADISTA":
        return "(brigadista)";
      default:
        return "(tabs)";
    }
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={getInitialRoute()}
      >
        {!hasSession ? (
          // No session: Show auth flow (includes welcome + login)
          <>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            {/* Demo screen - remove in production */}
            <Stack.Screen
              name="components-demo"
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Has session: Show main app (all role-based routes)
          <>
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="(encargado)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(brigadista)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
      <ToastContainer />
    </ThemeProvider>
  );
}
