import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MailComposer from "expo-mail-composer";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaReportIssueScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const SUPPORT_EMAIL = "brigadadigitalmorena@gamil.com";

  const handlePickScreenshot = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a galeria para adjuntar la captura de pantalla.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets.length > 0) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleReportIssue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      Alert.alert(
        "Falta descripcion",
        "Describe brevemente el problema antes de enviarlo.",
      );
      return;
    }

    if (!screenshotUri) {
      Alert.alert(
        "Falta captura",
        "Adjunta una captura de pantalla para enviar el reporte completo.",
      );
      return;
    }

    setIsSending(true);

    const subject = "Reporte de problema - Brigada Digital";
    const body =
      "Hola equipo de soporte,\n\n" +
      `Descripcion del problema:\n${cleanDescription}\n\n` +
      `Plataforma: ${Platform.OS}\n` +
      "Enviado desde la app Brigada.";

    const canCompose = await MailComposer.isAvailableAsync();

    if (canCompose) {
      const result = await MailComposer.composeAsync({
        recipients: [SUPPORT_EMAIL],
        subject,
        body,
        attachments: [screenshotUri],
      });

      setIsSending(false);

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        Alert.alert("Listo", "Reporte enviado correctamente.");
        setDescription("");
        setScreenshotUri(null);
      }
      return;
    }

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(mailto);

    setIsSending(false);

    if (!canOpen) {
      Alert.alert(
        "No disponible",
        "No hay cliente de correo disponible en este dispositivo.",
      );
      return;
    }

    Alert.alert(
      "Adjunto manual",
      "Se abrira tu correo. Si no ves la captura adjunta automaticamente, adjuntala manualmente antes de enviar.",
    );
    await Linking.openURL(mailto);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title="Reportar error"
        subtitle="Envia descripcion y captura"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
            Completa la descripcion y adjunta una captura para enviarlo a
            soporte.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>
            Descripcion
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Que paso, donde ocurrio y como reproducirlo"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.text }]}>Captura</Text>
          {screenshotUri ? (
            <View
              style={[
                styles.previewWrap,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Image
                source={{ uri: screenshotUri }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={[styles.removeChip, { backgroundColor: colors.error }]}
                onPress={() => setScreenshotUri(null)}
              >
                <Text style={styles.removeChipText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.attachButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={handlePickScreenshot}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={[styles.attachButtonText, { color: colors.text }]}>
                Seleccionar captura de pantalla
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.error,
                opacity: isSending ? 0.7 : 1,
              },
            ]}
            onPress={handleReportIssue}
            activeOpacity={0.85}
            disabled={isSending}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {isSending ? "Preparando correo..." : "Enviar reporte por correo"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
  label: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontSize: 14,
  },
  attachButton: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachButtonText: { fontSize: 14, fontWeight: "600" },
  previewWrap: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeChipText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  button: {
    marginTop: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { fontSize: 14, fontWeight: "700" },
});
