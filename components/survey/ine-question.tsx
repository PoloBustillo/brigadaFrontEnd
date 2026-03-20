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

import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import {
  validateCurp,
  type CurpValidationResult,
} from "@/lib/ocr/curp-validator";
import {
  checkImageQuality,
  qualityIssueMessage,
  qualityIssueTitle,
} from "@/lib/ocr/image-quality";
import {
  parseIneOcrText,
  type IneModelo,
  type IneOcrResult,
  type IneTextField,
  type OcrBlock,
  type ParsedAddress,
} from "@/lib/ocr/ine-ocr-parser";
import {
  loadCorrections,
  saveCorrection,
  type FieldCorrections,
} from "@/lib/ocr/ocr-corrections";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Lazy-load the native DocumentScanner module so the component doesn't crash
// in Expo Go (where native modules aren't linked).
type DocumentScannerModule = {
  scanDocument(options: {
    maxNumDocuments?: number;
    croppedImageQuality?: number;
    letUserAdjustCrop?: boolean;
  }): Promise<{ scannedImages: string[]; status: "cancel" | "success" }>;
};
/**
 * Detect Expo Go: TurboModuleRegistry.getEnforcing() throws a fatal
 * Invariant Violation that CANNOT be caught by JS try/catch.
 * We must guard all native-module require() calls behind this check.
 */
const IS_EXPO_GO = Constants.executionEnvironment === "storeClient";

