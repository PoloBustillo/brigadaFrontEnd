import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import {
  fetchPublicAppConfig,
  type SocialLinkItem,
} from "@/lib/api/app-config";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function BrigadistaNetworksScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [selectedSocial, setSelectedSocial] = useState<SocialLinkItem | null>(
    null,
  );

  useEffect(() => {
    const loadSocialLinks = async () => {
      const config = await fetchPublicAppConfig();
      setSocialLinks(config?.social_links ?? []);
    };

    loadSocialLinks().catch((err) => {
      console.error("Error loading social links:", err);
      setSocialLinks([]);
    });
  }, []);

  const handleOpenSocialUrl = async (url: string | null) => {
    if (!url) {
      Alert.alert("Sin enlace", "Esta red no tiene enlace configurado.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Enlace no disponible", "No se pudo abrir este enlace.");
      return;
    }

    await Linking.openURL(url);
  };

  const handleShareSocialUrl = async (social: SocialLinkItem) => {
    if (!social.url) {
      Alert.alert("Sin enlace", "Esta red no tiene enlace configurado.");
      return;
    }

    try {
      await Share.share({
        message: `${social.label}\n${social.url}`,
      });
    } catch {
      Alert.alert(
        "No disponible",
        "No fue posible abrir el panel de compartir.",
      );
    }
  };

  const getPlatformIcon = (platform: SocialLinkItem["platform"]) => {
    switch (platform) {
      case "facebook":
        return "logo-facebook" as const;
      case "instagram":
        return "logo-instagram" as const;
      case "youtube":
        return "logo-youtube" as const;
      case "telegram":
        return "paper-plane" as const;
      case "whatsapp":
        return "logo-whatsapp" as const;
      case "x":
        return "at" as const;
      case "tiktok":
        return "musical-notes" as const;
      case "website":
        return "globe-outline" as const;
      default:
        return "share-social-outline" as const;
    }
  };

  const hasLinks = socialLinks.some((social) => Boolean(social.url));
  const openButtonContentColor = colors.onPrimary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Redes y Campanas"
        subtitle="Comparte rapido con link y QR generado en app"
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.primary + "22", colors.info + "14", colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.border }]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIconWrap,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons
                name="megaphone-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Difusion en un toque
            </Text>
          </View>

          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Abre cada red, comparte el link oficial y muestra su QR para
            facilitar likes, follows y compartidos en campo.
          </Text>

          <View style={styles.heroStatsRow}>
            <View
              style={[
                styles.heroStat,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.heroStatValue, { color: colors.text }]}>
                {socialLinks.length}
              </Text>
              <Text
                style={[styles.heroStatLabel, { color: colors.textSecondary }]}
              >
                Canales
              </Text>
            </View>
            <View
              style={[
                styles.heroStat,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.heroStatValue, { color: colors.text }]}>
                {hasLinks ? "Activa" : "Pendiente"}
              </Text>
              <Text
                style={[styles.heroStatLabel, { color: colors.textSecondary }]}
              >
                Campana
              </Text>
            </View>
          </View>
        </LinearGradient>

        {socialLinks.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Ionicons
              name="share-social-outline"
              size={42}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin redes publicadas
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Configura links en CMS para habilitar la difusion de campana desde
              esta pantalla.
            </Text>
          </View>
        ) : (
          socialLinks.map((social, index) => (
            <View
              key={`${social.platform}-${index}`}
              style={[
                styles.socialItem,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.socialHeaderRow}>
                <View
                  style={[
                    styles.socialIconWrap,
                    {
                      backgroundColor: colors.primary + "15",
                    },
                  ]}
                >
                  <Ionicons
                    name={getPlatformIcon(social.platform)}
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.text }]}>
                    {social.label}
                  </Text>
                  <Text
                    style={[
                      styles.socialPlatform,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {social.platform}
                  </Text>
                </View>

                {social.url ? (
                  <TouchableOpacity
                    onPress={() => setSelectedSocial(social)}
                    activeOpacity={0.85}
                    style={[
                      styles.qrPreviewWrap,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <QRCode value={social.url} size={42} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.socialActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.socialAction,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => setSelectedSocial(social)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={16}
                    color={colors.text}
                  />
                  <Text
                    style={[styles.socialActionText, { color: colors.text }]}
                  >
                    QR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialAction,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => handleShareSocialUrl(social)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="share-outline"
                    size={16}
                    color={colors.text}
                  />
                  <Text
                    style={[styles.socialActionText, { color: colors.text }]}
                  >
                    Compartir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialActionPrimary,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleOpenSocialUrl(social.url)}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={openButtonContentColor}
                  />
                  <Text
                    style={[
                      styles.socialActionPrimaryText,
                      { color: openButtonContentColor },
                    ]}
                  >
                    Abrir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedSocial)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSocial(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                QR de Campana
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={() => setSelectedSocial(null)}
              >
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedSocial?.url ? (
              <>
                <View style={styles.qrWrap}>
                  <QRCode value={selectedSocial.url} size={220} />
                </View>

                <Text style={[styles.qrLabel, { color: colors.text }]}>
                  {selectedSocial.label}
                </Text>
                <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
                  Escanea para abrir y compartir desde la red social oficial.
                </Text>
              </>
            ) : (
              <View style={styles.qrMissingWrap}>
                <Ionicons
                  name="warning-outline"
                  size={32}
                  color={colors.warning}
                />
                <Text
                  style={[
                    styles.qrMissingText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Esta red no tiene link en CMS, no se puede generar el QR.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  heroStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  socialItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    gap: 12,
  },
  socialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPreviewWrap: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
  },
  socialInfo: { flex: 1, gap: 2 },
  socialLabel: { fontSize: 16, fontWeight: "700" },
  socialPlatform: { fontSize: 12, textTransform: "capitalize" },
  socialActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  socialAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  socialActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  socialActionPrimary: {
    flex: 1.25,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  socialActionPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qrWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  qrLabel: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  qrHint: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  qrMissingWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
  },
  qrMissingText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
});
