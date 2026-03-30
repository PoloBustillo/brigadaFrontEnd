import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BrigadistaTrackingScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Seguimiento"
        subtitle="Monitoreo de la jornada"
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Panel de seguimiento
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            En esta pantalla se concentrara el avance operativo del brigadista.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }]}
          onPress={() =>
            router.push("/(brigadista)/questionnaires?filter=active" as any)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>Ver cuestionarios activos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 14 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
  action: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
