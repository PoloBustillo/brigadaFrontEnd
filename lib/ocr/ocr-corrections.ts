/**
 * 🔄 OCR Correction Learning
 * ==========================
 * Persiste pares (valor_ocr_incorrecto → valor_corregido_por_usuario)
 * en AsyncStorage y los aplica automáticamente en la siguiente captura.
 *
 * Flujo:
 *   1. El usuario edita un campo OCR en la pantalla de confirmación.
 *   2. `saveCorrection(field, rawOcrValue, correctedValue)` guarda el par.
 *   3. La próxima vez que se ejecuta `parseIneOcrText`, las correcciones
 *      se aplican DESPUÉS de la extracción (en el resultado parseado),
 *      antes de devolver el objeto `IneOcrResult`.
 *
 * Estructura de almacenamiento:
 *   {
 *     "nombre":    { "JIAN": "JUAN", "JOS": "JOSE" },
 *     "curp":      { "GALM900101HMCRPN0B": "GALM900101HMCRPN09" },
 *     "domicilio": { ... },
 *     ...
 *   }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Campos de texto editables de una INE (espejo de IneOcrResult, excluyendo metadatos) */
export type IneTextFieldKey =
  | "nombre"
  | "apellidoPaterno"
  | "apellidoMaterno"
  | "claveElector"
  | "curp"
  | "fechaNacimiento"
  | "sexo"
  | "seccion"
  | "vigencia"
  | "domicilio";

/**
 * Mapa de correcciones por campo.
 * Clave externa: nombre del campo INE.
 * Clave interna: valor OCR normalizado (uppercase, sin espacios extremos).
 * Valor: corrección aplicada por el usuario.
 */
export type FieldCorrections = Partial<
  Record<IneTextFieldKey, Record<string, string>>
>;

// ── Constantes ────────────────────────────────────────────────────────────────

const CORRECTIONS_KEY = "ine_ocr_corrections_v1";

/**
 * Máximo de correcciones por campo.
 * Evita un crecimiento ilimitado del storage si hay muchas capturas.
 */
const MAX_CORRECTIONS_PER_FIELD = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normaliza un valor OCR para usarlo como clave de corrección */
function normalizeKey(value: string): string {
  return value.trim().toUpperCase().normalize("NFC");
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Carga el mapa de correcciones desde AsyncStorage.
 * Devuelve `{}` si no hay datos o si ocurre un error de parseo.
 */
export async function loadCorrections(): Promise<FieldCorrections> {
  try {
    const raw = await AsyncStorage.getItem(CORRECTIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FieldCorrections;
  } catch {
    return {};
  }
}

/**
 * Guarda un par (valor_ocr → valor_corregido) para el campo indicado.
 *
 * - No guarda si los valores son iguales después de normalizar.
 * - No guarda si alguno de los valores está vacío.
 * - Aplica el límite `MAX_CORRECTIONS_PER_FIELD` (FIFO: elimina la más antigua).
 *
 * @returns El mapa actualizado de correcciones (útil para actualizar un ref)
 */
export async function saveCorrection(
  field: IneTextFieldKey,
  rawValue: string,
  correctedValue: string,
): Promise<FieldCorrections> {
  const rawKey = normalizeKey(rawValue);
  const corrKey = normalizeKey(correctedValue);

  // No guardar si están vacíos o son iguales
  if (!rawKey || !corrKey || rawKey === corrKey) {
    return loadCorrections();
  }

  try {
    const existing = await loadCorrections();
    const fieldMap: Record<string, string> = existing[field] ?? {};

    // Aplicar límite FIFO
    const keys = Object.keys(fieldMap);
    if (keys.length >= MAX_CORRECTIONS_PER_FIELD) {
      delete fieldMap[keys[0]];
    }

    fieldMap[rawKey] = correctedValue.trim();
    existing[field] = fieldMap;

    await AsyncStorage.setItem(CORRECTIONS_KEY, JSON.stringify(existing));
    return existing;
  } catch {
    // Si falla el guardado, devolver lo que había
    return loadCorrections();
  }
}

/**
 * Aplica la corrección para un campo específico a un valor extraído por OCR.
 *
 * Si existe una corrección para `value` en el campo `field`, devuelve el valor
 * corregido. De lo contrario devuelve `value` sin modificar.
 */
export function applyFieldCorrection(
  value: string,
  corrections: FieldCorrections,
  field: IneTextFieldKey,
): string {
  const fieldMap = corrections[field];
  if (!fieldMap) return value;
  const key = normalizeKey(value);
  return fieldMap[key] ?? value;
}

/**
 * Elimina TODAS las correcciones guardadas.
 * Principalmente útil para testing o si el usuario quiere resetear el aprendizaje.
 */
export async function clearAllCorrections(): Promise<void> {
  await AsyncStorage.removeItem(CORRECTIONS_KEY);
}
