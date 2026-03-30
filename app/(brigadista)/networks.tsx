import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import {
  type SocialLinkItem,
  fetchPublicAppConfig,
} from "@/lib/api/app-config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BrigadistaNetworksScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Redes"
        subtitle="Enlaces publicos configurados en CMS"
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {socialLinks.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay redes configuradas por el momento.
          </Text>
        ) : (
          socialLinks.map((social, index) => (
            <TouchableOpacity
              key={`${social.platform}-${index}`}
              style={[
                styles.socialItem,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => handleOpenSocialUrl(social.url)}
              activeOpacity={0.8}
            >
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
              <Ionicons name="open-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 20 },
  socialItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  socialInfo: { flex: 1, gap: 2 },
  socialLabel: { fontSize: 15, fontWeight: "700" },
  socialPlatform: { fontSize: 12, textTransform: "capitalize" },
});
