/**
 * ❓ Help / FAQ Screen
 * Preguntas frecuentes y guía rápida de la app
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_SECTIONS: { title: string; icon: string; items: FAQItem[] }[] = [
  {
    title: "General",
    icon: "information-circle",
    items: [
      {
        question: "¿Qué es Brigada Digital?",
        answer:
          "Es una plataforma para gestionar encuestas de campo. Los brigadistas aplican encuestas en territorio, los encargados supervisan equipos y los administradores gestionan todo desde el CMS web.",
      },
      {
        question: "¿Se puede usar sin internet?",
        answer:
          "Sí. Las encuestas se guardan localmente y se sincronizan cuando tengas conexión. El ícono de WiFi en el dashboard muestra tu estado de conectividad.",
      },
    ],
  },
  {
    title: "Encuestas",
    icon: "document-text",
    items: [
      {
        question: "¿Cómo empiezo una encuesta?",
        answer:
          'Ve a "Mis Encuestas" desde el menú inferior, selecciona una encuesta asignada y toca "Iniciar". Responde cada pregunta y al terminar toca "Finalizar".',
      },
      {
        question: "¿Puedo guardar y continuar después?",
        answer:
          "Sí, las respuestas se guardan como borrador automáticamente. Puedes cerrar la app y retomar donde la dejaste.",
      },
      {
        question: "¿Cómo subo fotos o documentos?",
        answer:
          "En preguntas de tipo archivo, toca el botón de cámara o galería. Las fotos se suben cuando haya conexión y aparecen como pendientes mientras tanto.",
      },
    ],
  },
  {
    title: "Sincronización",
    icon: "cloud-upload",
    items: [
      {
        question: "¿Qué significa 'Sin Sync'?",
        answer:
          "Indica respuestas guardadas localmente que aún no se envían al servidor. Conéctate a internet y toca el botón de sincronizar en el dashboard.",
      },
      {
        question: "¿Mis datos se pierden si desinstalo?",
        answer:
          "Los datos ya sincronizados están seguros en el servidor. Los borradores pendientes sí se perderían, así que sincroniza antes de desinstalar.",
      },
    ],
  },
  {
    title: "Cuenta y Perfil",
    icon: "person-circle",
    items: [
      {
        question: "¿Cómo cambio mi foto de perfil?",
        answer:
          'Ve a tu Perfil → "Foto de Perfil". Puedes tomar una foto con la cámara o elegir una de tu galería.',
      },
      {
        question: "¿Cómo cambio mi contraseña?",
        answer:
          'Ve a tu Perfil → "Cambiar Contraseña". Necesitarás tu contraseña actual para confirmar el cambio.',
      },
      {
        question: "¿No puedo iniciar sesión, qué hago?",
        answer:
          "Verifica que tu cuenta esté activada. Si el problema persiste, contacta al administrador de tu brigada o escribe al correo de soporte.",
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.faqItem,
        {
          backgroundColor: colors.surface,
          borderColor: open ? colors.primary + "40" : colors.border,
        },
      ]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text
          style={[styles.faqQuestion, { color: colors.text }]}
          numberOfLines={open ? undefined : 2}
        >
          {item.question}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      {open && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
          {item.answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const appVersion = Application.nativeApplicationVersion ?? "1.0.0";
  const buildVersion = Application.nativeBuildVersion ?? "1";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayuda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Sections */}
        {FAQ_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name={section.icon as any}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>
            {section.items.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </View>
        ))}

        {/* Contact / Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Soporte
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.contactCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() =>
              Linking.openURL(
                "mailto:brigadadigitalmorena@gmail.com?subject=Soporte%20Brigada%20Digital",
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: colors.text }]}>
                Correo de soporte
              </Text>
              <Text
                style={[styles.contactValue, { color: colors.textSecondary }]}
              >
                brigadadigitalmorena@gmail.com
              </Text>
            </View>
            <Ionicons
              name="open-outline"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.textSecondary }]}>
            Brigada Digital
          </Text>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            v{appVersion} ({buildVersion})
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  faqQuestion: { fontSize: 14, fontWeight: "600", flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: "600" },
  contactValue: { fontSize: 13, marginTop: 2 },
  appInfo: { alignItems: "center", marginTop: 12, marginBottom: 20 },
  appName: { fontSize: 14, fontWeight: "600" },
  appVersion: { fontSize: 12, marginTop: 2 },
});
