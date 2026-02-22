/**
 * 🪪 INE OCR Parser
 * =================
 * Extrae campos estructurados del texto crudo devuelto por ML Kit
 * cuando se fotografía una Credencial para Votar (INE/IFE de México).
 *
 * ── Decisiones de diseño ────────────────────────────────────────────────────
 *
 * 1. MÓDULO SEPARADO
 *    El algoritmo se extrae de ine-question.tsx a este módulo para que sea
 *    testeable de forma unitaria (jest/vitest) sin montar ningún componente
 *    React. La función `parseIneOcrText` recibe texto plano y devuelve un
 *    objeto tipado — sin efectos secundarios.
 *
 * 2. DOS FASES: NORMALIZACIÓN → EXTRACCIÓN
 *    Phase 1 – normalizeOcrText: limpia el texto crudo antes de cualquier
 *    regex. ML Kit devuelve líneas con basura (caracteres de borde de tarjeta,
 *    saltos dobles, caracteres de marca de agua "INSTITUTO NACIONAL ELECTORAL").
 *    Phase 2 – parseIneOcrText: ya con texto limpio, aplica las estrategias
 *    de extracción en orden de confianza (strict → heuristic → fuzzy).
 *
 * 3. MAPA DE CONFUSIÓN DE CARACTERES (OCR)
 *    La cámara de un teléfono en condiciones reales produce errores predecibles:
 *      O ↔ 0,  I ↔ 1 ↔ L,  B ↔ 8,  S ↔ 5,  Z ↔ 2,  G ↔ 6,  Q ↔ 0
 *    Para CURP y Clave de Elector, donde el formato es determinístico
 *    (posición a posición: letras vs dígitos), se aplica la corrección
 *    inversa antes del regex. Esto evita rechazar un CURP válido porque
 *    el OCR leyó "PATR8301" en vez de "PATRB301".
 *
 * 4. ESTRATEGIA POR CAMPO (strict > heuristic > fallback)
 *    Cada campo tiene hasta 3 niveles:
 *      - strict:    regex con patrón fuerte (p.ej. CURP: 18 chars específicos)
 *      - heuristic: buscar la línea siguiente a la etiqueta del campo en el
 *                   texto (p.ej. línea después de "NOMBRE")
 *      - fallback:  heurística posicional o candidato más probable sin etiqueta
 *    Se guarda en `fieldMethod` para calcular confianza por campo.
 *
 * 5. CONFIANZA POR CAMPO, NO GLOBAL
 *    La confianza anterior era una media ponderada de bloques ML Kit, lo que
 *    no reflejaba si los campos se extrajeron o no. Ahora:
 *      - Strict match  → 1.0
 *      - Heuristic     → 0.75
 *      - Fuzzy/fallback→ 0.45
 *      - No encontrado → 0.0
 *    `overallConfidence` = media de los campos con valor ÷ total de campos.
 *    La UI puede pintar campo a campo con el color adecuado.
 *
 * 6. SOPORTE MULTI-VERSIÓN INE
 *    Se han emitido al menos 4 modelos desde 2008:
 *      MODELO_A: IFE 2008 — etiquetas en español, layout horizontal
 *      MODELO_B: IFE 2013 — añade QR, fuente diferente
 *      MODELO_C: INE 2015 — rediseño, "CURP" visible en anverso
 *      MODELO_D: INE 2019 — Modelo F, chip NFC, fuente sans-serif más pequeña
 *    Se detecta el modelo a partir de tokens característicos y se ajustan las
 *    estrategias (p.ej. en Modelo C/D el CURP está en el frente; en A/B solo
 *    en el reverso).
 *
 * 7. NOMBRES: ESTRATEGIAS EN CASCADA
 *    INE tiene tres campos: APELLIDO PATERNO, APELLIDO MATERNO, NOMBRE(S).
 *    Estrategia A – etiquetas explícitas: si hay línea "APELLIDO PATERNO"
 *      tomar la siguiente línea no-etiqueta.
 *    Estrategia B – bloque de nombre en frente: las 2–3 líneas en mayúsculas
 *      que preceden al CURP o a la fecha de nacimiento.
 *    Estrategia C – derivar desde CURP: los 4 primeros caracteres codifican
 *      inicial-apellido-paterno + inicial-apellido-materno + iniciales-nombre.
 *      Si lo único que tenemos es el CURP, al menos podemos sugerir iniciales.
 *
 * 8. DOMICILIO: RECOLECCIÓN MULTI-LÍNEA
 *    El reverso tiene el domicilio en 2–4 líneas seguidas. Se recolectan
 *    hasta la primera línea que parece una etiqueta de campo (mayúsculas
 *    cortas: "CLAVE", "ESTADO", "MUNICIPIO", etc.) o hasta máximo 4 líneas.
 *
 * 9. FECHAS: 3 FORMATOS
 *    INE ha usado al menos tres formatos de fecha:
 *      - DD/MM/YYYY  (más común, modelos A-C)
 *      - DD MMM YYYY (p.ej. "05 ENE 1990", modelos C-D)
 *      - DDMMYYYY    (sin separadores, cuando OCR pega dígitos)
 *    Se normalizan todos a DD/MM/YYYY para consistencia.
 *
 * ── Limitaciones conocidas ──────────────────────────────────────────────────
 *    - ML Kit no garantiza orden de bloques; usamos heurísticas de posición
 *      relativa entre etiquetas, no coordenadas absolutas (esas requieren
 *      la API Premium de Vision).
 *    - Credenciales muy dañadas o plastificadas con reflejo intenso pueden
 *      producir texto demasiado ruidoso para extraer nombres.
 *    - No se maneja la MRZ (Machine Readable Zone) que tienen algunos modelos
 *      en el reverso — puede confundir el regex de CURP con cadenas similares.
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Resultado de la extracción OCR con confianza por campo */
export interface IneOcrResult {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  claveElector: string;
  curp: string;
  fechaNacimiento: string; // formato DD/MM/YYYY
  sexo: string;            // "H" | "M"
  seccion: string;
  vigencia: string;        // año YYYY
  domicilio: string;
  /** Modelo de credencial detectado (Decisión §6) */
  modeloDetected: IneModelo;
  /** Confianza global 0–1 calculada como media de campos con valor */
  confidence: number;
  /** Confianza individual 0–1 por campo (para UI por campo) */
  fieldConfidence: Record<keyof Omit<IneOcrResult, "confidence" | "fieldConfidence" | "modeloDetected">, number>;
}

