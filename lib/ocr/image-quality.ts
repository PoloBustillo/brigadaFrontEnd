/**
 * 📷 Pre-OCR Image Quality Check
 * ================================
 * Evalúa blur, sobreexposición y brillo extremo de una foto de INE
 * antes de lanzar ML Kit Text Recognition, para dar retroalimentación
 * específica antes de desperdiciar el ciclo de OCR.
 *
 * ── Técnica ──────────────────────────────────────────────────────────────────
 * No tenemos acceso directo a píxeles en React Native sin módulos nativos extra.
 * Usamos una heurística de tamaño de archivo JPEG con dos factores de calidad:
 *
 *   thumb_HQ = thumbnail 300×189 a quality=0.90 — preserva detalles
 *   thumb_LQ = thumbnail 300×189 a quality=0.04 — destruye detalles agresivamente
 *
 *   └─ blur_score = size(LQ) / size(HQ)
 *        • Imagen nítida (texto legible): distinción clara entre HQ y LQ → ratio bajo
 *        • Imagen borrosa (sin detalle): poca diferencia entre HQ y LQ → ratio alto
 *        • sin detalle = JPEG no gana mucho comprimiendo más fuerte
 *
 *   └─ detail_bytes = size(HQ) en bytes
 *        • Imagen sobreexpuesta (todo blanco casi uniforme): JPEG muy pequeño incluso a q=0.90
 *        • Imagen subexpuesta (todo negro): igual de pequño
 *        • Imagen nítida normal: archivo HQ más grande
 *
 * ── Umbrales ─────────────────────────────────────────────────────────────────
 * Los valores actuales están calibrados empíricamente para foto de INE estándar
 * de 1600px de ancho capturada a ~30 cm de distancia.
 * Ajustar con datos reales de campo si hay muchos falsos positivos.
 *
 * ── Limitaciones ─────────────────────────────────────────────────────────────
 * - No es tan preciso como la varianza del Laplaciano (requeriría acceso a píxeles).
 * - Puede confundirse con INE muy dañada (colores muy uniformes por desgaste).
 * - El check es best-effort: si lanza excepción, se retorna { ok: true }.
 */

import * as ImageManipulator from "expo-image-manipulator";

// ── Constantes del thumbnail ──────────────────────────────────────────────────

/** Ancho del thumbnail de análisis (px). Aspect ratio INE ≈ 85.6:53.98 */
const THUMB_W = 300;
/** Alto del thumbnail (300 × 53.98/85.6 ≈ 189 px) */
const THUMB_H = 189;

// ── Umbrales de diagnóstico ───────────────────────────────────────────────────

/**
 * Tamaño mínimo en bytes del thumbnail HQ para una imagen "con contenido".
 * Por debajo → la imagen es muy uniforme (sobreexpuesta o negra).
 * Valor empírico: 300×189 JPEG q=0.90 de INE nítida ≥ 12 KB.
 * Menos de 5 KB sugiere imagen casi uniforme.
 */
const OVEREXPOSURE_MIN_BYTES = 5_000; // < 5 KB

/**
 * blur_score máximo aceptable.
 * Imagen nítida con texto INE: ratio ≈ 0.08–0.25.
 * Imagen borrosa: ratio ≥ 0.55.
 */
const BLUR_MAX_RATIO = 0.55;

/**
 * Si detail_bytes está entre OVEREXPOSURE_MIN_BYTES y este umbral
 * Y blur_score > 0.40, probablemente es un reflejo de holograma
 * (imagen con zona brillante dominante pero algo de detalle).
 */
const HOLOGRAM_BYTES_THRESHOLD = 9_000; // < 9 KB + moderately blurry

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type QualityIssue =
  | "blur" // Imagen desenfocada o con movimiento
  | "overexposed" // Imagen demasiado brillante / quemada
  | "underexposed" // Imagen demasiado oscura
  | "hologram"; // Reflejo del holograma de la INE

export interface QualityCheckResult {
  /** true si la imagen pasa todos los umbrales */
  ok: boolean;
  /** Lista de problemas detectados (vacía si ok=true) */
  issues: QualityIssue[];
  /** Tamaño del thumbnail HQ en bytes (mayor = más detalle) */
  detailBytes: number;
  /**
   * Ratio LQ/HQ como proxy de blur.
   * 0.0 = imagen perfectamente uniforme / sin detalle.
   * 1.0 = imagen idéntica al comprimir fuerte (completamente borrosa).
   */
  blurScore: number;
}

