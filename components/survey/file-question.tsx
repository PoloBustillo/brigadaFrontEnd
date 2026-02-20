/**
 * 📎 FILE QUESTION — Document / File attachment
 * UX:
 * - Single or multiple file picker via expo-document-picker
 * - Respects allowedTypes & maxSizeMB from validation_rules
 * - Shows filename, size, MIME type icon
 * - Remove attachment option
 * - Haptic feedback
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface FileValue {
  uri: string;
  name: string;
  mimeType: string | undefined;
  size: number | undefined;
}

interface FileQuestionProps {
  value: FileValue | null;
  onChange: (value: FileValue | null) => void;
  colors?: ReturnType<typeof useThemeColors>;
  question?: {
    validation_rules?: {
      allowedTypes?: string[]; // e.g. ["application/pdf", "image/*"]
      maxSizeMB?: number;
    };
  };
}

/** Returns an Ionicons name that represents a MIME type */
function iconForMime(mimeType: string | undefined): string {
  if (!mimeType) return "document-outline";
  if (mimeType.startsWith("image/")) return "image-outline";
  if (mimeType === "application/pdf") return "document-text-outline";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "grid-outline";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document-outline";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive-outline";
  return "attach-outline";
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileQuestion({
  value,
  onChange,
  colors: colorsProp,
  question,
}: FileQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [loading, setLoading] = useState(false);

  const allowedTypes = question?.validation_rules?.allowedTypes;
  const maxSizeMB = question?.validation_rules?.maxSizeMB;

  const pickFile = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes ?? "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Validate size
      if (maxSizeMB !== undefined && asset.size !== undefined) {
        const sizeMB = asset.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          Alert.alert(
            "Archivo demasiado grande",
            `El archivo supera el límite de ${maxSizeMB} MB (${formatBytes(asset.size)}).`,
          );
          return;
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChange({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      });
    } catch (err) {
      console.error("FileQuestion error:", err);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(null);
  };

  // ── Attached state ─────────────────────────────────────────────────────────
  if (value) {
    const iconName = iconForMime(value.mimeType) as any;
    return (
      <View style={styles.attachedCard}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name={iconName} size={28} color={colors.primary} />
        </View>
        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, { color: colors.text }]}
            numberOfLines={2}
          >
            {value.name}
          </Text>
          {value.size !== undefined && (
            <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
              {formatBytes(value.size)}
              {value.mimeType ? `  ·  ${value.mimeType}` : ""}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={removeFile}
          style={styles.removeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={22} color={colors.error ?? "#ff3b30"} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[
        styles.pickBtn,
        {
          borderColor: colors.border ?? "#e0e0e0",
          backgroundColor: colors.surface ?? "#fafafa",
        },
      ]}
      onPress={pickFile}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="attach" size={24} color={colors.primary} />
          <Text style={[styles.pickBtnText, { color: colors.primary }]}>
            Adjuntar archivo
          </Text>
        </>
      )}
      {allowedTypes && (
        <Text style={[styles.pickBtnHint, { color: colors.textSecondary ?? "#888" }]}>
          {allowedTypes.join(", ")}
          {maxSizeMB ? `  ·  máx. ${maxSizeMB} MB` : ""}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pickBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  pickBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickBtnHint: {
    fontSize: 12,
    textAlign: "center",
  },
  attachedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    gap: 12,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  fileMeta: {
    fontSize: 12,
  },
  removeBtn: {
    padding: 4,
  },
});
