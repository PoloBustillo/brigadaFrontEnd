import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "react-native-reanimated";

import { SplashScreen } from "@/components/layout";
import { ToastContainer } from "@/components/ui/toast-enhanced";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SyncProvider } from "@/contexts/sync-context";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/theme-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  canAccessMobileApp,
  getPrimaryMobileRouteGroup,
} from "@/lib/auth/capabilities";
import { db, initializeDatabase } from "@/lib/db";

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
  anchor: "(auth)",
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
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
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
          <TouchableOpacity
            style={errorStyles.button}
            onPress={this.handleReset}
          >
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
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
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
  const segments = useSegments();
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

  // If user is already authenticated, keep auth screens inaccessible.
  useEffect(() => {
    if (!appReady || authLoading || !user) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!canAccessMobileApp(user)) {
      // Keep users in auth flow (activation/create-password) if they still
      // don't have app access capability.
      if (!inAuthGroup) {
        router.replace("/(auth)/welcome" as any);
      }
      return;
    }

    if (!inAuthGroup) return;

    const destination = getPrimaryMobileRouteGroup(user);
    router.replace(`/${destination}` as any);
  }, [appReady, authLoading, user, segments, router]);

  // ── Sentry user context ─────────────────────────────────────────────────
  // Attach user identity to every error/trace so Sentry shows who was affected.
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: String(user.id),
        email: user.email,
        username: user.name ?? undefined,
        // Extra fields appear in the "User" section of Sentry events
        data: {
          role: user.role,
          state: user.state,
        },
      });
    } else {
      // Clear on logout / session expiry so no stale identity lingers
      Sentry.setUser(null);
    }
  }, [user]);

  const handleLoadComplete = async (state: any) => {
    console.log("[App] Splash completed:", state);

    try {
      // Inicializar base de datos de autenticación
      console.log("🚀 Inicializando base de datos...");
      await initializeDatabase();

      // Inicializar base de datos offline (repositorios/sync/cache)
      await db.initialize();
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

  // Determine initial route based on effective capabilities
  const getInitialRoute = () => {
    if (!hasSession) return "(auth)";

    if (!canAccessMobileApp(user)) {
      return "(auth)";
    }

    return getPrimaryMobileRouteGroup(user);
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
        {/* Capability-based app screens (survey-centric) */}
        <Stack.Screen name="(brigadista)" options={{ headerShown: false }} />
        <Stack.Screen name="theme-settings" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
      </Stack>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
