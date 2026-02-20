/**
 * ✍️ SIGNATURE QUESTION — Digital signature capture
 * UX:
 * - Full-width canvas area with clear visual boundaries
 * - "Firma aquí" hint when empty
 * - Clear / Undo buttons
 * - Saves as base64 data URI
 * - Mini-preview of captured signature
 * - WebView-based react-native-signature-canvas for smooth drawing
 * - Taller canvas for comfortable signing
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SignatureCanvas from "react-native-signature-canvas";

interface SignatureQuestionProps {
  value: string | null; // base64 data URI
  onChange: (value: string | null) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

export function SignatureQuestion({
  value,
  onChange,
  colors: colorsProp,
}: SignatureQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const signatureRef = useRef<SignatureCanvas>(null);
  const fullscreenSignatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const handleEnd = () => {
    // Read the current signature
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    if (signature) {
      setIsEmpty(false);
      onChange(signature);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleEmpty = () => {
    setIsEmpty(true);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signatureRef.current?.clearSignature();
    setIsEmpty(true);
    onChange(null);
  };

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signatureRef.current?.undo();
  };

  // --- Fullscreen handlers ---
  const handleFullscreenOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFullscreenOpen(true);
  };

  const handleFullscreenEnd = () => {
    fullscreenSignatureRef.current?.readSignature();
  };

  const handleFullscreenOK = (signature: string) => {
    if (signature) {
      setIsEmpty(false);
      onChange(signature);
    }
  };

  const handleFullscreenDone = () => {
    fullscreenSignatureRef.current?.readSignature();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFullscreenOpen(false);
  };

  const handleFullscreenClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fullscreenSignatureRef.current?.clearSignature();
  };

  const handleFullscreenUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fullscreenSignatureRef.current?.undo();
  };

  // Canvas web style for the internal WebView
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; margin: 0; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body, html { margin: 0; padding: 0; background: transparent; }
    canvas { width: 100% !important; height: 100% !important; touch-action: none; }
  `;

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={[styles.hintRow, { backgroundColor: colors.overlay }]}>
        <Ionicons name="pencil" size={16} color={colors.primary} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Dibuja tu firma dentro del recuadro con el dedo
        </Text>
      </View>

      {/* Signature canvas */}
      <View
        style={[
          styles.canvasContainer,
          {
            borderColor: isEmpty ? colors.border : colors.primary,
            backgroundColor: "#fff",
          },
        ]}
      >
        {/* Placeholder hint */}
        {isEmpty && (
          <View style={styles.placeholderOverlay} pointerEvents="none">
            <Ionicons name="finger-print-outline" size={32} color="#ddd" />
            <Text style={styles.placeholderText}>Firma aquí</Text>
            <View style={styles.placeholderLine} />
          </View>
        )}

        <SignatureCanvas
          ref={signatureRef}
          onEnd={handleEnd}
          onOK={handleOK}
          onEmpty={handleEmpty}
          webStyle={webStyle}
          backgroundColor="rgba(255,255,255,0)"
          penColor="#1a1a1a"
          minWidth={1.5}
          maxWidth={3.5}
          dotSize={2}
          autoClear={false}
          descriptionText=""
          imageType="image/png"
          dataURL
          style={styles.canvas}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={handleUndo}
          activeOpacity={0.7}
          accessibilityLabel="Deshacer último trazo"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-undo" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
            Deshacer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: colors.error + "40",
              backgroundColor: colors.surface,
            },
          ]}
          onPress={handleClear}
          activeOpacity={0.7}
          accessibilityLabel="Limpiar firma"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={[styles.actionBtnText, { color: colors.error }]}>
            Limpiar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: colors.primary + "40",
              backgroundColor: colors.surface,
            },
          ]}
          onPress={handleFullscreenOpen}
          activeOpacity={0.7}
          accessibilityLabel="Abrir firma en pantalla completa"
          accessibilityRole="button"
        >
          <Ionicons name="expand-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            Expandir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status + mini-preview */}
      {!isEmpty && value && (
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.success + "10",
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Firma capturada
            </Text>
          </View>
          <Image
            source={{ uri: value }}
            style={styles.miniPreview}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleFullscreenDone}
      >
        <View
          style={[
            styles.fullscreenContainer,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Fullscreen header */}
          <View
            style={[
              styles.fullscreenHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.fullscreenTitle, { color: colors.text }]}>
              Firma
            </Text>
            <TouchableOpacity
              onPress={handleFullscreenDone}
              style={[
                styles.fullscreenDoneBtn,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Guardar firma y cerrar"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={20} color={colors.background} />
              <Text
                style={[
                  styles.fullscreenDoneBtnText,
                  { color: colors.background },
                ]}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fullscreen canvas */}
          <View
            style={[
              styles.fullscreenCanvas,
              { borderColor: colors.border, backgroundColor: "#fff" },
            ]}
          >
            <SignatureCanvas
              ref={fullscreenSignatureRef}
              onEnd={handleFullscreenEnd}
              onOK={handleFullscreenOK}
              onEmpty={handleEmpty}
              webStyle={webStyle}
              backgroundColor="rgba(255,255,255,0)"
              penColor="#1a1a1a"
              minWidth={1.5}
              maxWidth={3.5}
              dotSize={2}
              autoClear={false}
              descriptionText=""
              imageType="image/png"
              dataURL
              style={{ flex: 1 }}
            />
          </View>

          {/* Fullscreen action buttons */}
          <View style={[styles.fullscreenActions, { paddingHorizontal: 16 }]}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  flex: 1,
                },
              ]}
              onPress={handleFullscreenUndo}
              activeOpacity={0.7}
              accessibilityLabel="Deshacer último trazo"
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-undo"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.actionBtnText, { color: colors.textSecondary }]}
              >
                Deshacer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.error + "40",
                  backgroundColor: colors.surface,
                  flex: 1,
                },
              ]}
              onPress={handleFullscreenClear}
              activeOpacity={0.7}
              accessibilityLabel="Limpiar firma"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  canvasContainer: {
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  canvas: {
    flex: 1,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    gap: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "300",
    color: "#ccc",
    letterSpacing: 1,
  },
  placeholderLine: {
    width: "60%",
    height: 1,
    backgroundColor: "#ddd",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  miniPreview: {
    width: "100%",
    height: 60,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  // Fullscreen modal styles
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  fullscreenDoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenDoneBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  fullscreenCanvas: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  fullscreenActions: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
  },
});
