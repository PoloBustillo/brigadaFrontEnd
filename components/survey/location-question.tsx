/**
 * 📍 LOCATION QUESTION — GPS coordinate capture
 * UX:
 * - Requests foreground location permission on demand
 * - Shows latitude / longitude / accuracy when captured
 * - "Ver en mapa" opens native maps app
 * - Re-capture button to update location
 * - Haptic feedback
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface LocationValue {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationQuestionProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

function formatCoord(n: number, decimals = 6): string {
  return n.toFixed(decimals);
}

function openInMaps(lat: number, lon: number) {
  const url = `https://maps.google.com/?q=${lat},${lon}`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Error", "No se pudo abrir la app de mapas."),
  );
}

export function LocationQuestion({
  value,
  onChange,
  colors: colorsProp,
}: LocationQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [loading, setLoading] = useState(false);

  const captureLocation = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu ubicación para registrar las coordenadas.",
          [{ text: "OK" }],
        );
        return;
      }

      // Get position (balanced accuracy)
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChange({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    } catch (err) {
      console.error("LocationQuestion error:", err);
      Alert.alert(
        "Error de ubicación",
        "No se pudo obtener la ubicación. Verifica que el GPS esté activado.",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(null);
  };

  // ── Captured state ──────────────────────────────────────────────────────────
  if (value) {
    const date = new Date(value.timestamp).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={[
          styles.capturedCard,
          { borderColor: colors.border ?? "#e0e0e0" },
        ]}
      >
        {/* Header */}
        <View style={styles.capturedHeader}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="location" size={22} color={colors.primary} />
          </View>
          <View style={styles.capturedHeaderText}>
            <Text style={[styles.capturedTitle, { color: colors.text }]}>
              Ubicación capturada
            </Text>
            <Text
              style={[styles.capturedSub, { color: colors.textSecondary ?? "#888" }]}
            >
              {date}
            </Text>
          </View>
        </View>

        {/* Coordinates */}
        <View style={styles.coordRow}>
          <View style={styles.coordItem}>
            <Text style={[styles.coordLabel, { color: colors.textSecondary ?? "#888" }]}>
              Latitud
            </Text>
            <Text style={[styles.coordValue, { color: colors.text }]}>
              {formatCoord(value.latitude)}
            </Text>
          </View>
          <View style={styles.coordSep} />
          <View style={styles.coordItem}>
            <Text style={[styles.coordLabel, { color: colors.textSecondary ?? "#888" }]}>
              Longitud
            </Text>
            <Text style={[styles.coordValue, { color: colors.text }]}>
              {formatCoord(value.longitude)}
            </Text>
          </View>
        </View>

        {/* Accuracy badge */}
        {value.accuracy !== null && (
          <View
            style={[
              styles.accuracyBadge,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons
              name="radio-button-on"
              size={12}
              color={colors.primary}
            />
            <Text style={[styles.accuracyText, { color: colors.primary }]}>
              Precisión ±{Math.round(value.accuracy)} m
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: colors.border ?? "#e0e0e0" },
            ]}
            onPress={() => openInMaps(value.latitude, value.longitude)}
          >
            <Ionicons name="map-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              Ver en mapa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: colors.border ?? "#e0e0e0" },
            ]}
            onPress={captureLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.primary}
              />
            )}
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              Actualizar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: colors.border ?? "#e0e0e0" },
            ]}
            onPress={clearLocation}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.error ?? "#ff3b30"}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: colors.error ?? "#ff3b30" },
              ]}
            >
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[
        styles.captureBtn,
        {
          borderColor: colors.border ?? "#e0e0e0",
          backgroundColor: colors.surface ?? "#fafafa",
        },
      ]}
      onPress={captureLocation}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.captureBtnText, { color: colors.primary }]}>
            Obteniendo ubicación…
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
          <Text style={[styles.captureBtnText, { color: colors.primary }]}>
            Capturar ubicación
          </Text>
          <Text
            style={[
              styles.captureBtnHint,
              { color: colors.textSecondary ?? "#888" },
            ]}
          >
            Usará el GPS del dispositivo
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  captureBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  captureBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  captureBtnHint: {
    fontSize: 12,
  },
  capturedCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  capturedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  capturedHeaderText: {
    flex: 1,
    gap: 2,
  },
  capturedTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  capturedSub: {
    fontSize: 12,
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coordItem: {
    flex: 1,
    gap: 2,
  },
  coordSep: {
    width: 1,
    height: 32,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  coordLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  accuracyBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
