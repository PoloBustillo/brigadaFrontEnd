import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { getMyTeamSummary } from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EncargadoHome() {
  const colors = useThemeColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof getMyTeamSummary>
  > | null>(null);

  const load = async () => {
    setError(false);
    try {
      const data = await getMyTeamSummary();
      setSummary(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = useMemo(
    () => [
      {
        key: "team",
        title: "Equipo",
        subtitle: `${summary?.stats.team_members ?? 0} brigadistas`,
        icon: "people-outline" as const,
        color: colors.primary,
        route: "/(encargado)/team" as const,
      },
      {
        key: "surveys",
        title: "Encuestas",
        subtitle: `${summary?.stats.surveys ?? 0} en seguimiento`,
        icon: "document-text-outline" as const,
        color: colors.success,
        route: "/(encargado)/surveys" as const,
      },
      {
        key: "responses",
        title: "Respuestas",
        subtitle: `${summary?.stats.submissions ?? 0} capturas`,
        icon: "clipboard-outline" as const,
        color: colors.info,
        route: "/(encargado)/responses" as const,
      },
      {
        key: "map",
        title: "Mapa",
        subtitle: "Última ubicación de campo",
        icon: "map-outline" as const,
        color: colors.warning,
        route: "/(encargado)/map" as const,
      },
    ],
    [summary, colors],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Home" subtitle="Seguimiento operativo" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {error && (
            <TouchableOpacity
              style={[
                styles.errorBanner,
                { backgroundColor: colors.error + "15" },
              ]}
              onPress={load}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                No se pudo cargar. Toca para reintentar.
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.grid}>
            {cards.map((card) => (
              <TouchableOpacity
                key={card.key}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.icon, { backgroundColor: card.color + "20" }]}
                >
                  <Ionicons name={card.icon} size={24} color={card.color} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {card.title}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {card.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12 },
  errorBanner: { borderRadius: 10, padding: 12 },
  errorText: { textAlign: "center", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
});
