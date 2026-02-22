import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { Stack, useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import "react-native-reanimated";

import { SplashScreen } from "@/components/layout";
import { ToastContainer } from "@/components/ui/toast-enhanced";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SyncProvider } from "@/contexts/sync-context";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeDatabase } from "@/lib/db";

// ─── Sentry ────────────────────────────────────────────────────────────────
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

Sentry.init({
  dsn: SENTRY_DSN,
  // Only send events in production builds
  enabled: process.env.NODE_ENV === "production",
  // Capture 20 % of traces in production for performance monitoring
  tracesSampleRate: 0.2,
  // Attach breadcrumbs from navigation (expo-router uses react-navigation)
  integrations: [Sentry.reactNativeTracingIntegration()],
  debug: false,
});

// Prevenir que el splash nativo se oculte automáticamente
ExpoSplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

// ─── ErrorBoundary ─────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error("🔴 ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>⚠️</Text>
          <Text style={errorStyles.title}>Algo salió mal</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message ?? "Error inesperado en la aplicación"}
          </Text>
          <TouchableOpacity style={errorStyles.button} onPress={this.handleReset}>
            <Text style={errorStyles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8f9fa",
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  message: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  button: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

function RootLayout() {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <RootNavigator />
          </SyncProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // Track if the user was ever authenticated so we only redirect on session loss,
  // not on the initial unauthenticated load.
  const wasAuthed = useRef(false);

  useEffect(() => {
    if (appReady) {
      // Ocultar splash nativo de Expo
      ExpoSplashScreen.hideAsync();
    }
  }, [appReady]);

  // Navigation guard: redirect to /(auth) when session is cleared at runtime
  useEffect(() => {
    if (user) {
      wasAuthed.current = true;
    } else if (appReady && wasAuthed.current) {
      // User was authenticated but is now null — session expired or logout
      router.replace("/(auth)/welcome");
    }
  }, [user, appReady]);

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
        {/* Auth screens */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* Role-based app screens */}
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(encargado)" options={{ headerShown: false }} />
        <Stack.Screen name="(brigadista)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        {/* Misc */}
        <Stack.Screen name="components-demo" options={{ headerShown: false }} />
      </Stack>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
