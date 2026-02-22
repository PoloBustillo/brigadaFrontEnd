/**
 * 🪪 INE QUESTION — Document credential capture + OCR
 * UX:
 * - Document Scanner with real-time edge detection + perspective correction
 * - Gallery fallback for pre-taken photos (still processed through ImageManipulator)
 * - Front & back capture support
 * - Preview with retake option
 * - ML Kit OCR: extract text from captured image and parse INE fields
 * - Auto-populate extracted data with editable confirmation
 */

import { useThemeColors } from "@/contexts/theme-context";
import { parseIneOcrText, type IneOcrResult } from "@/lib/ocr/ine-ocr-parser";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Lazy-load the native DocumentScanner module so the component doesn't crash
// in Expo Go (where native modules aren't linked).
type DocumentScannerModule = {
  scanDocument(options: {
    maxNumDocuments?: number;
    croppedImageQuality?: number;
    letUserAdjustCrop?: boolean;
  }): Promise<{ scannedImages: string[]; status: "cancel" | "success" }>;
};
function getDocumentScanner(): DocumentScannerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-document-scanner-plugin").default;
  } catch {
    return null;
  }
}

// Lazy-load the native ML Kit module so the component doesn't crash in
// Expo Go (where native modules aren't linked). In a real dev/production
// build the module is present via auto-linking and works normally.
type TextRecognitionResult = {
  text: string;
  blocks: {
    text: string;
    /** Bounding box of the block in the source image (pixels) */
    frame?: { x: number; y: number; width: number; height: number };
    lines: { text: string; confidence?: number }[];
  }[];
};
type TextRecognitionModule = {
  recognize(uri: string): Promise<TextRecognitionResult>;
};
function getTextRecognition(): TextRecognitionModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@react-native-ml-kit/text-recognition").default;
  } catch {
    return null;
  }
}

/** Returns true when the native ML Kit module is present but not linked (Expo Go). */
function isNotLinkedError(err: unknown): boolean {
  return (
    err instanceof Error && err.message.includes("doesn't seem to be linked")
  );
}