let _scannerCache: DocumentScannerModule | null | undefined;
function getDocumentScanner(): DocumentScannerModule | null {
  if (_scannerCache !== undefined) return _scannerCache;
  if (IS_EXPO_GO) {
    _scannerCache = null;
    return null;
  }
  try {
    const mod = require("react-native-document-scanner-plugin");
    _scannerCache = mod?.default ?? mod ?? null;
  } catch {
    _scannerCache = null;
  }
  return _scannerCache ?? null;
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
let _textRecCache: TextRecognitionModule | null | undefined;
function getTextRecognition(): TextRecognitionModule | null {
  if (_textRecCache !== undefined) return _textRecCache;
  if (IS_EXPO_GO) {
    _textRecCache = null;
    return null;
  }
  try {
    const mod = require("@react-native-ml-kit/text-recognition");
    _textRecCache = mod?.default ?? mod ?? null;
  } catch {
    _textRecCache = null;
  }
  return _textRecCache ?? null;
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
type IneTextFieldLocal = IneTextField;

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
  modeloHint?: IneModelo,
  corrections?: FieldCorrections,
): Promise<INEOcrResult> {
  const empty: INEOcrResult = {
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
    modeloDetected: "unknown",
    confidence: 0,
    fieldConfidence: {
      nombre: 0,
      apellidoPaterno: 0,
      apellidoMaterno: 0,
      claveElector: 0,
      curp: 0,
      fechaNacimiento: 0,
      sexo: 0,
      seccion: 0,
      vigencia: 0,
      domicilio: 0,
    },
  };

  const TextRecognition = getTextRecognition();
  if (!TextRecognition) return empty; // Expo Go — módulo no vinculado

  let frontText: string | null = null;
  let backText: string | null = null;
  let frontBlocks: OcrBlock[] | undefined;
  let backBlocks: OcrBlock[] | undefined;

  if (frontUri) {
    try {
      const r = await TextRecognition.recognize(frontUri);
      // Sort blocks top→bottom by frame.y so the parser sees lines in
      // reading order regardless of ML Kit's internal block ordering.
      const sorted = [...r.blocks].sort(
        (a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0),
      );
      frontText = sorted.map((b) => b.text).join("\n");
      // Preservar bloques con datos espaciales para el parser
      frontBlocks = sorted.map((b) => ({
        text: b.text,
        frame: b.frame,
        lines: (b.lines ?? []).map(
          (l: { text: string; confidence?: number }) => ({
            text: l.text,
            confidence: l.confidence,
          }),
        ),
      }));
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
      // Preservar bloques con datos espaciales para el parser
      backBlocks = sorted.map((b) => ({
        text: b.text,
        frame: b.frame,
        lines: (b.lines ?? []).map(
          (l: { text: string; confidence?: number }) => ({
            text: l.text,
            confidence: l.confidence,
          }),
        ),
      }));
    } catch (err) {
      if (isNotLinkedError(err)) return empty;
      console.error("[INE OCR] back error:", err);
    }
  }

  // Delegar toda la lógica de extracción al parser puro
  return parseIneOcrText(
    frontText,
    backText,
    modeloHint,
    frontBlocks,
    backBlocks,
    corrections,
  );
}

export function INEQuestion({
  value,
  onChange,
  colors: colorsProp,
}: INEQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const { token } = useAuth();
  const [loading, setLoading] = useState<"front" | "back" | "ocr" | null>(null);
  const [ocrEditing, setOcrEditing] = useState(false);
  const [editableOcr, setEditableOcr] = useState<INEOcrResult | null>(null);
  const [curpValidation, setCurpValidation] =
    useState<CurpValidationResult | null>(null);
  const [validatingCurp, setValidatingCurp] = useState(false);

  // Ref con las correcciones OCR persistidas en AsyncStorage
  const correctionsRef = useRef<FieldCorrections>({});
  // Ref con el resultado OCR original (antes de edición manual), para poder
  // detectar qué valores corrigió el usuario y guardarlos como aprendizaje.
  const initialOcrRef = useRef<INEOcrResult | null>(null);

  // Pre-OCR preview state: captured photo waiting for user confirmation
  const [pendingCapture, setPendingCapture] = useState<{
    side: "front" | "back";
    uri: string;
  } | null>(null);
  const [showTips, setShowTips] = useState(false);

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
        const ocrResult = await extractIneOcr(
          frontUri,
          backUri,
          undefined,
          correctionsRef.current,
        );
        initialOcrRef.current = ocrResult;
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

  // Cargar correcciones OCR guardadas al montar el componente
  useEffect(() => {
    loadCorrections()
      .then((c) => {
        correctionsRef.current = c;
      })
      .catch(() => {
        // Ignorar errores de storage; se usará un mapa vacío
      });
  }, []);

  /**
   * Evalúa la calidad de la imagen capturada; si hay un problema muestra
   * una alerta específica ofreciendo retomar o continuar de todas formas.
   * Si la calidad es aceptable (o si el check falla internamente), procede
   * directamente a `setPendingCapture`.
   *
   * Nota: referencia a `captureImage` dentro del callback del Alert es segura
   * porque la closure solo se invoca después de que el componente ha terminado
   * de renderizar (cuando el usuario toca «Retomar»).
   */
  const handleProcessedCapture = async (
    side: "front" | "back",
    source: "camera" | "gallery",
    uri: string,
  ) => {
    const quality = await checkImageQuality(uri);

    if (!quality.ok && quality.issues.length > 0) {
      const title = qualityIssueTitle(quality.issues);
      // Mostrar solo el mensaje del problema más grave (el primero en la lista)
      const message = qualityIssueMessage(quality.issues[0]);
      Alert.alert(
        title,
        `${message}\n\n¿Deseas retomar la foto o continuar de todas formas?`,
        [
          {
            text: "Retomar",
            style: "cancel",
            // fire-and-forget: captureImage gestiona su propio estado de carga
            onPress: () => void captureImage(side, source),
          },
          {
            text: "Continuar de todas formas",
            onPress: () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setPendingCapture({ side, uri });
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingCapture({ side, uri });
    }
  };

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
        // Falls back to expo-image-picker camera in Expo Go where
        // the native DocumentScanner module is not available.
        const scanner = getDocumentScanner();
        if (scanner) {
          try {
            const { scannedImages, status: scanStatus } =
              await scanner.scanDocument({
                maxNumDocuments: 1,
                croppedImageQuality: 90,
                letUserAdjustCrop: true,
              });

            if (scanStatus === "cancel" || !scannedImages?.length) return;

            const processed = await processDocumentImage(scannedImages[0]);
            await handleProcessedCapture(side, source, processed);
          } catch (scanErr) {
            // If scanner crashes at runtime, fall through to picker fallback
            console.warn(
              "[INE] Document scanner failed, using camera fallback:",
              scanErr,
            );
            const fallback = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.9,
              allowsEditing: true,
              aspect: [85.6, 53.98] as [number, number],
              exif: false,
            });
            if (!fallback.canceled && fallback.assets[0]) {
              const processed = await processDocumentImage(
                fallback.assets[0].uri,
              );
              await handleProcessedCapture(side, source, processed);
            }
          }
        } else {
          // No native scanner (Expo Go) — use standard camera
          const fallback = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.9,
            allowsEditing: true,
            aspect: [85.6, 53.98] as [number, number],
            exif: false,
          });
          if (!fallback.canceled && fallback.assets[0]) {
            const processed = await processDocumentImage(
              fallback.assets[0].uri,
            );
            await handleProcessedCapture(side, source, processed);
          }
        }
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
          await handleProcessedCapture(side, source, processed);
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
            {
              backgroundColor: colors.primaryContainer,
              borderColor: colors.primary + "40",
            },
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
                {
                  borderColor: colors.onPrimaryContainer + "40",
                  backgroundColor: colors.primaryContainer,
                },
              ]}
              onPress={() => captureImage(side, "camera")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={16}
                color={colors.onPrimaryContainer}
              />
              <Text
                style={[
                  styles.smallBtnText,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                Retomar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.smallBtn,
                {
                  borderColor: colors.error + "60",
                  backgroundColor: colors.error + "10",
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
          <Ionicons name={icon} size={28} color={colors.onPrimary} />
          <Text style={[styles.captureBtnText, { color: colors.onPrimary }]}>
            Capturar {label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.galleryLink,
            {
              borderColor: colors.onPrimaryContainer + "40",
              backgroundColor: colors.primaryContainer,
            },
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

  /** Re-run ML Kit on the already-captured images without re-taking them */
  const reRunOcr = useCallback(() => {
    if (!data.front) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurpValidation(null); // reset previous validation when re-reading
    runOcr(data.front, data.back);
  }, [data.front, data.back, runOcr]);

  /** Validate the current CURP value against RENAPO via backend proxy */
  const handleVerifyCurp = useCallback(async () => {
    const curp = editableOcr?.curp;
    if (!curp || curp.length !== 18 || !token) return;
    setValidatingCurp(true);
    try {
      const result = await validateCurp(curp, token);
      setCurpValidation(result);
      // Si RENAPO devuelve datos y algunos campos están vacíos, pre-rellenar
      if (result.renapoReachable && editableOcr) {
        const patch: Partial<INEOcrResult> = {};
        const patchConf: Partial<typeof editableOcr.fieldConfidence> = {};
        if (result.nombre && !editableOcr.nombre) {
          patch.nombre = result.nombre;
          patchConf.nombre = 0.95;
        }
        if (result.apellido1 && !editableOcr.apellidoPaterno) {
          patch.apellidoPaterno = result.apellido1;
          patchConf.apellidoPaterno = 0.95;
        }
        if (result.apellido2 && !editableOcr.apellidoMaterno) {
          patch.apellidoMaterno = result.apellido2;
          patchConf.apellidoMaterno = 0.95;
        }
        if (result.sexo && !editableOcr.sexo) {
          patch.sexo = result.sexo;
          patchConf.sexo = 1.0;
        }
        if (Object.keys(patch).length > 0) {
          setEditableOcr((prev) =>
            prev
              ? {
                  ...prev,
                  ...patch,
                  fieldConfidence: { ...prev.fieldConfidence, ...patchConf },
                }
              : prev,
          );
        }
      }
      Haptics.notificationAsync(
        result.renapoStatus === "VIGE"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    } catch {
      Alert.alert("Error", "No se pudo validar el CURP. Intenta más tarde.");
    } finally {
      setValidatingCurp(false);
    }
  }, [editableOcr, token]);

  // Campos de texto editables (excluye los de confianza que no son strings)
  const updateOcrField = (field: IneTextFieldLocal, val: string) => {
    if (!editableOcr) return;
    // Guardar corrección si el valor difiere del OCR original
    const initialVal = (initialOcrRef.current as any)?.[field] as
      | string
      | undefined;
    if (
      initialVal !== undefined &&
      initialVal.length > 0 &&
      val.length > 0 &&
      val !== initialVal
    ) {
      saveCorrection(field, initialVal, val)
        .then((updated) => {
          correctionsRef.current = updated;
        })
        .catch(() => {
          // Ignorar errores de storage
        });
    }
    // Cuando el usuario edita manualmente un campo, marcar su confianza como 1.0
    // (el usuario ha verificado/corregido el valor — Decisión §5 del parser)
    const updatedFieldConf = {
      ...(editableOcr.fieldConfidence ?? {}),
      [field]: 1.0,
    };
    setEditableOcr({
      ...editableOcr,
      [field]: val,
      fieldConfidence: updatedFieldConf,
    });
  };

  /** Actualiza un sub-campo del domicilio y reconstruye el campo `domicilio` plano. */
  const updateAddressField = (subField: keyof ParsedAddress, val: string) => {
    if (!editableOcr) return;
    const existing: ParsedAddress = editableOcr.domicilioDesglosado ?? {
      calle: "",
      colonia: "",
      codigoPostal: "",
      municipio: "",
      estado: "",
    };
    const upper = val.trim().toUpperCase();
    const updated: ParsedAddress = { ...existing, [subField]: upper };
    // Reconstruir el domicilio plano con prefijos estándar
    const parts = [
      updated.calle,
      updated.colonia ? `COL. ${updated.colonia}` : "",
      updated.codigoPostal ? `C.P. ${updated.codigoPostal}` : "",
      updated.municipio,
      updated.estado,
    ].filter(Boolean);
    const newDomicilio = parts.join(", ");
    const initialDom = initialOcrRef.current?.domicilio ?? "";
    if (initialDom && newDomicilio && newDomicilio !== initialDom) {
      saveCorrection("domicilio", initialDom, newDomicilio)
        .then((c) => {
          correctionsRef.current = c;
        })
        .catch(() => {});
    }
    setEditableOcr({
      ...editableOcr,
      domicilio: newDomicilio,
      domicilioDesglosado: updated,
      fieldConfidence: { ...editableOcr.fieldConfidence, domicilio: 1.0 },
    });
  };

  // OCR field config for rendering
  const ocrFields: {
    key: IneTextField;
    label: string;
    isAddress?: boolean;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    keyboardType?: "default" | "numeric" | "numbers-and-punctuation";
    maxLength?: number;
    autoCorrect?: boolean;
  }[] = [
    {
      key: "nombre",
      label: "Nombre(s)",
      autoCapitalize: "characters",
      autoCorrect: false,
    },
    {
      key: "apellidoPaterno",
      label: "Apellido Paterno",
      autoCapitalize: "characters",
      autoCorrect: false,
    },
    {
      key: "apellidoMaterno",
      label: "Apellido Materno",
      autoCapitalize: "characters",
      autoCorrect: false,
    },
    {
      key: "curp",
      label: "CURP",
      autoCapitalize: "characters",
      autoCorrect: false,
      maxLength: 18,
    },
    {
      key: "claveElector",
      label: "Clave de Elector",
      autoCapitalize: "characters",
      autoCorrect: false,
      maxLength: 18,
    },
    {
      key: "fechaNacimiento",
      label: "Fecha de Nacimiento",
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
    },
    {
      key: "sexo",
      label: "Sexo (H / M)",
      autoCapitalize: "characters",
      autoCorrect: false,
      maxLength: 1,
    },
    { key: "seccion", label: "Sección", keyboardType: "numeric", maxLength: 4 },
    {
      key: "vigencia",
      label: "Vigencia",
      keyboardType: "numeric",
      maxLength: 4,
    },
    {
      key: "domicilio",
      label: "Domicilio",
      isAddress: true,
    },
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
        {(
          [
            { label: "Frente", icon: "card-outline" },
            { label: "Reverso", icon: "card" },
            { label: "OCR", icon: "scan-outline" },
            { label: "Listo", icon: "checkmark-circle-outline" },
          ] as {
            label: string;
            icon: React.ComponentProps<typeof Ionicons>["name"];
          }[]
        ).map((step, i) => {
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
                          : colors.surface,
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
                        ? colors.onPrimary
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
        })}
      </View>

      {/* Compact instruction tip */}
      {!data.ocrData && !ocrEditing && (
        <View
          style={[styles.tipCard, { backgroundColor: colors.primary + "15" }]}
        >
          <View style={styles.tipRow}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Captura ambos lados de tu INE
            </Text>
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setShowTips(!showTips);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.tipToggle, { color: colors.primary }]}>
                {showTips ? "Ocultar" : "Tips"}
              </Text>
            </TouchableOpacity>
          </View>
          {showTips && (
            <View style={styles.tipDetails}>
              <Text style={[styles.tipDetail, { color: colors.textSecondary }]}>
                • Superficie plana, buena luz, sin reflejos
              </Text>
              <Text style={[styles.tipDetail, { color: colors.textSecondary }]}>
                • Encuadra todo el documento
              </Text>
              <Text style={[styles.tipDetail, { color: colors.textSecondary }]}>
                • Los datos se extraen automáticamente
              </Text>
            </View>
          )}
        </View>
      )}

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
                  backgroundColor: colors.error + "18",
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
            {
              backgroundColor: colors.primaryContainer,
              borderColor: colors.primary + "60",
            },
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
          </View>
          <Text style={[styles.ocrSubtitle, { color: colors.textSecondary }]}>
            Verifica y corrige los datos si es necesario.
          </Text>

          {ocrFields.map(
            ({
              key,
              label,
              isAddress,
              autoCapitalize,
              autoCorrect,
              keyboardType,
              maxLength,
            }) => {
              // ── Sección especial: domicilio desglosado ─────────────────────────────
              if (isAddress) {
                const addr: ParsedAddress = editableOcr.domicilioDesglosado ?? {
                  calle: "",
                  colonia: "",
                  codigoPostal: "",
                  municipio: "",
                  estado: "",
                };
                const domConf =
                  editableOcr.fieldConfidence?.domicilio ??
                  (editableOcr.domicilio ? 0.5 : 0);
                const isLowDom =
                  (!editableOcr.domicilio && !addr.calle) || domConf < 0.7;
                const addrBorderColor = isLowDom
                  ? colors.error + "60"
                  : colors.border;
                const addrBg = isLowDom ? colors.error + "15" : colors.surface;
                return (
                  <View key={key} style={styles.ocrFieldRow}>
                    <View style={styles.ocrFieldLabelRow}>
                      <Ionicons
                        name="home-outline"
                        size={14}
                        color={isLowDom ? colors.error : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.ocrFieldLabel,
                          {
                            color: isLowDom
                              ? colors.error
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                      {isLowDom && (
                        <Ionicons
                          name="alert-circle"
                          size={14}
                          color={colors.error}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.ocrAddressSubLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Calle y número
                    </Text>
                    <TextInput
                      style={[
                        styles.ocrFieldInput,
                        {
                          color: colors.text,
                          borderColor: addrBorderColor,
                          backgroundColor: addrBg,
                        },
                      ]}
                      value={addr.calle}
                      onChangeText={(v) => updateAddressField("calle", v)}
                      placeholder="Ej: AV REFORMA 123"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                    />

                    <Text
                      style={[
                        styles.ocrAddressSubLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Colonia
                    </Text>
                    <TextInput
                      style={[
                        styles.ocrFieldInput,
                        {
                          color: colors.text,
                          borderColor: addrBorderColor,
                          backgroundColor: addrBg,
                        },
                      ]}
                      value={addr.colonia}
                      onChangeText={(v) => updateAddressField("colonia", v)}
                      placeholder="Nombre de colonia"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                    />

                    <View style={styles.ocrAddressRow}>
                      <View style={styles.ocrAddressCpWrap}>
                        <Text
                          style={[
                            styles.ocrAddressSubLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          C.P.
                        </Text>
                        <TextInput
                          style={[
                            styles.ocrFieldInput,
                            {
                              color: colors.text,
                              borderColor: addrBorderColor,
                              backgroundColor: addrBg,
                            },
                          ]}
                          value={addr.codigoPostal}
                          onChangeText={(v) =>
                            updateAddressField("codigoPostal", v)
                          }
                          placeholder="00000"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                      <View style={styles.ocrAddressMuniWrap}>
                        <Text
                          style={[
                            styles.ocrAddressSubLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Municipio / Alcaldía
                        </Text>
                        <TextInput
                          style={[
                            styles.ocrFieldInput,
                            {
                              color: colors.text,
                              borderColor: addrBorderColor,
                              backgroundColor: addrBg,
                            },
                          ]}
                          value={addr.municipio}
                          onChangeText={(v) =>
                            updateAddressField("municipio", v)
                          }
                          placeholder="Municipio o alcaldía"
                          placeholderTextColor={colors.textTertiary}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          spellCheck={false}
                        />
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.ocrAddressSubLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Estado
                    </Text>
                    <TextInput
                      style={[
                        styles.ocrFieldInput,
                        {
                          color: colors.text,
                          borderColor: addrBorderColor,
                          backgroundColor: addrBg,
                        },
                      ]}
                      value={addr.estado}
                      onChangeText={(v) => updateAddressField("estado", v)}
                      placeholder="Estado"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                  </View>
                );
              }

              // ── Campos de texto regulares ───────────────────────────────────────
              // Usar confianza individual del parser en vez de la global
              // (Decisión §5 en lib/ocr/ine-ocr-parser.ts)
              const fieldValue = String(editableOcr[key] ?? "");
              const fieldConf =
                editableOcr.fieldConfidence?.[key] ?? (fieldValue ? 0.5 : 0);
              const hasContent = fieldValue.length > 0;
              const isLowConfidence = !hasContent || fieldConf < 0.7;
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
                          ? colors.error + "15"
                          : colors.surface,
                      },
                    ]}
                    value={fieldValue}
                    onChangeText={(v) => {
                      updateOcrField(key, v);
                      if (key === "curp") setCurpValidation(null);
                    }}
                    placeholder="Sin datos"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize={autoCapitalize ?? "none"}
                    autoCorrect={autoCorrect ?? false}
                    spellCheck={false}
                    keyboardType={keyboardType ?? "default"}
                    maxLength={maxLength}
                  />
                  {/* Boton de verificacion RENAPO — solo para el campo CURP */}
                  {key === "curp" && fieldValue.length === 18 && (
                    <View style={styles.curpVerifyRow}>
                      <TouchableOpacity
                        style={[
                          styles.curpVerifyBtn,
                          {
                            backgroundColor: colors.primary + "22",
                            borderColor: colors.primary + "60",
                            opacity: validatingCurp ? 0.6 : 1,
                          },
                        ]}
                        onPress={handleVerifyCurp}
                        disabled={validatingCurp}
                        activeOpacity={0.7}
                      >
                        {validatingCurp ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={14}
                            color={colors.primary}
                          />
                        )}
                        <Text
                          style={[
                            styles.curpVerifyBtnText,
                            { color: colors.primary },
                          ]}
                        >
                          {validatingCurp
                            ? "Verificando..."
                            : "Verificar CURP (opcional)"}
                        </Text>
                      </TouchableOpacity>
                      {curpValidation && (
                        <View
                          style={[
                            styles.curpValidationResult,
                            {
                              backgroundColor:
                                curpValidation.renapoStatus === "VIGE"
                                  ? colors.success + "22"
                                  : curpValidation.renapoStatus ===
                                        "NO_ENCONTRADO" ||
                                      curpValidation.renapoStatus === "BAJA"
                                    ? colors.error + "1A"
                                    : colors.warning + "22",
                              borderColor:
                                curpValidation.renapoStatus === "VIGE"
                                  ? colors.success + "70"
                                  : curpValidation.renapoStatus ===
                                        "NO_ENCONTRADO" ||
                                      curpValidation.renapoStatus === "BAJA"
                                    ? colors.error + "50"
                                    : colors.warning + "50",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              curpValidation.renapoStatus === "VIGE"
                                ? "checkmark-circle"
                                : curpValidation.renapoStatus ===
                                      "NO_ENCONTRADO" ||
                                    curpValidation.renapoStatus === "BAJA"
                                  ? "close-circle"
                                  : "alert-circle"
                            }
                            size={14}
                            color={
                              curpValidation.renapoStatus === "VIGE"
                                ? colors.success
                                : curpValidation.renapoStatus ===
                                      "NO_ENCONTRADO" ||
                                    curpValidation.renapoStatus === "BAJA"
                                  ? colors.error
                                  : (colors.warning ?? "#f59e0b")
                            }
                          />
                          <Text
                            style={[
                              styles.curpValidationText,
                              {
                                color:
                                  curpValidation.renapoStatus === "VIGE"
                                    ? colors.success
                                    : curpValidation.renapoStatus ===
                                          "NO_ENCONTRADO" ||
                                        curpValidation.renapoStatus === "BAJA"
                                      ? colors.error
                                      : (colors.warning ?? "#f59e0b"),
                              },
                            ]}
                          >
                            {curpValidation.displayMessage}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            },
          )}

          <TouchableOpacity
            style={[styles.confirmOcrBtn, { backgroundColor: colors.primary }]}
            onPress={confirmOcr}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.onPrimary}
            />
            <Text
              style={[styles.confirmOcrBtnText, { color: colors.onPrimary }]}
            >
              Confirmar datos
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show confirmed OCR data (read-only summary) */}
      {!ocrEditing && data.ocrData && (
        <View
          style={[
            styles.ocrSummary,
            {
              backgroundColor: colors.success + "18",
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
            {data.front && (
              <TouchableOpacity
                onPress={reRunOcr}
                accessibilityLabel="Re-leer OCR"
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.reLeerBtn,
                    {
                      borderColor: colors.onPrimaryContainer + "60",
                      backgroundColor: colors.primaryContainer,
                    },
                  ]}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={13}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.reLeerBtnText, { color: colors.primary }]}
                  >
                    Re-leer
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
            { backgroundColor: colors.success + "20" },
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
  // Compact tip
  tipCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tipToggle: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipDetails: {
    paddingLeft: 26,
    gap: 2,
  },
  tipDetail: {
    fontSize: 12,
    lineHeight: 18,
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

  reLeerBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reLeerBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },

  curpVerifyRow: {
    gap: 8,
    marginTop: 4,
  },
  curpVerifyBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    alignSelf: "flex-start" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  curpVerifyBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  curpValidationResult: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  curpValidationText: {
    fontSize: 12,
    flex: 1,
    fontWeight: "500",
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
  ocrAddressSubLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    marginTop: 6,
    marginBottom: 2,
    textTransform: "uppercase" as const,
  },
  ocrAddressRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  ocrAddressCpWrap: {
    flex: 1.3,
  },
  ocrAddressMuniWrap: {
    flex: 2.5,
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
