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
  const fullscreenSignatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const handleEmpty = () => {
    setIsEmpty(true);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEmpty(true);
    onChange(null);
  };

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fullscreenSignatureRef.current?.undo();
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
    .m-signature-pad--body { border: none; position: relative; }
    .m-signature-pad--body::after {
      content: '';
      position: absolute;
      left: 48px;
      right: 48px;
      bottom: 30%;
      height: 1.5px;
      background: rgba(100,100,100,0.15);
      pointer-events: none;
      z-index: 1;
    }
    .m-signature-pad--footer { display: none; }
    body, html { margin: 0; padding: 0; background: transparent; }
    canvas { width: 100% !important; height: 100% !important; touch-action: none; }
  `;

  return (
    <View style={styles.container}>
      {/* ── No signature yet: illustration card + CTA ── */}
      {isEmpty ? (
        <View
          style={[
            styles.signEmptyCard,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          {/* Signature illustration zone */}
          <TouchableOpacity
            style={[
              styles.signIllustrationArea,
              {
                borderColor: colors.primary + "40",
                backgroundColor: colors.primary + "06",
              },
            ]}
            onPress={handleFullscreenOpen}
            activeOpacity={0.7}
            accessibilityLabel="Abrir panel de firma"
          >
            <Ionicons
              name="create-outline"
              size={38}
              color={colors.primary}
              style={{ opacity: 0.45 }}
            />
            <View style={styles.signGuideBaselineRow}>
              <View
                style={[
                  styles.signGuideBaseline,
                  { backgroundColor: colors.textTertiary ?? "#ccc" },
                ]}
              />
              <Text
                style={[
                  styles.signGuideLabel,
                  { color: colors.textTertiary ?? "#bbb" },
                ]}
              >
                Firma aquí
              </Text>
              <View
                style={[
                  styles.signGuideBaseline,
                  { backgroundColor: colors.textTertiary ?? "#ccc" },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.signBtn, { backgroundColor: colors.primary }]}
            onPress={handleFullscreenOpen}
            activeOpacity={0.8}
            accessibilityLabel="Abrir panel de firma"
            accessibilityRole="button"
          >
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.signBtnText}>Firmar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Signature captured: preview + actions ── */
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.success + "10",
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.previewLabel, { color: colors.success }]}>
              Firma capturada
            </Text>
          </View>
          {value && (
            <Image
              source={{ uri: value }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={handleFullscreenOpen}
              activeOpacity={0.7}
              accessibilityLabel="Editar firma"
              accessibilityRole="button"
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                Editar
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
              accessibilityLabel="Eliminar firma"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Fullscreen modal ── */}
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

          {/* Canvas instruction hint */}
          <View
            style={[
              styles.fullscreenInstruction,
              { backgroundColor: colors.overlay },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.fullscreenInstructionText,
                { color: colors.textSecondary },
              ]}
            >
              Usa el dedo para dibujar tu firma · Toca "Listo" cuando termines
            </Text>
          </View>

          {/* Fullscreen canvas */}
          <View
            style={[
              styles.fullscreenCanvas,
              { borderColor: colors.border, backgroundColor: "#fff" },
            ]}
          >
            {isEmpty && (
              <View
                pointerEvents="none"
                style={styles.fullscreenCanvasHint}
              >
                <Ionicons
                  name="pencil-outline"
                  size={36}
                  color="rgba(100,100,100,0.22)"
                />
                <Text style={styles.fullscreenCanvasHintText}>
                  Dibuja tu firma
                </Text>
              </View>
            )}
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

  // ── Sign empty state ──────────────────────────
  signEmptyCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  signIllustrationArea: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 14,
  },
  signGuideBaselineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  signGuideBaseline: {
    flex: 1,
    height: 1,
    opacity: 0.25,
  },
  signGuideLabel: {
    fontSize: 12,
    opacity: 0.5,
  },
  signBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  signBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Signed preview ────────────────────────────
  previewCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    backgroundColor: "#fafafa",
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

  // ── Fullscreen extras ───────────────────────
  fullscreenInstruction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fullscreenInstructionText: {
    fontSize: 12,
    flex: 1,
  },
  fullscreenCanvasHint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  fullscreenCanvasHintText: {
    fontSize: 15,
    color: "rgba(100,100,100,0.35)",
  },

  // ── Fullscreen modal ──────────────────────────
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
