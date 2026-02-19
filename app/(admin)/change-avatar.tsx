/**
 * Change Avatar Screen - Brigadista
 * Cambiar foto de perfil del usuario
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { updateProfile, uploadAvatar } from "@/lib/api/auth";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangeAvatarScreen() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const handleBack = () => {
    router.push("/(admin)/profile" as any);
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso Requerido",
        "Se necesita permiso para acceder a la cámara",
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso Requerido",
        "Se necesita permiso para acceder a la galería",
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Save avatar — uploads via backend which handles Cloudinary
  const handleSave = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Por favor selecciona una imagen");
      return;
    }

    setUploading(true);

    try {
      const updatedUser = await uploadAvatar(selectedImage);
      await updateUser(updatedUser);

      Alert.alert("Éxito", "Foto de perfil actualizada correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", error.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  // Remove avatar
  const handleRemove = () => {
    Alert.alert(
      "Eliminar Foto",
      "¿Estás seguro de que quieres eliminar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedUser = await updateProfile({ avatar_url: null });
              await updateUser(updatedUser);
              setSelectedImage(null);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar la foto",
              );
            }
          },
        },
      ],
    );
  };

  const currentAvatar = selectedImage || user?.avatar_url || null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Foto de Perfil
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons name="person" size={80} color={colors.primary} />
              </View>
            )}
          </View>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            {currentAvatar
              ? "Esta es tu foto de perfil actual"
              : "Aún no tienes foto de perfil"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={takePhoto}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="camera" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Tomar Foto
              </Text>
              <Text
                style={[styles.actionSubtitle, { color: colors.textSecondary }]}
              >
                Usa la cámara para tomar una nueva foto
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={pickImage}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.info + "20" },
              ]}
            >
              <Ionicons name="images" size={24} color={colors.info} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Elegir de Galería
              </Text>
              <Text
                style={[styles.actionSubtitle, { color: colors.textSecondary }]}
              >
                Selecciona una foto de tu galería
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {currentAvatar && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={handleRemove}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: colors.error + "20" },
                ]}
              >
                <Ionicons name="trash" size={24} color={colors.error} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  Eliminar Foto
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Quitar tu foto de perfil actual
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.info + "10" }]}
        >
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>
            Las fotos se recortan automáticamente en forma cuadrada. Usa una
            imagen de al menos 300x300 píxeles para mejor calidad.
          </Text>
        </View>

        {/* Save Button */}
        {selectedImage && (
          <Button
            title={uploading ? "Subiendo..." : "Guardar Foto"}
            onPress={handleSave}
            loading={uploading}
            disabled={uploading}
            style={styles.saveButton}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerRight: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 14,
    textAlign: "center",
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  saveButton: {
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
