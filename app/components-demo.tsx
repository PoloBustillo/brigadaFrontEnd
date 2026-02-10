/**
 * Componentes UI Demo - Brigada Digital
 * Ejemplo de uso de todos los componentes base
 */

import Alert from "@/components/ui/alert";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ProgressBar from "@/components/ui/progress-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ComponentsDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔘 Buttons</Text>

        <Button
          title="Primary Button"
          onPress={handleTest}
          variant="primary"
          loading={loading}
        />

        <View style={styles.gap} />

        <Button
          title="Secondary Button"
          onPress={() => {}}
          variant="secondary"
        />

        <View style={styles.gap} />

        <Button title="Outline Button" onPress={() => {}} variant="outline" />

        <View style={styles.gap} />

        <Button title="Disabled Button" onPress={() => {}} disabled />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Inputs</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
        />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          helperText="Mínimo 6 caracteres"
        />

        <Input label="Con Error" value="error@test" error="Formato inválido" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Cards</Text>

        <Card padding="medium">
          <Text style={styles.cardTitle}>Card Simple</Text>
          <Text style={styles.cardText}>Contenido de la card</Text>
        </Card>

        <View style={styles.gap} />

        <Card padding="large">
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Card con Badge</Text>
            <Badge label="Activa" variant="success" />
          </View>
          <Text style={styles.cardText}>Más contenido aquí</Text>
          <View style={styles.gap} />
          <ProgressBar progress={75} />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Badges</Text>

        <View style={styles.badgeRow}>
          <Badge label="Success" variant="success" />
          <Badge label="Error" variant="error" />
          <Badge label="Warning" variant="warning" />
        </View>

        <View style={styles.gap} />

        <View style={styles.badgeRow}>
          <Badge label="Info" variant="info" />
          <Badge label="Neutral" variant="neutral" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Alerts</Text>

        {showSuccess && (
          <Alert
            variant="success"
            title="¡Éxito!"
            message="Operación completada correctamente"
          />
        )}

        <Alert variant="info" message="Este es un mensaje informativo" />

        <Alert
          variant="warning"
          title="Advertencia"
          message="Ten cuidado con esta acción"
        />

        <Alert variant="error" title="Error" message="Algo salió mal" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Progress Bars</Text>

        <ProgressBar progress={25} />
        <View style={styles.gap} />
        <ProgressBar progress={50} />
        <View style={styles.gap} />
        <ProgressBar progress={75} color="#4CAF50" />
        <View style={styles.gap} />
        <ProgressBar progress={100} color="#2196F3" />
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E4E8",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1A1A2E",
  },
  gap: {
    height: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#6C7A89",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});
