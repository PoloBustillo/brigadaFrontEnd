/**
 * Unauthorized Access Screen
 * Shown when user tries to access a route they don't have permission for
 */

import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function UnauthorizedScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Go to role-specific home
      switch (user?.role) {
        case "ADMIN":
          router.replace("/(admin)");
          break;
        case "ENCARGADO":
          router.replace("/(encargado)");
          break;
        case "BRIGADISTA":
          router.replace("/(brigadista)");
          break;
        default:
          router.replace("/(auth)/login-enhanced");
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
        
        <Text style={[styles.title, { color: colors.text }]}>
          Acceso Denegado
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          No tienes permisos para acceder a esta sección.
        </Text>
        
        <Text style={[styles.submessage, { color: colors.textSecondary }]}>
          Contacta al administrador si crees que esto es un error.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Volver"
            onPress={handleGoBack}
            variant="primary"
            size="large"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
