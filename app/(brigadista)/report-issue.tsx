import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaReportIssueScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const handleReportIssue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mailto =
      "mailto:brigadadigitalmorena@gmail.com?subject=Reporte%20de%20error%20-%20Brigada%20Digital";
    const canOpen = await Linking.canOpenURL(mailto);

    if (!canOpen) {
      Alert.alert(
        "No disponible",
        "No se pudo abrir el correo en este dispositivo.",
      );
      return;
    }

    await Linking.openURL(mailto);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Reportar error"
        subtitle="Canal de soporte"
        onBackPress={() => router.back()}
      />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="bug-outline" size={20} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>
          Enviar reporte
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Describe el problema y adjunta evidencia desde tu cliente de correo.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.error }]}
          onPress={handleReportIssue}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Abrir correo de soporte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    margin: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
  button: {
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
