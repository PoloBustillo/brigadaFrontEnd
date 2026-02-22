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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export interface LocationValue {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  address?: string | null;
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

/** Generates a self-contained HTML page with a Leaflet.js map centered on the location */
function buildMapHtml(lat: number, lon: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:100vw; height:100vh; overflow:hidden; }
    #map { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false })
      .setView([${lat}, ${lon}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    var icon = L.divIcon({
      html: '<div style="width:24px;height:24px;border-radius:50%;background:#e91e8c;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: ''
    });
    var marker = L.marker([${lat}, ${lon}], { icon: icon, draggable: true }).addTo(map);

    function emit(lat, lon) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_changed',
          latitude: lat,
          longitude: lon
        }));
      }
    }

    marker.on('dragend', function(e) {
      var p = e.target.getLatLng();
      emit(p.lat, p.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      emit(e.latlng.lat, e.latlng.lng);
    });
  </script>
</body>
</html>`;
}

export function LocationQuestion({
  value,
  onChange,
  colors: colorsProp,
}: LocationQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      setAddressLoading(true);
      setAddressError(null);
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (!result?.length) return null;
      const first = result[0];
      const parts = [
        first.street,
        first.streetNumber,
        first.district,
        first.city,
        first.region,
        first.postalCode,
      ].filter(Boolean);
      return parts.join(", ") || null;
    } catch {
      setAddressError("No se pudo obtener la dirección exacta.");
      return null;
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (!value?.latitude || !value?.longitude || value.address) return;
    resolveAddress(value.latitude, value.longitude).then((address) => {
      if (!address || !value) return;
      onChange({ ...value, address });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.latitude, value?.longitude]);

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
      const address = await resolveAddress(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      onChange({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
        address,
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
              style={[
                styles.capturedSub,
                { color: colors.textSecondary ?? "#888" },
              ]}
            >
              {date}
            </Text>
          </View>
        </View>

        {/* Coordinates */}
        <View style={styles.coordRow}>
          <View style={styles.coordItem}>
            <Text
              style={[
                styles.coordLabel,
                { color: colors.textSecondary ?? "#888" },
              ]}
            >
              Latitud
            </Text>
            <Text style={[styles.coordValue, { color: colors.text }]}>
              {formatCoord(value.latitude)}
            </Text>
          </View>
          <View style={styles.coordSep} />
          <View style={styles.coordItem}>
            <Text
              style={[
                styles.coordLabel,
                { color: colors.textSecondary ?? "#888" },
              ]}
            >
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
            <Ionicons name="radio-button-on" size={12} color={colors.primary} />
            <Text style={[styles.accuracyText, { color: colors.primary }]}>
              Precisión ±{Math.round(value.accuracy)} m
            </Text>
          </View>
        )}

        <View
          style={[
            styles.addressCard,
            {
              borderColor: colors.border ?? "#e0e0e0",
              backgroundColor: colors.surface ?? "#fafafa",
            },
          ]}
        >
          <Ionicons name="home-outline" size={14} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.addressLabel,
                { color: colors.textSecondary ?? "#888" },
              ]}
            >
              Dirección aproximada
            </Text>
            {addressLoading ? (
              <Text
                style={[
                  styles.addressValue,
                  { color: colors.textSecondary ?? "#888" },
                ]}
              >
                Buscando dirección…
              </Text>
            ) : value.address ? (
              <Text style={[styles.addressValue, { color: colors.text }]}>
                {value.address}
              </Text>
            ) : (
              <Text
                style={[
                  styles.addressValue,
                  { color: colors.textSecondary ?? "#888" },
                ]}
              >
                No disponible
              </Text>
            )}
            {addressError ? (
              <Text
                style={[
                  styles.addressError,
                  { color: colors.error ?? "#ff3b30" },
                ]}
              >
                {addressError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Embedded map preview */}
        <View style={[styles.mapContainer, { borderColor: colors.border }]}>
          <WebView
            source={{ html: buildMapHtml(value.latitude, value.longitude) }}
            style={styles.mapWebView}
            scrollEnabled={false}
            javaScriptEnabled
            onMessage={(event) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data || "{}");
                if (payload?.type !== "location_changed") return;
                const latitude = Number(payload.latitude);
                const longitude = Number(payload.longitude);
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                  return;
                }

                onChange({
                  ...value,
                  latitude,
                  longitude,
                  timestamp: Date.now(),
                  address: null,
                });

                resolveAddress(latitude, longitude).then((address) => {
                  if (!address) return;
                  onChange({
                    ...value,
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                    address,
                  });
                });
              } catch {
                // Ignore malformed webview messages
              }
            }}
            originWhitelist={["*"]}
            mixedContentMode="always"
            androidLayerType="hardware"
          />
        </View>

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
              Abrir Maps
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
              GPS actual
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
  addressCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  addressError: {
    fontSize: 11,
    marginTop: 4,
  },
  mapContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    height: 200,
  },
  mapWebView: {
    flex: 1,
    backgroundColor: "transparent",
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
