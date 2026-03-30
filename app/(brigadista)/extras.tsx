import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function BrigadistaExtrasScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Extras"
        subtitle="Accesos complementarios"
        onBackPress={() => router.back()}
      />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Modulo en configuracion
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Este espacio queda disponible para accesos adicionales definidos por
          producto.
        </Text>
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
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
});