/** Versión del modelo de credencial detectada */
export type IneModelo = "A_IFE2008" | "B_IFE2013" | "C_INE2015" | "D_INE2019" | "unknown";

// ── Constantes ────────────────────────────────────────────────────────────────

/**
 * Mapa de confusión OCR: carácter frecuentemente leído → corrección esperada.
 * Se aplica selectivamente según si la posición en el campo debe ser letra o dígito.
 * (Decisión §3)
 */
const OCR_DIGIT_TO_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "8": "B",
  "5": "S",
  "2": "Z",
  "6": "G",
  "9": "P",
};
const OCR_LETTER_TO_DIGIT: Record<string, string> = {
  O: "0",
  I: "1",
  L: "1",
  B: "8",
  S: "5",
  Z: "2",
  G: "6",
};

/**
 * Tokens que indican inicio de línea-etiqueta (no son valores de campo).
 * Usados para detener la recolección multi-línea del domicilio.
 */
const LABEL_TOKENS = [
  /^CLAVE/i,
  /^CURP/i,
  /^ESTADO/i,
  /^MUNICIPIO/i,
  /^LOCALIDAD/i,
  /^SECCI[OÓ]N/i,
  /^VIGENCIA/i,
  /^FECHA/i,
  /^SEXO/i,
  /^INE/i,
  /^IFE/i,
  /^INSTITUTO/i,
  // Campos de domicilio que actúan como separadores entre secciones del reverso
  /^COLONIA/i,
  /^C[OÓ]DIGO/i,   // CODIGO POSTAL
  /^C\.P\./i,
  /^NOMBRE/i,       // previene que líneas "NOMBRE" de otra sección se incluyan en domicilio
  /^APELLIDO/i,
];

// ── Regex de extracción (Decisión §6 + §3) ────────────────────────────────────

