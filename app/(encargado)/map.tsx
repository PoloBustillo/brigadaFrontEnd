/**
 * Encargado Map Screen - View team members' last survey locations
 * Part of encargado dashboard for field operations oversight
 */

import { ScreenHeader } from "@/components/shared";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useUserRole } from "@/contexts/auth-context";
import {
  calculateFreshness,
  getLatestLocationsPerBrigadista,
  getTeamResponses,
} from "@/lib/api/map";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LocationMarker {
  user_id: number;
  brigadista_name: string;
  location: { latitude: number; longitude: number; accuracy?: number };
  completed_at: string;
  survey_title: string;
  freshness: string;
}

export default function MapScreen() {
  const userRole = useUserRole();
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      setError(null);
      const response = await getTeamResponses(0, 100);

      if (!response.items || response.items.length === 0) {
        setMarkers([]);
        setError("No hay ubicaciones disponibles");
        return;
      }

      // Get latest location per brigadista
      const locationMap = getLatestLocationsPerBrigadista(response.items);

      // Convert to markers array
      const markerList: LocationMarker[] = Array.from(locationMap.values()).map(
        (loc, idx) => ({
          user_id: idx,
          brigadista_name: loc.brigadista_name,
          location: loc.location,
          completed_at: loc.completed_at,
          survey_title: loc.survey_title,
          freshness: calculateFreshness(loc.completed_at),
        }),
      );

      setMarkers(markerList);
    } catch (err) {
      console.error("Error loading team locations:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar ubicaciones del equipo",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleOpenInMaps = (location: {
    latitude: number;
    longitude: number;
  }) => {
    const url = `maps://0,0?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web if maps app not available
      const webUrl = `https://www.google.com/maps/search/${location.latitude},${location.longitude}`;
      Linking.openURL(webUrl).catch(() => {
        console.error("No se pudo abrir el mapa");
      });
    });
  };

  const renderMarker = ({ item }: { item: LocationMarker }) => (
    <TouchableOpacity
      style={styles.markerCard}
      onPress={() => handleOpenInMaps(item.location)}
    >
      <View style={styles.markerHeader}>
        <ThemedText style={styles.brigadistaName} numberOfLines={1}>
          {item.brigadista_name}
        </ThemedText>
        <ThemedText style={styles.freshness}>{item.freshness}</ThemedText>
      </View>

      <ThemedText style={styles.surveyTitle} numberOfLines={1}>
        {item.survey_title || "Encuesta"}
      </ThemedText>

      <View style={styles.coordinatesContainer}>
        <ThemedText style={styles.coordinates}>
          📍 {item.location.latitude.toFixed(4)},{" "}
          {item.location.longitude.toFixed(4)}
        </ThemedText>
        {item.location.accuracy && (
          <ThemedText style={styles.accuracy}>
            ±{Math.round(item.location.accuracy)}m precisión
          </ThemedText>
        )}
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Toca para abrir mapa</ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (userRole !== "ENCARGADO") {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Solo encargados pueden ver el mapa del equipo</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader
        title="Ubicaciones del Equipo"
        subtitle="Últimas encuestas completadas por tu equipo"
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            Cargando ubicaciones...
          </ThemedText>
        </View>
      ) : error && markers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : markers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Tu equipo aún no ha completado encuestas
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={markers}
          renderItem={renderMarker}
          keyExtractor={(item, idx) => `marker-${idx}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No hay ubicaciones disponibles
              </ThemedText>
            </View>
          }
        />
      )}

      <View style={styles.infoBar}>
        <ThemedText style={styles.infoText}>
          Mostrando {markers.length} ubicación{markers.length !== 1 ? "es" : ""}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  markerCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  brigadistaName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  freshness: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
  surveyTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  coordinatesContainer: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  coordinates: {
    fontSize: 12,
    color: colors.text,
    fontFamily: "monospace",
    marginBottom: spacing.xs,
  },
  accuracy: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  infoBar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