interface INEQuestionProps {
  value: any; // { front?: string; back?: string; ocrData?: INEOcrResult } or string
  onChange: (value: any) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

type INEData = {
  front: string | null;
  back: string | null;
  ocrData: INEOcrResult | null;
};

/** OCR-extracted data from the INE — re-exported from the parser module */
export type INEOcrResult = IneOcrResult;

/** Campos editables del resultado OCR (excluye las propiedades de confianza y el modelo) */
type IneTextField = keyof Omit<INEOcrResult, "confidence" | "fieldConfidence" | "modeloDetected">;

function parseValue(value: any): INEData {
  if (!value) return { front: null, back: null, ocrData: null };
  if (typeof value === "string")
    return { front: value, back: null, ocrData: null };
  return {
    front: value?.front ?? null,
    back: value?.back ?? null,
    ocrData: value?.ocrData ?? null,
  };
}

async function processDocumentImage(uri: string): Promise<string> {
  // Resize to 1600px: wide enough for crisp OCR yet reasonable for upload.
  // (Previous default was 1200px; ML Kit accuracy improves with larger input
  //  — especially for the 10pt CURP/Clave Elector text on Modelo D.)
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

// ── OCR helpers ────────────────────────────────────────────────────────────────
// (Pattern constants moved to lib/ocr/ine-ocr-parser.ts — see that module for
//  design decisions on CURP/Clave correction, multi-format dates, etc.)

/**
 * Runs ML Kit text recognition on both credential sides and delegates
 * field extraction to parseIneOcrText() in lib/ocr/ine-ocr-parser.ts.
 *
 * Keeping the async I/O (ML Kit calls) here and the pure parsing logic
 * in the separate module makes unit-testing the parser straightforward.
 */
async function extractIneOcr(
  frontUri: string | null,
  backUri: string | null,
): Promise<INEOcrResult> {
  const empty: INEOcrResult = {
    nombre: "", apellidoPaterno: "", apellidoMaterno: "",
    claveElector: "", curp: "", fechaNacimiento: "",
    sexo: "", seccion: "", vigencia: "", domicilio: "",
    modeloDetected: "unknown",
    confidence: 0,
    fieldConfidence: {
      nombre: 0, apellidoPaterno: 0, apellidoMaterno: 0,
      claveElector: 0, curp: 0, fechaNacimiento: 0,
      sexo: 0, seccion: 0, vigencia: 0, domicilio: 0,
    },
  };

  const TextRecognition = getTextRecognition();
  if (!TextRecognition) return empty; // Expo Go — módulo no vinculado

  let frontText: string | null = null;
  let backText: string | null = null;

  if (frontUri) {
    try {
      const r = await TextRecognition.recognize(frontUri);
      // Sort blocks top→bottom by frame.y so the parser sees lines in
      // reading order regardless of ML Kit's internal block ordering.
      const sorted = [...r.blocks].sort(
        (a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0),
      );
      frontText = sorted.map((b) => b.text).join("\n");
    } catch (err) {
      if (isNotLinkedError(err)) return empty;
      console.error("[INE OCR] front error:", err);
    }
  }

  if (backUri) {
    try {
      const r = await TextRecognition.recognize(backUri);
      const sorted = [...r.blocks].sort(
        (a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0),
      );
      backText = sorted.map((b) => b.text).join("\n");
    } catch (err) {
      if (isNotLinkedError(err)) return empty;
      console.error("[INE OCR] back error:", err);
    }
  }

  // Delegar toda la lógica de extracción al parser puro
  return parseIneOcrText(frontText, backText);
}

export function INEQuestion({
  value,
  onChange,
  colors: colorsProp,
}: INEQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [loading, setLoading] = useState<"front" | "back" | "ocr" | null>(null);
  const [ocrEditing, setOcrEditing] = useState(false);
  const [editableOcr, setEditableOcr] = useState<INEOcrResult | null>(null);

  // Pre-OCR preview state: captured photo waiting for user confirmation
  const [pendingCapture, setPendingCapture] = useState<{
    side: "front" | "back";
    uri: string;
  } | null>(null);

  const data = parseValue(value);
  const hasFront = !!data.front;
  const hasBack = !!data.back;
  const isComplete = hasFront && hasBack;
  // Progress step: 0=Frente, 1=Reverso, 2=OCR, 3=Listo
  const currentStep = !hasFront ? 0 : !hasBack ? 1 : !data.ocrData ? 2 : 3;

  // Run OCR when both sides are captured
  const runOcr = useCallback(
    async (frontUri: string | null, backUri: string | null) => {
      if (!frontUri) return;
      setLoading("ocr");
      try {
        const ocrResult = await extractIneOcr(frontUri, backUri);
        setEditableOcr(ocrResult);
        setOcrEditing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.error("OCR failed:", err);
        Alert.alert(
          "OCR no disponible",
          "No se pudo extraer información del documento. Puedes ingresarla manualmente.",
        );
      } finally {
        setLoading(null);
      }
    },
    [],
  );

  const captureImage = async (
    side: "front" | "back",
    source: "camera" | "gallery",
  ) => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permiso requerido",
            "Necesitamos acceso a la cámara para capturar el documento.",
          );
          return;
        }

        setLoading(side);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // ★ Document Scanner: edge detection + perspective correction
        const scanner = getDocumentScanner();
        if (!scanner) {
          Alert.alert(
            "Escáner no disponible",
            "Esta función requiere un build de desarrollo o producción.",
          );
          return;
        }
        const { scannedImages, status: scanStatus } =
          await scanner.scanDocument({
            maxNumDocuments: 1,
            croppedImageQuality: 90,
            letUserAdjustCrop: true,
          });

        if (scanStatus === "cancel" || !scannedImages?.length) return;