/**
 * CURP: formato oficial es 18 caracteres.
 * Posiciones 0-3: consonantes del nombre (letras)
 * Posiciones 4-9: fecha de nacimiento YYMMDD (dígitos)
 * Posición 10: sexo H/M (letra)
 * Posiciones 11-13: abreviatura de estado nacimiento (letras)
 * Posiciones 14-17: consonantes internas + homoclave (alfanumérico)
 *
 * Usamos character class ampliado para capturar errores OCR comunes
 * [A-Z0-9] y luego sanear con fixCurpOcr().
 */
const CURP_LOOSE_RE =
  /\b[A-Z]{1,4}[A-Z0-9]{2}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[HMhm01][A-Z]{5,6}[A-Z0-9]{1,3}\b/;

/**
 * Clave de Elector: 18 caracteres.
 * 6 letras + 8 dígitos + H/M + 3 dígitos
 * También capturamos variante loose para corrección post-match.
 */
const CLAVE_ELECTOR_LOOSE_RE =
  /\b[A-Z0-9]{6}\d{8}[HM01][0-9]{3}\b/;

/** Sección electoral: etiqueta + 4 dígitos */
const SECCION_RE = /SECCI[OÓ]N\s*[:\-]?\s*(\d{3,4})/i;

/** Vigencia: año de 4 dígitos después de la etiqueta */
const VIGENCIA_RE = /VIGENCIA\s*[:\-]?\s*(\d{4})/i;

/** Fecha DD/MM/YYYY */
const FECHA_SLASH_RE = /\b(\d{2})\/(\d{2})\/(\d{4})\b/;

/** Fecha "DD ENE 1990" — meses en español abreviados (Decisión §9) */
const MESES: Record<string, string> = {
  ENE: "01", FEB: "02", MAR: "03", ABR: "04",
  MAY: "05", JUN: "06", JUL: "07", AGO: "08",
  SEP: "09", OCT: "10", NOV: "11", DIC: "12",
};
const FECHA_MES_RE =
  /\b(\d{2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{4})\b/i;

/** Fecha sin separadores DDMMYYYY */
const FECHA_CONCAT_RE = /\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{4})\b/;

/** Sexo: etiqueta + H o M */
const SEXO_RE = /\bSEXO\s*[:\-]?\s*([HM])\b/i;

// ── Normalización de texto (Decisión §2) ──────────────────────────────────────

/**
 * Normaliza el texto OCR crudo antes de extraer campos.
 * Pasos:
 *  a) Convertir a mayúsculas (INE es todo caps; la normalización hace los
 *     regex más simples y evita falsos negativos por casing mixto).
 *  b) Reemplazar caracteres especiales comunes de marca de agua / borde
 *     de tarjeta (◆ ● ■ » * | ~) por espacio.
 *  c) Colapsar espacios múltiples en uno solo dentro de cada línea.
 *  d) Eliminar líneas cortas (< 2 chars) que son ruido de borde.
 *  e) Eliminar líneas que son solo dígitos < 2 chars (bordes de frame).
 */
