import { ScreenHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import {
  getMyLatestScore,
  type LatestUserScoreResponse,
  type ScoreSnapshotDetail,
} from "@/lib/api/mobile";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScoreComponentKey = "activity" | "sync" | "quality";

const COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  activity: "Actividad",
  sync: "Sincronizacion",
  quality: "Calidad",
};

const COMPONENT_HINTS: Record<ScoreComponentKey, string> = {
  activity: "Volumen y cobertura de capturas en la ventana.",
  sync: "Rapidez para sincronizar respuestas capturadas.",
  quality: "Consistencia y menor riesgo de auto-respuesta.",
};

function formatDateRange(snapshot: ScoreSnapshotDetail): string {
  const start = new Date(snapshot.window_start).toLocaleDateString("es-MX");
  const end = new Date(snapshot.window_end).toLocaleDateString("es-MX");
  return `${start} - ${end}`;
}

export default function BrigadistaScoreDetailsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<LatestUserScoreResponse["snapshot"]>(null);

  const loadScore = async () => {
    setIsLoading(true);
    try {
      const data = await getMyLatestScore();
      setSnapshot(data.snapshot);
    } catch (err) {
      console.error("Error loading score details:", err);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScore().catch((err) => {
      console.error("Error bootstrapping score details:", err);
      setIsLoading(false);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const data = await getMyLatestScore();
      setSnapshot(data.snapshot);
    } catch (err) {
      console.error("Error refreshing score details:", err);
      setSnapshot(null);
    } finally {
      setRefreshing(false);
    }
  };

  const components = useMemo(() => {
    if (!snapshot?.component_scores)
      return [] as {
      key: ScoreComponentKey;
      label: string;
      value: number;
      hint: string;
      color: string;
      }[];

    return (Object.keys(COMPONENT_LABELS) as ScoreComponentKey[])
      .map((key) => {
        const rawValue = snapshot.component_scores?.[key];
        const value = Number(rawValue);
        if (Number.isNaN(value)) return null;

        let color = colors.success;
        if (value < 50) color = colors.error;
        else if (value < 75) color = colors.warning;

        return {
          key,
          label: COMPONENT_LABELS[key],
          value,
          hint: COMPONENT_HINTS[key],
          color,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [colors.error, colors.success, colors.warning, snapshot?.component_scores]);

  const actionItems = useMemo(() => {
    if (!snapshot?.action_items?.length) return [];
    return snapshot.action_items
      .map((item, index) => {
        const message = typeof item?.message === "string" ? item.message : "Sin detalle";
        const severity = typeof item?.severity === "string" ? item.severity : "low";

        let color = colors.info;
        if (severity === "high") color = colors.error;
        else if (severity === "medium") color = colors.warning;

        return {
          id: `${item?.type ?? "action"}-${index}`,
          message,
          severity,
          color,
        };
      })
      .filter((item) => item.message.trim().length > 0);
  }, [colors.error, colors.info, colors.warning, snapshot?.action_items]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScreenHeader
        title="Detalle de Score"
        subtitle="Actividad, sincronizacion y calidad"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + Math.max(insets.bottom, 12) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>Cargando score...</Text>
        ) : null}

        {!isLoading && !snapshot ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.title, { color: colors.text }]}>Sin score disponible</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Aun no hay un snapshot para tu cuenta en esta quincena.</Text>
          </View>
        ) : null}

        {snapshot ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>Score Global</Text>
                <Ionicons name="analytics" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.globalScore, { color: colors.primary }]}>{snapshot.score_global.toFixed(1)}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Ventana: {formatDateRange(snapshot)}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Respuestas analizadas: {snapshot.sample_size}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.title, { color: colors.text }]}>Componentes</Text>
              <View style={styles.componentList}>
                {components.map((component) => (
                  <View
                    key={component.key}
                    style={[
                      styles.componentRow,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <View style={styles.componentMeta}>
                      <Text style={[styles.componentLabel, { color: colors.text }]}>{component.label}</Text>
                      <Text style={[styles.componentHint, { color: colors.textSecondary }]}>{component.hint}</Text>
                    </View>
                    <Text style={[styles.componentValue, { color: component.color }]}>{component.value.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.title, { color: colors.text }]}>Recomendaciones Accionables</Text>
              {actionItems.length === 0 ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>No hay acciones pendientes para este periodo.</Text>
              ) : (
                <View style={styles.actionsList}>
                  {actionItems.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.actionItem,
                        {
                          borderColor: item.color + "44",
                          backgroundColor: item.color + "14",
                        },
                      ]}
                    >
                      <Ionicons name="alert-circle-outline" size={16} color={item.color} />
                      <Text style={[styles.actionText, { color: colors.text }]}>{item.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  helperText: {
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  globalScore: {
    fontSize: 34,
    fontWeight: "800",
  },
  componentList: {
    gap: 8,
    marginTop: 4,
  },
  componentRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  componentMeta: {
    flex: 1,
    gap: 2,
  },
  componentLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  componentHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  componentValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  actionsList: {
    gap: 8,
    marginTop: 4,
  },
  actionItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
