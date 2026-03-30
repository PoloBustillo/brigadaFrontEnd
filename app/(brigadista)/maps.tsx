import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type MapsTab = "sections" | "progress";

export default function BrigadistaMapsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const currentTab: MapsTab =
    params.tab === "progress" ? "progress" : "sections";

  const openGoogleMaps = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = "https://www.google.com/maps";
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return;
    await Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Mapas"
        subtitle="Secciones y avances territoriales"
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={openGoogleMaps}
          activeOpacity={0.8}
        >
          <Ionicons name="layers-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Secciones</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Abrir mapa para visualizar secciones y ubicaciones.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/(brigadista)/tracking" as any)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trending-up-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.title, { color: colors.text }]}>Avances</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Revisar el estado de seguimiento y progreso actual.
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Vista actual: {currentTab === "sections" ? "Secciones" : "Avances"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 12, marginTop: 6 },
});
