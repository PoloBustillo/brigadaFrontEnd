/**
 * PhotoQuestion — uses expo-image-picker (already installed)
 */
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type {
  PhotoQuestion as PhotoQ,
  QuestionAnswer,
} from "../types/question-base.types";

interface Props {
  question: PhotoQ;
  value?: string[]; // array of local file URIs
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function PhotoQuestion({
  question,
  value = [],
  onChange,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  const maxPhotos = question.maxPhotos ?? 5;
  const current: string[] = Array.isArray(value) ? value : [];
  const canAdd = current.length < maxPhotos;

  const emit = (uris: string[]) => {
    onChange({ questionId: question.id, value: uris, answeredAt: Date.now() });
  };

  const pickFromCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      quality: question.quality ?? 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      emit([...current, result.assets[0].uri]);
    }
  };

  const pickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: question.quality ?? 0.8,
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - current.length,
    });
    if (!result.canceled) {
      emit([...current, ...result.assets.map((a) => a.uri)]);
    }
  };

  const remove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    emit(current.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* Thumbnails */}
      <View style={styles.grid}>
        {current.map((uri, i) => (
          <View
            key={`${uri}-${i}`}
            style={[styles.thumb, { borderColor: colors.border }]}
          >
            <Image
              source={{ uri }}
              style={styles.thumbImage}
              contentFit="cover"
            />
            {!disabled && (
              <TouchableOpacity
                onPress={() => remove(i)}
                style={[styles.removeBtn, { backgroundColor: colors.error }]}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add tile */}
        {canAdd && !disabled && (
          <TouchableOpacity
            onPress={pickFromCamera}
            activeOpacity={0.8}
            style={[
              styles.thumb,
              styles.addTile,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + "10",
              },
            ]}
          >
            <Ionicons name="camera" size={28} color={colors.primary} />
            <Text style={[styles.addLabel, { color: colors.primary }]}>
              Foto
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buttons */}
      {!disabled && canAdd && question.allowGallery !== false && (
        <TouchableOpacity
          onPress={pickFromGallery}
          activeOpacity={0.8}
          style={[
            styles.galleryBtn,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={[styles.galleryLabel, { color: colors.primary }]}>
            Elegir de galería
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {current.length} / {maxPhotos} foto{maxPhotos !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  addTile: {
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderStyle: "dashed",
  },
  addLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  galleryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    textAlign: "right",
  },
});