export function normalizeOcrText(raw: string): string {
  return raw
    .toUpperCase()
    // a) ANTES de eliminar la virgulilla (~), reconstruir la Ñ que ML Kit
    //    puede haber separado en dos caracteres: "MUN~OZ" → "MUÑOZ".
    //    Patrones comunes según el motor OCR:
    //      N˜  (N + virgulilla combinatoria U+02DC)
    //      N~   (N + tilde ASCII)
    //      ~N   (tilde al revés, menos frecuente)
    .replace(/N[˜~]/g, "Ñ")
    .replace(/[˜~]N/g, "Ñ")
    // b) Reemplazar símbolos de marca de agua / bordes (ahora que ~ ya fue manejada)
    .replace(/[◆●■»*|~#@%^&]/g, " ")
    // c) Colapsar whitespace interno
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    // d) Eliminar ruido (líneas muy cortas que no son valor de campo)
    .filter((line) => line.length >= 2)
    // e) Filtrar líneas MRZ (Machine-Readable Zone: contienen <)
    //    que aparecen en el reverso de algunos modelos y confunden
    //    el regex de CURP con cadenas similares de 18 chars.
    .filter((line) => !line.includes("<"))
    .join("\n");
}

// ── Corrección de caracteres OCR en campos con formato fijo (Decisión §3) ─────

/**
 * Corrige confusiones OCR en una cadena candidata a CURP.
 * La CURP tiene posiciones con formato determinístico:
 *   [0-3] letra  [4-9] dígito  [10] H/M  [11-13] letra  [14-17] alfanumerico
 * Aplicamos la corrección según si la posición "debería" ser letra o dígito.
 */
export function fixCurpOcr(raw: string): string {
  if (raw.length !== 18) return raw;
  const chars = raw.split("");

  // Posiciones que deben ser letras (0-3, 10-13)
  const letterPositions = [0, 1, 2, 3, 10, 11, 12, 13];
  // Posiciones que deben ser dígitos (4-9)
  const digitPositions = [4, 5, 6, 7, 8, 9];
  // Posiciones 14-17: alfanumérico — no corregir

  for (const pos of letterPositions) {
    const ch = chars[pos];
    if (OCR_DIGIT_TO_LETTER[ch]) chars[pos] = OCR_DIGIT_TO_LETTER[ch];
  }
  for (const pos of digitPositions) {
    const ch = chars[pos];
    if (OCR_LETTER_TO_DIGIT[ch]) chars[pos] = OCR_LETTER_TO_DIGIT[ch];
  }
  return chars.join("");
}

/**
 * Corrige confusiones OCR en una cadena candidata a Clave de Elector.
 * Formato: LLLLLL-DDDDDDDD-S-DDD  (L=letra, D=dígito, S=sexo H/M)
 * Pos 0-5: letras, 6-13: dígitos, 14: H/M (letra), 15-17: dígitos.
 */
export function fixClaveElectorOcr(raw: string): string {
  if (raw.length !== 18) return raw;
  const chars = raw.split("");
  const letterPositions = [0, 1, 2, 3, 4, 5, 14];
  const digitPositions = [6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17];

  for (const pos of letterPositions) {
    const ch = chars[pos];
    if (OCR_DIGIT_TO_LETTER[ch]) chars[pos] = OCR_DIGIT_TO_LETTER[ch];
  }
  for (const pos of digitPositions) {
    const ch = chars[pos];
    if (OCR_LETTER_TO_DIGIT[ch]) chars[pos] = OCR_LETTER_TO_DIGIT[ch];
  }
  return chars.join("");
}

// ── Extracción de fecha con múltiples formatos (Decisión §9) ──────────────────

/**
 * Intenta extraer una fecha del texto y la normaliza a DD/MM/YYYY.
 * Prueba los tres formatos en orden de confianza.
 * Retorna null si no encuentra nada válido.
 */
export function extractFecha(text: string): { value: string; confidence: number } | null {
  // 1. Formato DD/MM/YYYY (más común y directo)
  const slashMatch = text.match(FECHA_SLASH_RE);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    if (isValidDate(dd, mm, yyyy)) {
      return { value: `${dd}/${mm}/${yyyy}`, confidence: 1.0 };
    }
  }

  // 2. Formato "05 ENE 1990" con mes abreviado en español
  const mesMatch = text.match(FECHA_MES_RE);
  if (mesMatch) {
    const [, dd, mesAbr, yyyy] = mesMatch;
    const mm = MESES[mesAbr.toUpperCase()];
    if (mm && isValidDate(dd, mm, yyyy)) {
      return { value: `${dd}/${mm}/${yyyy}`, confidence: 0.95 };
    }
  }

  // 3. Fecha pegada sin separadores DDMMYYYY
  const concatMatch = text.match(FECHA_CONCAT_RE);
  if (concatMatch) {
    const [, dd, mm, yyyy] = concatMatch;
    if (isValidDate(dd, mm, yyyy)) {
      return { value: `${dd}/${mm}/${yyyy}`, confidence: 0.6 };
    }
  }

  return null;
}

function isValidDate(dd: string, mm: string, yyyy: string): boolean {
  const d = parseInt(dd, 10);
  const m = parseInt(mm, 10);
  const y = parseInt(yyyy, 10);
  return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100;
}

// ── Detección de modelo de INE (Decisión §6) ──────────────────────────────────

/**
 * Detecta la versión aproximada de la credencial a partir de tokens
 * característicos en el texto OCR normalizado.
 *
 * Heurísticas usadas:
 * - "INSTITUTO FEDERAL ELECTORAL" → IFE (modelos A o B)
 * - "INSTITUTO NACIONAL ELECTORAL" → INE (modelos C o D)
 * - Presencia de "MODELO D" o "MODELO F" explícito en el texto → Modelo D
 * - Presencia de QR (no detectable por texto) — se ignora
 * - Año de vigencia ≥ 2024 sugiere modelo D (INE 2019+)
 */
export function detectIneModelo(normalizedText: string): IneModelo {
  if (/INSTITUTO\s+FEDERAL\s+ELECTORAL/.test(normalizedText)) {
    // B_IFE2013 se distribuyó entre 2011 y 2017 con vigencias 2014–2021.
    // Si la vigencia es ≥ 2014 asumimos Modelo B (QR visible, layout ligeramente distinto).
    const vigenciaIfeMtch = normalizedText.match(VIGENCIA_RE);
    if (vigenciaIfeMtch && parseInt(vigenciaIfeMtch[1], 10) >= 2014) {
      return "B_IFE2013";
    }
    return "A_IFE2008";
  }
  if (/INSTITUTO\s+NACIONAL\s+ELECTORAL/.test(normalizedText)) {
    const vigenciaMatch = normalizedText.match(VIGENCIA_RE);
    if (vigenciaMatch && parseInt(vigenciaMatch[1], 10) >= 2024) {
      return "D_INE2019";
    }
    return "C_INE2015";
  }
  return "unknown";
}

// ── Extracción de nombres (Decisión §7) ───────────────────────────────────────

interface NameResult {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  method: "labels" | "block" | "curp_initials" | "none";
}

/**
 * Estrategia A – Etiquetas explícitas
 * Busca líneas "APELLIDO PATERNO", "APELLIDO MATERNO", "NOMBRE(S)" y toma
 * la línea siguiente que no sea otra etiqueta.
 * Es la más confiable cuando ML Kit preserva el orden de bloques.
 */
function extractNamesFromLabels(lines: string[]): NameResult | null {
  const result = { nombre: "", apellidoPaterno: "", apellidoMaterno: "" };
  let found = false;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (/^APELLIDO\s+PATERNO$/i.test(line) && next && !isLabel(next)) {
      result.apellidoPaterno = cleanNameValue(next);
      found = true;
    }
    if (/^APELLIDO\s+MATERNO$/i.test(line) && next && !isLabel(next)) {
      result.apellidoMaterno = cleanNameValue(next);
      found = true;
    }
    if (/^NOMBRE\(S\)|^NOMBRE$/i.test(line) && next && !isLabel(next)) {
      result.nombre = cleanNameValue(next);
      found = true;
    }
    // También maneja etiqueta y valor en la misma línea: "APELLIDO PATERNO GARCIA"
    const inlineAP = line.match(/^APELLIDO\s+PATERNO\s+(.+)$/i);
    if (inlineAP) {
      result.apellidoPaterno = cleanNameValue(inlineAP[1]);
      found = true;
    }
    const inlineAM = line.match(/^APELLIDO\s+MATERNO\s+(.+)$/i);
    if (inlineAM) {
      result.apellidoMaterno = cleanNameValue(inlineAM[1]);
      found = true;
    }
  }

  return found ? { ...result, method: "labels" } : null;
}