// ── Lógica principal ──────────────────────────────────────────────────────────

/**
 * Genera un thumbnail al tamaño THUMB_W × THUMB_H con la calidad indicada
 * y retorna el tamaño estimado en bytes usando la codificación base64.
 *
 * Se solicita `base64: true` para evitar depender de expo-file-system:
 * el tamaño se aproxima como ⌊base64.length × 0.75⌋.
 */
async function getThumbnailBytes(
  uri: string,
  quality: number,
): Promise<number> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: THUMB_W, height: THUMB_H } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  // base64 infla el tamaño 4/3; el tamaño real en bytes ≈ length × 0.75
  return Math.floor((result.base64?.length ?? 0) * 0.75);
}

/**
 * Evalúa la calidad de una imagen de credencial INE antes de enviarla a OCR.
 *
 * @param uri URI de la imagen ya procesada por `processDocumentImage`
 * @returns Resultado con `ok`, lista de `issues` y métricas internas
 */
export async function checkImageQuality(
  uri: string,
): Promise<QualityCheckResult> {
  try {
    // Generar los dos thumbnails en paralelo para minimizar latencia
    const [hqBytes, lqBytes] = await Promise.all([
      getThumbnailBytes(uri, 0.9),
      getThumbnailBytes(uri, 0.04),
    ]);

    const detailBytes = hqBytes;
    const blurScore = hqBytes > 0 ? lqBytes / hqBytes : 1.0;

    const issues: QualityIssue[] = [];

    if (detailBytes < OVEREXPOSURE_MIN_BYTES) {
      // Imagen muy uniforme → sobreexpuesta o completamente oscura
      // Distinguimos por el blurScore: una imagen oscura tendrá un blurScore
      // similar (~0.8–1.0 porque no hay detalle en ningún caso).
      // Una sobreexpuesta también tendrá un blurScore alto.
      // Usamos el umbral de bytes como discriminador principal.
      issues.push("overexposed");
    } else if (detailBytes < HOLOGRAM_BYTES_THRESHOLD && blurScore > 0.4) {
      // Algo de detalle pero dominado por zona uniforme brillante → holograma
      issues.push("hologram");
    }

    if (blurScore > BLUR_MAX_RATIO) {
      issues.push("blur");
    }

    return {
      ok: issues.length === 0,
      issues,
      detailBytes,
      blurScore,
    };
  } catch {
    // El check es best-effort: nunca bloquear la captura por un error interno
    return { ok: true, issues: [], detailBytes: 0, blurScore: 0 };
  }
}

// ── Mensajes de retroalimentación ─────────────────────────────────────────────

/**
 * Retorna un mensaje legible para mostrar al brigadista cuando se detecta
 * un problema de calidad. Los mensajes son accionables y específicos.
 */
export function qualityIssueMessage(issue: QualityIssue): string {
  switch (issue) {
    case "blur":
      return "Imagen borrosa — mantén la credencial quieta sobre una superficie plana y asegúrate de que esté bien enfocada.";
    case "overexposed":
      return "Imagen muy brillante — aleja la cámara de la fuente de luz o coloca la credencial en una zona con luz difusa.";
    case "underexposed":
      return "Imagen muy oscura — mejora la iluminación o activa el flash.";
    case "hologram":
      return "Posible reflejo del holograma — inclina ligeramente la credencial (10–15°) hasta que desaparezca el destello plateado.";
  }
}

/**
 * Retorna el título del Alert según el issue más grave.
 * Prioridad: hologram > overexposed > underexposed > blur
 */
export function qualityIssueTitle(issues: QualityIssue[]): string {
  if (issues.includes("hologram")) return "⚠️ Reflejo detectado";
  if (issues.includes("overexposed")) return "⚠️ Imagen sobreexpuesta";
  if (issues.includes("underexposed")) return "⚠️ Imagen muy oscura";
  if (issues.includes("blur")) return "⚠️ Imagen borrosa";
  return "⚠️ Calidad baja";
}