        const processed = await processDocumentImage(scannedImages[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPendingCapture({ side, uri: processed });
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso requerido", "Necesitamos acceso a la galería.");
          return;
        }

        setLoading(side);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
          allowsEditing: true,
          aspect: [85.6, 53.98] as [number, number],
          exif: false,
        });

        if (!result.canceled && result.assets[0]) {
          const processed = await processDocumentImage(result.assets[0].uri);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPendingCapture({ side, uri: processed });
        }
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo capturar la imagen del documento.");
    } finally {
      setLoading(null);
    }
  };

  // User confirms the captured photo → save it and run OCR
  const confirmCapture = useCallback(() => {
    if (!pendingCapture) return;
    const { side, uri } = pendingCapture;
    const newData = { ...data, [side]: uri };
    onChange(newData);
    setPendingCapture(null);

    // Run OCR after confirmation
    if (side === "front") {
      runOcr(uri, newData.back);
    } else if (side === "back" && newData.front) {
      runOcr(newData.front, uri);
    }
  }, [pendingCapture, data, onChange, runOcr]);

  // User rejects the captured photo → allow retake
  const rejectCapture = useCallback(() => {
    if (!pendingCapture) return;
    const { side } = pendingCapture;
    setPendingCapture(null);
    // Re-open camera for the same side
    captureImage(side, "camera");
  }, [pendingCapture]);

  const clearSide = (side: "front" | "back") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newData = { ...data, [side]: null, ocrData: null };
    setEditableOcr(null);
    setOcrEditing(false);
    onChange(newData.front || newData.back ? newData : null);
  };

  const renderSideCapture = (
    side: "front" | "back",
    label: string,
    icon: "card-outline" | "card",
    uri: string | null,
  ) => {
    const isLoading = loading === side;

    if (isLoading) {
      return (
        <View
          style={[
            styles.sideCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Procesando {label.toLowerCase()}...
          </Text>
        </View>
      );
    }

    if (uri) {
      return (
        <View style={styles.sideSection}>
          <View style={styles.sideLabelRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.sideLabel, { color: colors.success }]}>
              {label} capturado
            </Text>
          </View>
          <View
            style={[
              styles.previewCard,
              { borderColor: colors.success, backgroundColor: colors.surface },
            ]}
          >
            <Image source={{ uri }} style={styles.previewImage} />
          </View>
          <View style={styles.sideActions}>
            <TouchableOpacity
              style={[
                styles.smallBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => captureImage(side, "camera")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.smallBtnText, { color: colors.primary }]}>
                Retomar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.smallBtn,
                {
                  borderColor: colors.error + "40",
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => clearSide(side)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.smallBtnText, { color: colors.error }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Not captured yet
    return (
      <View style={styles.sideSection}>
        <Text style={[styles.sideLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <TouchableOpacity
          style={[styles.captureBtn, { backgroundColor: colors.primary }]}
          onPress={() => captureImage(side, "camera")}
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={28} color="#fff" />
          <Text style={styles.captureBtnText}>Capturar {label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.galleryLink,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={() => captureImage(side, "gallery")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="images-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.galleryLinkText, { color: colors.textSecondary }]}
          >
            O seleccionar de galería
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Confirm OCR edits and merge into value
  const confirmOcr = () => {
    if (!editableOcr) return;
    const newData = { ...data, ocrData: editableOcr };
    onChange(newData);
    setOcrEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Campos de texto editables (excluye los de confianza que no son strings)
  const updateOcrField = (field: IneTextField, val: string) => {
    if (!editableOcr) return;
    // Cuando el usuario edita manualmente un campo, marcar su confianza como 1.0
    // (el usuario ha verificado/corregido el valor — Decisión §5 del parser)
    const updatedFieldConf = {
      ...(editableOcr.fieldConfidence ?? {}),
      [field]: 1.0,
    };
    setEditableOcr({ ...editableOcr, [field]: val, fieldConfidence: updatedFieldConf });
  };

  // OCR field config for rendering
  const ocrFields: { key: IneTextField; label: string }[] = [
    { key: "nombre", label: "Nombre(s)" },
    { key: "apellidoPaterno", label: "Apellido Paterno" },
    { key: "apellidoMaterno", label: "Apellido Materno" },
    { key: "curp", label: "CURP" },
    { key: "claveElector", label: "Clave de Elector" },
    { key: "fechaNacimiento", label: "Fecha de Nacimiento" },
    { key: "sexo", label: "Sexo" },
    { key: "seccion", label: "Sección" },
    { key: "vigencia", label: "Vigencia" },
    { key: "domicilio", label: "Domicilio" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Step progress indicator */}
      <View
        style={[
          styles.stepperRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {([
          { label: "Frente", icon: "card-outline" },
          { label: "Reverso", icon: "card" },
          { label: "OCR", icon: "scan-outline" },
          { label: "Listo", icon: "checkmark-circle-outline" },
        ] as { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[]).map(
          (step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <React.Fragment key={step.label}>
                {i > 0 && (
                  <View
                    style={[
                      styles.stepConnector,
                      {
                        backgroundColor:
                          i <= currentStep ? colors.primary : colors.border,
                      },
                    ]}
                  />
                )}
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isDone
                          ? colors.primary
                          : isActive
                            ? colors.primary + "22"
                            : colors.border + "55",
                        borderColor:
                          isDone || isActive ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isDone ? "checkmark" : step.icon}
                      size={14}
                      color={
                        isDone
                          ? "#fff"
                          : isActive
                            ? colors.primary
                            : (colors.textTertiary ?? "#bbb")
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          isDone || isActive
                            ? colors.primary
                            : (colors.textTertiary ?? "#bbb"),
                        fontWeight: isActive ? "700" : "400",
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              </React.Fragment>
            );
          },
        )}
      </View>

      {/* Instructions */}
      <View
        style={[styles.instructionCard, { backgroundColor: colors.overlay }]}
      >
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <View style={styles.instructionTextWrap}>
          <Text style={[styles.instructionTitle, { color: colors.text }]}>
            Captura tu credencial INE
          </Text>
          <Text
            style={[styles.instructionBody, { color: colors.textSecondary }]}
          >
            • Coloca el documento sobre una superficie plana{"\n"}• Asegúrate de
            buena iluminación, sin reflejos{"\n"}• Encuadra todo el documento
            dentro del recuadro{"\n"}• La información se extraerá
            automáticamente
          </Text>
        </View>
      </View>

      {/* Pre-OCR photo preview — confirm before processing */}
      {pendingCapture && (
        <View
          style={[
            styles.previewConfirmCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.previewConfirmTitle, { color: colors.text }]}>
            ¿La foto se ve bien?
          </Text>
          <Text
            style={[styles.previewConfirmHint, { color: colors.textSecondary }]}
          >
            Verifica que el texto sea legible y todo el documento sea visible
          </Text>
          <View
            style={[
              styles.previewCard,
              { borderColor: colors.primary, backgroundColor: colors.surface },
            ]}
          >
            <Image
              source={{ uri: pendingCapture.uri }}
              style={styles.previewImageLarge}
            />
          </View>
          <View style={styles.previewConfirmActions}>
            <TouchableOpacity
              style={[
                styles.previewRejectBtn,
                {
                  borderColor: colors.error,
                  backgroundColor: colors.error + "10",
                },
              ]}
              onPress={rejectCapture}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={colors.error}
              />
              <Text style={[styles.previewBtnText, { color: colors.error }]}>
                Retomar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.previewAcceptBtn,
                { backgroundColor: colors.success },
              ]}
              onPress={confirmCapture}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={[styles.previewBtnText, { color: "#fff" }]}>
                Usar esta foto
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Front side */}
      {!pendingCapture &&
        renderSideCapture("front", "Frente", "card-outline", data.front)}

      {/* Back side */}
      {!pendingCapture &&
        renderSideCapture("back", "Reverso", "card", data.back)}

      {/* OCR loading indicator */}
      {loading === "ocr" && (
        <View
          style={[
            styles.ocrLoadingCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.ocrLoadingText, { color: colors.primary }]}>
            Extrayendo información del documento...
          </Text>
        </View>
      )}

      {/* OCR results — editable confirmation */}
      {ocrEditing && editableOcr && (
        <View
          style={[
            styles.ocrCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <View style={styles.ocrHeader}>
            <Ionicons name="scan-outline" size={20} color={colors.primary} />
            <Text style={[styles.ocrTitle, { color: colors.text }]}>
              Datos extraídos
            </Text>
            {editableOcr.confidence > 0 && (
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor:
                      editableOcr.confidence > 0.9
                        ? colors.success + "20"
                        : editableOcr.confidence > 0.7
                          ? colors.warning + "20"
                          : colors.error + "20",
                  },
                ]}
              >
                <Ionicons
                  name={
                    editableOcr.confidence > 0.9
                      ? "checkmark-circle"
                      : editableOcr.confidence > 0.7
                        ? "alert-circle"
                        : "close-circle"
                  }
                  size={14}
                  color={
                    editableOcr.confidence > 0.9
                      ? colors.success
                      : editableOcr.confidence > 0.7
                        ? (colors.warning ?? "#f59e0b")
                        : colors.error
                  }
                />
                <Text
                  style={[
                    styles.confidenceText,
                    {
                      color:
                        editableOcr.confidence > 0.9
                          ? colors.success
                          : editableOcr.confidence > 0.7
                            ? (colors.warning ?? "#f59e0b")
                            : colors.error,
                    },
                  ]}
                >
                  {editableOcr.confidence > 0.9
                    ? "Verificado"
                    : editableOcr.confidence > 0.7
                      ? "Revisar"
                      : "Corregir"}{" "}
                  ({Math.round(editableOcr.confidence * 100)}%)
                </Text>
              </View>
            )}
            {editableOcr.modeloDetected && editableOcr.modeloDetected !== "unknown" && (
              <View
                style={[
                  styles.modeloBadge,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" },
                ]}
              >
                <Ionicons name="id-card-outline" size={12} color={colors.primary} />
                <Text style={[styles.modeloBadgeText, { color: colors.primary }]}>
                  {editableOcr.modeloDetected.replace("_", " ")}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.ocrSubtitle, { color: colors.textSecondary }]}>
            {editableOcr.confidence > 0.9
              ? "Los datos se extrajeron con alta confianza. Verifica que sean correctos."
              : editableOcr.confidence > 0.7
                ? "Algunos datos necesitan revisión. Los campos resaltados pueden tener errores."
                : "La calidad de lectura fue baja. Por favor revisa y corrige todos los campos."}
          </Text>

          {ocrFields.map(({ key, label }) => {
            // Usar confianza individual del parser en vez de la global
            // (Decisión §5 en lib/ocr/ine-ocr-parser.ts)
            const fieldValue = String(editableOcr[key] ?? "");
            const fieldConf = editableOcr.fieldConfidence?.[key] ?? (fieldValue ? 0.5 : 0);
            const hasContent = fieldValue.length > 0;
            const isLowConfidence = !hasContent || fieldConf < 0.7;
            const confidencePct = Math.round(fieldConf * 100);
            return (
              <View key={key} style={styles.ocrFieldRow}>
                <View style={styles.ocrFieldLabelRow}>
                  <Text
                    style={[
                      styles.ocrFieldLabel,
                      {
                        color: isLowConfidence
                          ? colors.error
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                  {hasContent && (
                    <Text
                      style={[
                        styles.ocrFieldConfPct,
                        {
                          color:
                            fieldConf >= 0.9
                              ? colors.success
                              : fieldConf >= 0.7
                                ? (colors.warning ?? "#f59e0b")
                                : colors.error,
                        },
                      ]}
                    >
                      {confidencePct}%
                    </Text>
                  )}
                  {isLowConfidence && (
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={colors.error}
                    />
                  )}
                </View>
                <TextInput
                  style={[
                    styles.ocrFieldInput,
                    {
                      color: colors.text,
                      borderColor: isLowConfidence
                        ? colors.error + "60"
                        : colors.border,
                      backgroundColor: isLowConfidence
                        ? colors.error + "08"
                        : colors.background,
                    },
                  ]}
                  value={fieldValue}
                  onChangeText={(v) => updateOcrField(key, v)}
                  placeholder={`Sin datos`}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.confirmOcrBtn, { backgroundColor: colors.primary }]}
            onPress={confirmOcr}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.confirmOcrBtnText}>Confirmar datos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show confirmed OCR data (read-only summary) */}
      {!ocrEditing && data.ocrData && (
        <View
          style={[
            styles.ocrSummary,
            {
              backgroundColor: colors.success + "10",
              borderColor: colors.success,
            },
          ]}
        >
          <View style={styles.ocrHeader}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text style={[styles.ocrTitle, { color: colors.success }]}>
              Datos confirmados
            </Text>
            {data.ocrData.modeloDetected && data.ocrData.modeloDetected !== "unknown" && (
              <View
                style={[
                  styles.modeloBadge,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" },
                ]}
              >
                <Ionicons name="id-card-outline" size={12} color={colors.primary} />
                <Text style={[styles.modeloBadgeText, { color: colors.primary }]}>
                  {data.ocrData.modeloDetected.replace("_", " ")}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                setEditableOcr(data.ocrData);
                setOcrEditing(true);
              }}
            >
              <Text style={[styles.editLink, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>
          {data.ocrData.nombre ? (
            <Text style={[styles.ocrSummaryLine, { color: colors.text }]}>
              {data.ocrData.nombre} {data.ocrData.apellidoPaterno}{" "}
              {data.ocrData.apellidoMaterno}
            </Text>
          ) : null}
          {data.ocrData.curp ? (
            <Text
              style={[styles.ocrSummaryLine, { color: colors.textSecondary }]}
            >
              CURP: {data.ocrData.curp}
            </Text>
          ) : null}
          {data.ocrData.claveElector ? (
            <Text
              style={[styles.ocrSummaryLine, { color: colors.textSecondary }]}
            >
              Clave: {data.ocrData.claveElector}
            </Text>
          ) : null}
        </View>
      )}

      {/* Completion status */}
      {isComplete && !ocrEditing && !data.ocrData && (
        <View
          style={[
            styles.completeBadge,
            { backgroundColor: colors.success + "18" },
          ]}
        >
          <Ionicons name="checkmark-done" size={18} color={colors.success} />
          <Text style={[styles.completeText, { color: colors.success }]}>
            Ambos lados capturados correctamente
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepItem: {
    alignItems: "center",
    gap: 5,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  stepLabel: {
    fontSize: 11,
  },
  instructionCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    alignItems: "flex-start",
  },
  instructionTextWrap: {
    flex: 1,
    gap: 4,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  instructionBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  sideSection: {
    gap: 8,
  },
  sideLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sideCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderRadius: 14,
  },
  captureBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  galleryLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  galleryLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  sideActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // OCR styles
  ocrLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ocrLoadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ocrCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  ocrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ocrTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  ocrSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  confidenceBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modeloBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeloBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Pre-OCR preview confirmation
  previewConfirmCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    gap: 12,
  },
  previewConfirmTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center" as const,
  },
  previewConfirmHint: {
    fontSize: 13,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  previewImageLarge: {
    width: "100%" as any,
    height: 220,
    resizeMode: "cover" as const,
  },
  previewConfirmActions: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 4,
  },
  previewRejectBtn: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  previewAcceptBtn: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  ocrFieldRow: {
    gap: 4,
  },
  ocrFieldLabelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  ocrFieldConfPct: {
    fontSize: 10,
    fontWeight: "700" as const,
    marginLeft: "auto" as any,
    paddingHorizontal: 4,
  },
  ocrFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  ocrFieldInput: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  confirmOcrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  confirmOcrBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  ocrSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  ocrSummaryLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "600",
  },
} as const);