/**
 * Estrategia B – Bloque de nombre antes del CURP
 * En muchas versiones de INE el bloque nombre/apellidos aparece como 3 líneas
 * seguidas (AP PATERNO, AP MATERNO, NOMBRE) justo antes de la fecha o CURP.
 *
 * Busca el índice del CURP (o fecha) y retrocede 1-3 líneas capturando
 * candidatos: solo letras, sin números, longitud >= 3.
 */
function extractNamesFromBlock(lines: string[], curp: string): NameResult | null {
  // Ancla primaria: línea que contiene los primeros 10 chars del CURP
  let anchorIdx = curp
    ? lines.findIndex((l) => l.includes(curp.substring(0, 10)))
    : -1;

  // Ancla secundaria: cuando el CURP no está disponible, anclar en
  // "FECHA DE NACIMIENTO" — los nombres siempre la preceden en todos los
  // modelos INE. Esto mejora la extracción cuando OCR del reverso falla.
  if (anchorIdx < 2) {
    const fechaIdx = lines.findIndex((l) => /FECHA\s+DE\s+NAC/i.test(l));
    if (fechaIdx >= 2) anchorIdx = fechaIdx;
  }

  if (anchorIdx < 2) return null;

  const candidates: string[] = [];
  for (let i = anchorIdx - 1; i >= Math.max(0, anchorIdx - 4); i--) {
    const l = lines[i];
    // Líneas de nombre: solo mayúsculas + espacios + tildes, len >= 3
    if (/^[A-ZÁÉÍÓÚÑÜ\s]{3,}$/.test(l) && !isLabel(l)) {
      candidates.unshift(l.trim());
    } else {
      break; // Encontramos ruido — detener
    }
  }

  // Las INE más comunes ordenan: APELLIDO PATERNO / APELLIDO MATERNO / NOMBRE(S)
  if (candidates.length >= 3) {
    return {
      apellidoPaterno: cleanNameValue(candidates[0]),
      apellidoMaterno: cleanNameValue(candidates[1]),
      nombre: cleanNameValue(candidates.slice(2).join(" ")),
      method: "block",
    };
  }
  if (candidates.length === 2) {
    return {
      apellidoPaterno: cleanNameValue(candidates[0]),
      apellidoMaterno: cleanNameValue(candidates[1]),
      nombre: "",
      method: "block",
    };
  }
  return null;
}

