/**
 * 📷 PHOTO QUESTION — Camera / Gallery capture
 * UX:
 * - Big camera button (primary action for field work)
 * - Gallery as secondary option
 * - Image preview with retake option
 * - Compressed to 0.6 quality to save bandwidth
 * - Works fully offline — stores URI locally
 * - Haptic feedback
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PhotoQuestionProps {
  value: string | null; // URI of the captured image
  onChange: (value: string | null) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function PhotoQuestion({
  value,
  onChange,
  colors: colorsProp,
}: PhotoQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [loading, setLoading] = useState(false);

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para capturar fotos.",
        );
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo abrir la cámara.");
    } finally {
      setLoading(false);
    }
  };

  const launchGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la galería para seleccionar fotos.",
        );
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo abrir la galería.");
    } finally {
      setLoading(false);
    }
  };

  const clearPhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("¿Eliminar foto?", "Se borrará la foto seleccionada.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => onChange(null) },
    ]);
  };

  // ── Has image → show preview ──────────────────────────────────────
  if (value) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.previewCard,
            { borderColor: colors.success, backgroundColor: colors.surface },
          ]}
        >
          <Image source={{ uri: value }} style={styles.previewImage} />

          {/* Overlay badge */}
          <View
            style={[styles.successBadge, { backgroundColor: colors.success }]}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={styles.successBadgeText}>Foto capturada</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.retakeBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={launchCamera}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={[styles.retakeBtnText, { color: colors.primary }]}>
              Tomar otra
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.retakeBtn,
              {
                borderColor: colors.error + "40",
                backgroundColor: colors.surface,
              },
            ]}
            onPress={clearPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.retakeBtnText, { color: colors.error }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── No image → capture buttons ────────────────────────────────────
  return (
    <View style={styles.container}>
      {loading ? (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Abriendo cámara...
          </Text>
        </View>
      ) : (
        <>
          {/* Primary: Camera */}
          <TouchableOpacity
            style={[styles.cameraBtn, { backgroundColor: colors.primary }]}
            onPress={launchCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={32} color="#fff" />
            <Text style={styles.cameraBtnText}>Tomar foto</Text>
            <Text style={styles.cameraBtnHint}>
              Abre la cámara del dispositivo
            </Text>
          </TouchableOpacity>

          {/* Secondary: Gallery */}
          <TouchableOpacity
            style={[
              styles.galleryBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={launchGallery}
            activeOpacity={0.7}
          >
            <Ionicons
              name="images-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.galleryBtnText, { color: colors.textSecondary }]}
            >
              Seleccionar de galería
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // ── Capture buttons ──────────────────────────
  cameraBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    borderRadius: 16,
    gap: 6,
  },
  cameraBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cameraBtnHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  galleryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Loading ──────────────────────────────────
  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  // ── Preview ──────────────────────────────────
  previewCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  successBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  successBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Action row ───────────────────────────────
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
