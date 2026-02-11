/**
 * 🎨 Ejemplos de Uso - Design System Components
 * Archivo de demostración para probar los componentes mejorados
 */

import { AlertEnhanced } from "@/components/ui/alert-enhanced";
import { BadgeEnhanced } from "@/components/ui/badge-enhanced";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { CardEnhanced } from "@/components/ui/card-enhanced";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { ThemeToggle, ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { toastManager } from "@/components/ui/toast-enhanced";
import { DesignTokens } from "@/constants/design-tokens";
import { useThemeColors } from "@/contexts/theme-context";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DesignSystemExamples() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const colors = useThemeColors();

  const handleButtonPress = (buttonName: string) => {
    console.log(`${buttonName} pressed`);
  };

  const handleLoadingButton = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Action completed");
    }, 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              🎨 Design System
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Componentes Mejorados
            </Text>
          </View>
          <ThemeToggleIcon />
        </View>

        {/* Sección: Theme */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tema
          </Text>
          <Text
            style={[styles.sectionDescription, { color: colors.textSecondary }]}
          >
            Cambia entre modo claro y oscuro
          </Text>

          <ThemeToggle style={{ marginTop: 12 }} />
        </View>

        {/* Sección: Botones Primary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botones Primary</Text>

          <ButtonEnhanced
            title="Extra Large"
            onPress={() => handleButtonPress("XL Primary")}
            variant="primary"
            size="xl"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Large"
            onPress={() => handleButtonPress("Large Primary")}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Medium (Default)"
            onPress={() => handleButtonPress("Medium Primary")}
            variant="primary"
            size="md"
            fullWidth
            style={styles.buttonSpacing}
          />

          <View style={styles.row}>
            <ButtonEnhanced
              title="Small"
              onPress={() => handleButtonPress("Small Primary")}
              variant="primary"
              size="sm"
              style={styles.buttonSpacing}
            />
            <ButtonEnhanced
              title="Extra Small"
              onPress={() => handleButtonPress("XS Primary")}
              variant="primary"
              size="xs"
            />
          </View>
        </View>

        {/* Sección: Botones con Iconos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botones con Iconos</Text>

          <ButtonEnhanced
            title="Iniciar Sesión"
            onPress={() => handleButtonPress("Login")}
            variant="primary"
            icon="log-in-outline"
            iconPosition="left"
            size="lg"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Continuar"
            onPress={() => handleButtonPress("Continue")}
            variant="gradient"
            icon="arrow-forward"
            iconPosition="right"
            size="lg"
            fullWidth
            rounded
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Guardar"
            onPress={handleLoadingButton}
            variant="primary"
            icon="save-outline"
            loading={isLoading}
            size="md"
            fullWidth
            style={styles.buttonSpacing}
          />
        </View>

        {/* Sección: Variantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variantes de Botón</Text>

          <ButtonEnhanced
            title="Primary"
            onPress={() => handleButtonPress("Primary")}
            variant="primary"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Secondary"
            onPress={() => handleButtonPress("Secondary")}
            variant="secondary"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Outline"
            onPress={() => handleButtonPress("Outline")}
            variant="outline"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Ghost"
            onPress={() => handleButtonPress("Ghost")}
            variant="ghost"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Gradient"
            onPress={() => handleButtonPress("Gradient")}
            variant="gradient"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Danger"
            onPress={() => handleButtonPress("Danger")}
            variant="danger"
            fullWidth
            style={styles.buttonSpacing}
          />

          <ButtonEnhanced
            title="Disabled"
            onPress={() => handleButtonPress("Disabled")}
            variant="primary"
            disabled
            fullWidth
          />
        </View>

        {/* Sección: Inputs Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs Básicos</Text>

          <InputEnhanced
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            required
          />

          <InputEnhanced
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            helperText="Mínimo 8 caracteres"
          />
        </View>

        {/* Sección: Inputs con Validación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs con Validación</Text>

          <InputEnhanced
            label="Email con Error"
            placeholder="tu@email.com"
            value="invalid-email"
            onChangeText={() => {}}
            leftIcon="mail-outline"
            error="Formato de email inválido"
          />

          <InputEnhanced
            label="Contraseña con Error"
            placeholder="••••••••"
            value="123"
            onChangeText={() => {}}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error="La contraseña debe tener al menos 8 caracteres"
          />
        </View>

        {/* Sección: Inputs con Contador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input con Contador</Text>

          <InputEnhanced
            label="Descripción"
            placeholder="Escribe aquí..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
            showCharCount
            helperText="Describe tu respuesta"
          />
        </View>

        {/* Sección: Variantes de Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variantes de Input</Text>

          <InputEnhanced
            label="Default (con borde)"
            placeholder="Input default"
            variant="default"
            leftIcon="pencil-outline"
          />

          <InputEnhanced
            label="Filled (relleno)"
            placeholder="Input filled"
            variant="filled"
            leftIcon="search-outline"
          />

          <InputEnhanced
            label="Underlined (línea inferior)"
            placeholder="Input underlined"
            variant="underlined"
            leftIcon="create-outline"
          />
        </View>

        {/* Sección: Tamaños de Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tamaños de Input</Text>

          <InputEnhanced
            label="Small"
            placeholder="Input pequeño"
            size="sm"
            leftIcon="search-outline"
          />

          <InputEnhanced
            label="Medium (Default)"
            placeholder="Input mediano"
            size="md"
            leftIcon="search-outline"
          />

          <InputEnhanced
            label="Large"
            placeholder="Input grande"
            size="lg"
            leftIcon="search-outline"
          />
        </View>

        {/* Sección: Input de Búsqueda */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input de Búsqueda</Text>

          <InputEnhanced
            placeholder="Buscar encuestas..."
            value={search}
            onChangeText={setSearch}
            variant="filled"
            leftIcon="search-outline"
            rightIcon={search ? "close-circle" : undefined}
            onRightIconPress={() => setSearch("")}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ✨ Todos los componentes usan Design Tokens
          </Text>
          <Text style={styles.footerSubtext}>
            Colores, espaciado, tipografía y sombras consistentes
          </Text>
        </View>

        {/* Sección: Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>

          <CardEnhanced
            variant="default"
            header={{
              title: "Card Default",
              subtitle: "Con header y footer",
              icon: "document-text-outline",
            }}
            footer={
              <View style={{ flexDirection: "row", gap: 8 }}>
                <ButtonEnhanced
                  title="Acción 1"
                  onPress={() => {}}
                  variant="primary"
                  size="sm"
                />
                <ButtonEnhanced
                  title="Acción 2"
                  onPress={() => {}}
                  variant="outline"
                  size="sm"
                />
              </View>
            }
            style={{ marginBottom: 16 }}
          >
            <Text>Contenido de la tarjeta con información relevante.</Text>
          </CardEnhanced>

          <CardEnhanced
            variant="elevated"
            onPress={() => toastManager.info("Card presionada")}
            style={{ marginBottom: 16 }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <BadgeEnhanced text="Nuevo" variant="success" dot />
              <Text style={{ flex: 1 }}>Card interactiva (presióname)</Text>
            </View>
          </CardEnhanced>

          <CardEnhanced
            variant="outlined"
            header={{
              title: "Card con Badge",
              rightElement: <BadgeEnhanced text="5" variant="error" rounded />,
            }}
          >
            <Text>Card con badge en el header</Text>
          </CardEnhanced>
        </View>

        {/* Sección: Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <BadgeEnhanced text="Primary" variant="primary" />
            <BadgeEnhanced text="Secondary" variant="secondary" />
            <BadgeEnhanced
              text="Success"
              variant="success"
              icon="checkmark-circle"
            />
            <BadgeEnhanced text="Warning" variant="warning" icon="warning" />
            <BadgeEnhanced text="Error" variant="error" icon="close-circle" />
            <BadgeEnhanced
              text="Info"
              variant="info"
              icon="information-circle"
            />
            <BadgeEnhanced text="Neutral" variant="neutral" />
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            <BadgeEnhanced text="Small" variant="primary" size="sm" />
            <BadgeEnhanced text="Medium" variant="primary" size="md" />
            <BadgeEnhanced text="Large" variant="primary" size="lg" />
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            <BadgeEnhanced text="Activo" variant="success" dot rounded />
            <BadgeEnhanced text="Outlined" variant="primary" outlined rounded />
            <BadgeEnhanced text="99+" variant="error" size="lg" rounded />
          </View>
        </View>

        {/* Sección: Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>

          <AlertEnhanced
            variant="success"
            message="Operación completada exitosamente"
            style={{ marginBottom: 12 }}
          />

          <AlertEnhanced
            variant="warning"
            title="Advertencia"
            message="Verifica que todos los campos estén completos antes de continuar"
            onClose={() => toastManager.info("Alert cerrada")}
            style={{ marginBottom: 12 }}
          />

          <AlertEnhanced
            variant="error"
            title="Error de conexión"
            message="No se pudo conectar al servidor. Por favor, intenta de nuevo."
            actions={[
              {
                label: "Reintentar",
                onPress: () => toastManager.info("Reintentando..."),
                variant: "primary",
              },
              {
                label: "Cancelar",
                onPress: () => toastManager.info("Cancelado"),
                variant: "secondary",
              },
            ]}
            style={{ marginBottom: 12 }}
          />

          <AlertEnhanced
            variant="info"
            icon="bulb-outline"
            message="Tip: Puedes personalizar el icono de cualquier alert"
          />
        </View>

        {/* Sección: Toasts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toast Notifications</Text>

          <ButtonEnhanced
            title="Toast Success"
            onPress={() => toastManager.success("Operación exitosa")}
            variant="outline"
            size="sm"
            fullWidth
            style={{ marginBottom: 8 }}
          />

          <ButtonEnhanced
            title="Toast Error"
            onPress={() => toastManager.error("Algo salió mal")}
            variant="outline"
            size="sm"
            fullWidth
            style={{ marginBottom: 8 }}
          />

          <ButtonEnhanced
            title="Toast Warning"
            onPress={() => toastManager.warning("Ten cuidado con esto")}
            variant="outline"
            size="sm"
            fullWidth
            style={{ marginBottom: 8 }}
          />

          <ButtonEnhanced
            title="Toast Info (5s)"
            onPress={() => toastManager.info("Información importante", 5000)}
            variant="outline"
            size="sm"
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: DesignTokens.spacing[4],
  },
  header: {
    marginBottom: DesignTokens.spacing[8],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: DesignTokens.typography.fontSize["4xl"],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    marginBottom: DesignTokens.spacing[2],
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
  },
  section: {
    marginBottom: DesignTokens.spacing[8],
    padding: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.lg,
    ...DesignTokens.shadows.md,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    marginBottom: DesignTokens.spacing[4],
  },
  sectionDescription: {
    fontSize: DesignTokens.typography.fontSize.sm,
    marginBottom: DesignTokens.spacing[2],
  },
  buttonSpacing: {
    marginBottom: DesignTokens.spacing[3],
  },
  row: {
    flexDirection: "row",
    gap: DesignTokens.spacing[3],
  },
  footer: {
    alignItems: "center",
    paddingVertical: DesignTokens.spacing[8],
  },
  footerText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    marginBottom: DesignTokens.spacing[1],
  },
  footerSubtext: {
    fontSize: DesignTokens.typography.fontSize.sm,
  },
});
