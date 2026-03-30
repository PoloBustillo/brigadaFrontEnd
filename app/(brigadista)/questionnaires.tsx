import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

type FilterType = "active" | "completed" | "pending";
type TemporalType = "active" | "upcoming" | "expired";

export default function BrigadistaQuestionnairesScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string; temporal?: string }>();

  const filter: FilterType =
    params.filter === "completed" || params.filter === "pending"
      ? params.filter
      : "active";

  const temporal: TemporalType =
    params.temporal === "upcoming" || params.temporal === "expired"
      ? params.temporal
      : "active";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Cuestionarios"
        subtitle="Activos, completados y pendientes"
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primary + "18",
              borderColor: colors.primary + "3d",
            },
          ]}
        >
          <Ionicons name="funnel-outline" size={16} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            Filtro: {filter}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.info + "18",
              borderColor: colors.info + "3d",
            },
          ]}
        >
          <Ionicons name="time-outline" size={16} color={colors.info} />
          <Text style={[styles.badgeText, { color: colors.info }]}>
            Temporal: {temporal}
          </Text>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Esta pantalla queda preparada para reemplazar el flujo legacy de
          my-surveys y surveys/responses.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  description: { fontSize: 13, lineHeight: 20, marginTop: 8 },
});
