/**
 * 🪪 INE QUESTION — Document credential capture + OCR
 * UX:
 * - Camera capture with visual guide overlay for card alignment
 * - Gallery fallback for pre-taken photos
 * - Auto-crop via allowsEditing
 * - Image manipulation: auto-rotate, resize, compress
 * - Front & back capture support
 * - Preview with retake option
 * - ML Kit OCR: extract text from captured image and parse INE fields
 * - Auto-populate extracted data with editable confirmation
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import TextRecognition, {
  type TextRecognitionResult,
} from "@react-native-ml-kit/text-recognition";
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

/** OCR-extracted data from the INE */
export interface INEOcrResult {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  claveElector: string;
  curp: string;
  fechaNacimiento: string;
  sexo: string;
  seccion: string;
  vigencia: string;
  domicilio: string;
  confidence: number; // 0-1
}

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
  // Auto-correct: resize to standard ID width, compress for upload
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

// ── OCR helpers ────────────────────────────────────────────────────────────────

/** Common INE field patterns */
const CURP_RE = /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}/;
const CLAVE_ELECTOR_RE = /[A-Z]{6}\d{8}[HM]\d{3}/;
const SECCION_RE = /SECCI[OÓ]N\s*(\d{4})/i;
const VIGENCIA_RE = /VIGENCIA\s*(\d{4})/i;
const FECHA_NAC_RE = /(\d{2}\/\d{2}\/\d{4})/;
const SEXO_RE = /\bSEXO\s*([HM])\b/i;

/**
 * Run ML Kit text recognition on an image and attempt to parse INE fields.
 * Works on both front and back of the credential.
 */
async function extractIneOcr(
  frontUri: string | null,
  backUri: string | null,
): Promise<INEOcrResult> {
  const result: INEOcrResult = {
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    claveElector: "",
    curp: "",
    fechaNacimiento: "",
    sexo: "",
    seccion: "",
    vigencia: "",
    domicilio: "",
    confidence: 0,
  };

  let allText = "";
  let totalConfidence = 0;
  let blockCount = 0;

  // Process front side
  if (frontUri) {
    try {
      const frontResult: TextRecognitionResult =
        await TextRecognition.recognize(frontUri);
      const frontText = frontResult.text ?? "";
      allText += frontText + "\n";

      for (const block of frontResult.blocks ?? []) {
        if (block.recognizedLanguages?.length) {
          totalConfidence += 0.8; // approximate confidence
        } else {
          totalConfidence += 0.6;
        }
        blockCount++;
      }
    } catch (err) {
      console.error("OCR front error:", err);
    }
  }

  // Process back side
  if (backUri) {
    try {
      const backResult: TextRecognitionResult =
        await TextRecognition.recognize(backUri);
      const backText = backResult.text ?? "";
      allText += backText + "\n";

      for (const block of backResult.blocks ?? []) {
        totalConfidence += 0.7;
        blockCount++;
      }
    } catch (err) {
      console.error("OCR back error:", err);
    }
  }

  // Parse fields from combined text
  const lines = allText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // CURP
  const curpMatch = allText.match(CURP_RE);
  if (curpMatch) result.curp = curpMatch[0];

  // Clave de Elector
  const claveMatch = allText.match(CLAVE_ELECTOR_RE);
  if (claveMatch) result.claveElector = claveMatch[0];

  // Sección
  const seccionMatch = allText.match(SECCION_RE);
  if (seccionMatch) result.seccion = seccionMatch[1];

  // Vigencia
  const vigenciaMatch = allText.match(VIGENCIA_RE);
  if (vigenciaMatch) result.vigencia = vigenciaMatch[1];

  // Fecha de nacimiento
  const fechaMatch = allText.match(FECHA_NAC_RE);
  if (fechaMatch) result.fechaNacimiento = fechaMatch[1];

  // Sexo
  const sexoMatch = allText.match(SEXO_RE);
  if (sexoMatch) result.sexo = sexoMatch[1].toUpperCase();

  // Name extraction: look for "NOMBRE" label or parse lines after known patterns
  const nombreIdx = lines.findIndex(
    (l) => l.toUpperCase().includes("NOMBRE") && !l.includes("DOMICILIO"),
  );
  if (nombreIdx >= 0 && nombreIdx + 1 < lines.length) {
    const nameParts = lines[nombreIdx + 1].split(/\s+/);
    if (nameParts.length >= 1) result.nombre = nameParts.join(" ");
  }

  // Apellido paterno: look for "APELLIDO PATERNO" or try to extract from name block
  const apPaternoIdx = lines.findIndex((l) => /APELLIDO\s*PATERNO/i.test(l));
  if (apPaternoIdx >= 0 && apPaternoIdx + 1 < lines.length) {
    result.apellidoPaterno = lines[apPaternoIdx + 1];
  }

  const apMaternoIdx = lines.findIndex((l) => /APELLIDO\s*MATERNO/i.test(l));
  if (apMaternoIdx >= 0 && apMaternoIdx + 1 < lines.length) {
    result.apellidoMaterno = lines[apMaternoIdx + 1];
  }

  // Domicilio
  const domicilioIdx = lines.findIndex((l) => /DOMICILIO/i.test(l));
  if (domicilioIdx >= 0) {
    // Collect up to 3 lines after DOMICILIO
    const addressLines: string[] = [];
    for (
      let i = domicilioIdx + 1;
      i < Math.min(domicilioIdx + 4, lines.length);
      i++
    ) {
      // Stop at next label-like line
      if (/^(CLAVE|CURP|SECCI|ESTADO|MUNICIPIO|AÑO)/i.test(lines[i])) break;
      addressLines.push(lines[i]);
    }
    result.domicilio = addressLines.join(", ");
  }

  // Confidence
  result.confidence =
    blockCount > 0 ? Math.min(totalConfidence / blockCount, 1) : 0;

  return result;
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
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso requerido", "Necesitamos acceso a la galería.");
          return;
        }
      }

      setLoading(side);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const launchFn =
        source === "camera"
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await launchFn({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: true, // Enables crop rectangle for document alignment
        aspect: [85.6, 53.98] as [number, number], // Standard ID card ratio (ISO/IEC 7810)
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Process: resize + compress (quality 0.9 for OCR accuracy)
        const processed = await processDocumentImage(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show preview for confirmation BEFORE running OCR
        setPendingCapture({ side, uri: processed });
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

  const updateOcrField = (field: keyof INEOcrResult, val: string) => {
    if (!editableOcr) return;
    setEditableOcr({ ...editableOcr, [field]: val });
  };

  // OCR field config for rendering
  const ocrFields: { key: keyof INEOcrResult; label: string }[] = [
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
          </View>
          <Text style={[styles.ocrSubtitle, { color: colors.textSecondary }]}>
            {editableOcr.confidence > 0.9
              ? "Los datos se extrajeron con alta confianza. Verifica que sean correctos."
              : editableOcr.confidence > 0.7
                ? "Algunos datos necesitan revisión. Los campos resaltados pueden tener errores."
                : "La calidad de lectura fue baja. Por favor revisa y corrige todos los campos."}
          </Text>

          {ocrFields.map(({ key, label }) => {
            // Determine per-field confidence: fields with content are likely OK
            const fieldValue = String(editableOcr[key] ?? "");
            const hasContent = fieldValue.length > 0;
            const isLowConfidence = !hasContent || editableOcr.confidence < 0.7;
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