/**
 * Estrategia C – Iniciales desde CURP (fallback)
 * CURP posición 0: primer consonante interna ap. paterno
 * CURP posición 1: primera vocal ap. paterno
 * CURP posición 2: primer consonante interna ap. materno
 * CURP posición 3: primera consonante interna del nombre
 * Solo devuelve iniciales — útil para mostrar algo cuando el texto es ilegible.
 */
function extractNamesFromCurp(curp: string): NameResult {
  if (curp.length < 4) {
    return { nombre: "", apellidoPaterno: "", apellidoMaterno: "", method: "none" };
  }
  return {
    apellidoPaterno: curp[0] + curp[1] + "...",
    apellidoMaterno: curp[2] + "...",
    nombre: curp[3] + "...",
    method: "curp_initials",
  };
}

// ── Extracción de domicilio (Decisión §8) ─────────────────────────────────────

function extractDomicilio(lines: string[]): { value: string; confidence: number } {
  const domIdx = lines.findIndex((l) => /^DOMICILIO/i.test(l));
  if (domIdx < 0) return { value: "", confidence: 0 };

  const addressLines: string[] = [];
  // Hasta 6 líneas — modelos con colonia/municipio/estado separados pueden
  // tener más de 4 líneas de dirección (Decisión §8, roadmap item 9).
  for (let i = domIdx + 1; i < Math.min(domIdx + 7, lines.length); i++) {
    if (isLabel(lines[i])) break;
    // Filtrar líneas que son solo números cortos (números de página, etc.)
    if (/^\d{1,3}$/.test(lines[i])) continue;
    addressLines.push(lines[i]);
  }

  if (addressLines.length === 0) return { value: "", confidence: 0 };
  return {
    value: addressLines.join(", "),
    confidence: addressLines.length >= 2 ? 0.85 : 0.5,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLabel(line: string): boolean {
  return LABEL_TOKENS.some((re) => re.test(line));
}

/** Elimina artefactos OCR comunes del valor de un nombre */
function cleanNameValue(s: string): string {
  return s
    .replace(/[^A-ZÁÉÍÓÚÑÜ\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Cálculo de confianza global (Decisión §5) ─────────────────────────────────

type FieldConf = Record<
  keyof Omit<IneOcrResult, "confidence" | "fieldConfidence" | "modeloDetected">,
  number
>;

/**
 * Pesos relativos por campo.
 * CURP y Clave de Elector son validables con regex estricto → peso mayor.
 * Domicilio y Sección son secundarios para identificación → peso menor.
 */
const FIELD_WEIGHTS: Partial<Record<keyof FieldConf, number>> = {
  curp:            2.0,
  claveElector:    1.5,
  nombre:          1.5,
  apellidoPaterno: 1.2,
  apellidoMaterno: 1.0,
  fechaNacimiento: 1.2,
  sexo:            0.8,
  seccion:         0.6,
  vigencia:        0.6,
  domicilio:       0.8,
};

function computeOverallConfidence(fields: FieldConf, results: Omit<IneOcrResult, "confidence" | "fieldConfidence" | "modeloDetected">): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const k of Object.keys(fields)) {
    const key = k as keyof FieldConf;
    const weight = FIELD_WEIGHTS[key] ?? 1.0;
    const hasValue = String((results as any)[key]).length > 0;
    totalWeight += weight;
    if (hasValue) weightedScore += fields[key] * weight;
  }

  return totalWeight > 0 ? Math.min(weightedScore / totalWeight, 1) : 0;
}

// ── Función principal (Decisión §2) ───────────────────────────────────────────

/**
 * Extrae campos INE del texto OCR normalizado.
 *
 * @param frontText  Texto crudo del anverso (puede ser null si no se capturó aún)
 * @param backText   Texto crudo del reverso
 * @returns IneOcrResult con todos los campos y confianzas
 */
export function parseIneOcrText(
  frontText: string | null,
  backText: string | null,
): IneOcrResult {
  // Paso 1: Normalizar ambos textos
  const front = normalizeOcrText(frontText ?? "");
  const back = normalizeOcrText(backText ?? "");
  const combined = [front, back].filter(Boolean).join("\n");

  // Paso 2: Dividir en líneas para estrategias de contexto
  const lines = combined
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  // Paso 3: Inicializar confianzas por campo (Decisión §5)
  const fc: FieldConf = {
    curp:            0,
    claveElector:    0,
    nombre:          0,
    apellidoPaterno: 0,
    apellidoMaterno: 0,
    fechaNacimiento: 0,
    sexo:            0,
    seccion:         0,
    vigencia:        0,
    domicilio:       0,
  };

  const res = {
    curp:            "",
    claveElector:    "",
    nombre:          "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaNacimiento: "",
    sexo:            "",
    seccion:         "",
    vigencia:        "",
    domicilio:       "",
  };

  // ── Campo: CURP ──────────────────────────────────────────────────────────
  // CURP está en el reverso (todos los modelos) y en el anverso (modelo C/D).
  // Probamos combined primero; si hay múltiples matches tomamos el de 18 chars.
  {
    const candidates = [...combined.matchAll(new RegExp(CURP_LOOSE_RE.source, "g"))]
      .map((m) => m[0])
      .filter((c) => c.length >= 17 && c.length <= 19);

    const best = candidates
      .map(fixCurpOcr)
      .find((c) => c.length === 18) ?? null;

    if (best) {
      res.curp = best;
      // Validar con regex estricto post-corrección
      fc.curp = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(best) ? 1.0 : 0.75;
    }
  }

  // ── Campo: Clave de Elector ──────────────────────────────────────────────
  {
    const candidates = [...combined.matchAll(new RegExp(CLAVE_ELECTOR_LOOSE_RE.source, "g"))]
      .map((m) => m[0])
      .filter((c) => c.length === 18);

    const best = candidates.map(fixClaveElectorOcr)[0] ?? null;
    if (best) {
      res.claveElector = best;
      fc.claveElector = /^[A-Z]{6}\d{8}[HM]\d{3}$/.test(best) ? 1.0 : 0.7;
    }
  }

  // ── Campo: Fecha de nacimiento ───────────────────────────────────────────
  {
    // Primero buscar en "FECHA DE NACIMIENTO ..." si existe como contexto
    const fechaContextLine = lines.find((l) => /FECHA\s+DE\s+NAC/i.test(l));
    const searchText = fechaContextLine
      ? fechaContextLine + "\n" + (lines[lines.indexOf(fechaContextLine) + 1] ?? "")
      : combined;

    const fechaResult = extractFecha(searchText);
    if (fechaResult) {
      res.fechaNacimiento = fechaResult.value;
      fc.fechaNacimiento = fechaResult.confidence;
    }
  }
  // Fallback: derivar fecha desde CURP si el OCR no encontró una fecha.
  // CURP posiciones 4-5=YY, 6-7=MM, 8-9=DD.
  // Lógica de siglo para padrón electoral (edad mínima 18 años en 2026):
  //   YY 00-08 → 2000-2008 (18-26 años),  YY 09-99 → 1909-1999 (27+ años).
  if (!res.fechaNacimiento && res.curp.length === 18) {
    const yy = parseInt(res.curp.substring(4, 6), 10);
    const mm = res.curp.substring(6, 8);
    const dd = res.curp.substring(8, 10);
    const year = yy <= 8 ? 2000 + yy : 1900 + yy;
    // Sólo usar si los valores son plausibles
    if (isValidDate(dd, mm, String(year))) {
      res.fechaNacimiento = `${dd}/${mm}/${year}`;
      fc.fechaNacimiento  = 0.8; // Derivado de CURP — confiable pero no literal
    }
  }
  // ── Campo: Sexo ──────────────────────────────────────────────────────────
  {
    const sexoMatch = combined.match(SEXO_RE);
    if (sexoMatch) {
      res.sexo = sexoMatch[1].toUpperCase();
      fc.sexo = 1.0;
    } else if (res.curp.length === 18) {
      // Derivar desde CURP posición 10 (Decisión §7 — misma lógica aplica aquí)
      const sexoCurp = res.curp[10];
      if (sexoCurp === "H" || sexoCurp === "M") {
        res.sexo = sexoCurp;
        fc.sexo = 0.85; // Derivado de CURP, no de etiqueta directa
      }
    }
  }

  // ── Campo: Sección electoral ─────────────────────────────────────────────
  {
    const secMatch = combined.match(SECCION_RE);
    if (secMatch) {
      res.seccion = secMatch[1];
      fc.seccion = 1.0;
    }
  }

  // ── Campo: Vigencia ──────────────────────────────────────────────────────
  {
    const vigMatch = combined.match(VIGENCIA_RE);
    if (vigMatch) {
      res.vigencia = vigMatch[1];
      fc.vigencia = 1.0;
    }
  }

  // ── Campos: Nombres ──────────────────────────────────────────────────────
  // Cascada de estrategias (Decisión §7)
  const namesByLabels = extractNamesFromLabels(lines);
  const namesByBlock  = extractNamesFromBlock(lines, res.curp);
  const namesFallback = res.curp ? extractNamesFromCurp(res.curp) : null;

  const nameResult =
    namesByLabels ??
    namesByBlock ??
    namesFallback ?? { nombre: "", apellidoPaterno: "", apellidoMaterno: "", method: "none" };

  const nameConfidenceMap: Record<NameResult["method"], number> = {
    labels:         0.9,
    block:          0.7,
    curp_initials:  0.3,
    none:           0.0,
  };
  const nameConf = nameConfidenceMap[nameResult.method];

  res.nombre          = nameResult.nombre;
  res.apellidoPaterno = nameResult.apellidoPaterno;
  res.apellidoMaterno = nameResult.apellidoMaterno;
  fc.nombre           = res.nombre          ? nameConf : 0;
  fc.apellidoPaterno  = res.apellidoPaterno  ? nameConf : 0;
  fc.apellidoMaterno  = res.apellidoMaterno  ? nameConf : 0;

  // ── Campo: Domicilio ─────────────────────────────────────────────────────
  // Solo en el reverso (Decisión §8)
  {
    const backLines = back
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 2);

    const domResult = extractDomicilio(backLines);
    if (domResult.value) {
      res.domicilio = domResult.value;
      fc.domicilio  = domResult.confidence;
    }
  }

  // ── Modelo de credencial ─────────────────────────────────────────────────
  const modeloDetected = detectIneModelo(combined);

  // ── Confianza global ─────────────────────────────────────────────────────
  const confidence = computeOverallConfidence(fc, res);

  return {
    ...res,
    modeloDetected,
    confidence,
    fieldConfidence: fc,
  };
}
