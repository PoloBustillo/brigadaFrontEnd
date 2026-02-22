/**
 * 📐 INE Spatial OCR Extraction
 * =============================
 * Usa las coordenadas (bounding boxes) devueltas por ML Kit para asignar
 * bloques de texto a campos específicos de la INE basándose en la
 * disposición física conocida de la credencial.
 *
 * ── Layout REAL de la INE (frente) ──────────────────────────────────────────
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  INSTITUTO NACIONAL ELECTORAL               │  ← header (y: 0–8%)
 *   ├─────────┬───────────────────────────────────┤
 *   │         │  NOMBRE                            │
 *   │  FOTO   │  línea apellido paterno             │  ← nombres (y: 8–30%, x >25%)
 *   │         │  línea apellido materno             │
 *   │         │  línea nombre(s)                    │
 *   │         ├───────────────────────────────────┤
 *   │         │  DOMICILIO                         │
 *   │         │  calle y número                    │  ← domicilio (y: 30–55%, x >25%)
 *   │         │  colonia, C.P.                     │
 *   │         │  municipio, estado                 │
 *   │         ├───────────────────────────────────┤
 *   │         │  CLAVE DE ELECTOR                  │
 *   │ FIRMA   │  CURP                              │  ← datos (y: 55–80%, x >25%)
 *   │         │  SECCIÓN  AÑO REGISTRO             │
 *   │         │  FECHA NACIMIENTO                  │
 *   ├─────────┴───────────────────────────────────┤
 *   │  SEXO (derecha)  │  MRZ inferior             │  ← footer (y: 80–100%)
 *   └─────────────────────────────────────────────┘
 *
 * **El DOMICILIO está en el FRENTE** de la INE, entre los nombres y los
 * datos de identificación (CURP, clave, sección).
 *
 * ── Layout de la INE (reverso) ──────────────────────────────────────────────
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  Datos adicionales / código de barras        │
 *   │  MRZ (Machine Readable Zone)                │
 *   │  QR code / datos magnéticos                 │
 *   └─────────────────────────────────────────────┘
 *
 *   El reverso NO contiene el domicilio en la mayoría de los modelos.
 *   Algunos modelos antiguos (IFE) pueden tener info aquí, por eso
 *   mantenemos la búsqueda en reverso como fallback.
 *
 * Estas proporciones son aproximadas (±5%) y varían según el modelo de INE.
 * La clave es que son RELATIVAS al tamaño total de la imagen, no absolutas.
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Bloque de texto con coordenadas espaciales de ML Kit */
export interface OcrBlock {
  text: string;
  frame?: { x: number; y: number; width: number; height: number };
  lines: { text: string; confidence?: number }[];
}

/** Resultado del análisis espacial: bloques clasificados por zona */
export interface SpatialZones {
  /** Bloques en la zona de nombres (frente, derecha-superior) */
  nameBlocks: OcrBlock[];
  /** Bloques en la zona de domicilio (frente, debajo de nombres) */
  addressBlocks: OcrBlock[];
  /** Bloques en la zona de datos (frente, parte media-baja) */
  dataBlocks: OcrBlock[];
  /** Bloques en la zona de datos del reverso */
  backDataBlocks: OcrBlock[];
  /** Texto combinado de la zona de nombres (para el parser) */
  nameText: string;
  /** Texto combinado de la zona de dirección (del frente) */
  addressText: string;
  /** Dimensiones de la imagen (para normalización) */
  imageWidth: number;
  imageHeight: number;
}

// ── Constantes de layout (proporciones relativas) ───────────────────────────

/**
 * Zonas del frente de la INE (proporciones del ancho/alto total).
 * La foto ocupa ~30% del ancho izquierdo.
 * Los nombres están a la derecha de la foto, en la mitad superior.
 */
const FRONT_ZONES = {
  /** X mínimo para excluir la foto (proporción del ancho) */
  photoRightEdge: 0.25,
  /** Zona de nombres: Y entre 8% y 32% del alto */
  nameYMin: 0.08,
  nameYMax: 0.32,
  /**
   * Zona de domicilio: Y entre 28% y 58% del alto.
   * Está justo debajo de los nombres, arriba de CURP/CLAVE.
   * Se solapa ligeramente con nombres (28–32%) para captar etiqueta
   * "DOMICILIO" que puede estar pegada a la última línea de nombre.
   */
  addressYMin: 0.28,
  addressYMax: 0.58,
  /** Zona de datos (CURP, CLAVE, SECCIÓN): Y entre 55% y 85% */
  dataYMin: 0.55,
  dataYMax: 0.85,
  /** Header institucional: Y < 10% */
  headerYMax: 0.10,
};

/**
 * Zonas del reverso de la INE.
 * El reverso contiene MRZ, códigos de barras, QR y datos duplicados.
 * El domicilio NO está aquí en modelos modernos (está en el frente).
 * Se mantiene por compatibilidad con modelos antiguos (IFE).
 */
const BACK_ZONES = {
  /** Zona de dirección: Y entre 0% y 50% */
  addressYMin: 0.0,
  addressYMax: 0.50,
  /** Zona de datos (clave, CURP, sección): Y entre 40% y 80% */
  dataYMin: 0.40,
  dataYMax: 0.80,
};

// ── Funciones principales ───────────────────────────────────────────────────

/**
 * Estima las dimensiones de la imagen a partir de los bloques OCR.
 * ML Kit devuelve coordenadas absolutas en píxeles de la imagen original.
 * Usamos el bloque más lejano en X+width y Y+height como estimación.
 */
function estimateImageDimensions(blocks: OcrBlock[]): {
  width: number;
  height: number;
} {
  let maxX = 0;
  let maxY = 0;
  for (const b of blocks) {
    if (b.frame) {
      const right = b.frame.x + b.frame.width;
      const bottom = b.frame.y + b.frame.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
  }
  // Si no tenemos frames, usar valores por defecto de foto de INE (~4:3)
  return {
    width: maxX > 0 ? maxX : 4032,
    height: maxY > 0 ? maxY : 3024,
  };
}

/**
 * Clasifica bloques del frente de la INE en zonas espaciales.
 * Usa las proporciones conocidas del layout para determinar si un bloque
 * pertenece a la zona de nombres, domicilio, datos, o header.
 *
 * El domicilio está en el FRENTE de la INE, justo debajo de los nombres
 * y arriba de CURP/CLAVE DE ELECTOR. Ver diagrama en el header del archivo.
 */
export function classifyFrontBlocks(blocks: OcrBlock[]): {
  nameBlocks: OcrBlock[];
  addressBlocks: OcrBlock[];
  dataBlocks: OcrBlock[];
  headerBlocks: OcrBlock[];
} {
  const dims = estimateImageDimensions(blocks);
  const nameBlocks: OcrBlock[] = [];
  const addressBlocks: OcrBlock[] = [];
  const dataBlocks: OcrBlock[] = [];
  const headerBlocks: OcrBlock[] = [];

  for (const block of blocks) {
    if (!block.frame) {
      // Sin coordenadas — clasificar por contenido textual
      // Revisar si contiene ancla de domicilio
      if (/D[O0]M[I1]C[I1]L[I1][O0]|COL\.?\s|C\.?\s*P\.?\s*\d{5}/i.test(block.text)) {
        addressBlocks.push(block);
      } else {
        dataBlocks.push(block);
      }
      continue;
    }

    // Normalizar coordenadas a proporciones 0–1
    const relX = block.frame.x / dims.width;
    const relCenterY =
      (block.frame.y + block.frame.height / 2) / dims.height;

    // Header institucional
    if (relCenterY < FRONT_ZONES.headerYMax) {
      headerBlocks.push(block);
      continue;
    }

    // Necesitamos estar a la derecha de la foto para nombres y domicilio
    const rightOfPhoto = relX >= FRONT_ZONES.photoRightEdge;

    // Zona de nombres: derecha de foto, parte superior
    if (
      rightOfPhoto &&
      relCenterY >= FRONT_ZONES.nameYMin &&
      relCenterY <= FRONT_ZONES.nameYMax
    ) {
      // Si el bloque contiene "DOMICILIO", clasificar como dirección
      if (/D[O0]M[I1]C[I1]L[I1][O0]/i.test(block.text)) {
        addressBlocks.push(block);
      } else {
        nameBlocks.push(block);
      }
      continue;
    }

    // Zona de domicilio: derecha de foto, debajo de nombres
    if (
      rightOfPhoto &&
      relCenterY >= FRONT_ZONES.addressYMin &&
      relCenterY <= FRONT_ZONES.addressYMax
    ) {
      addressBlocks.push(block);
      continue;
    }

    // Zona de datos: parte inferior
    if (
      relCenterY >= FRONT_ZONES.dataYMin &&
      relCenterY <= FRONT_ZONES.dataYMax
    ) {
      dataBlocks.push(block);
      continue;
    }

    // Default: datos
    dataBlocks.push(block);
  }

  // Ordenar bloques por Y (lectura top→bottom)
  nameBlocks.sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0));
  addressBlocks.sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0));
  dataBlocks.sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0));

  return { nameBlocks, addressBlocks, dataBlocks, headerBlocks };
}

/**
 * Clasifica bloques del reverso de la INE en zonas espaciales.
 */
export function classifyBackBlocks(blocks: OcrBlock[]): {
  addressBlocks: OcrBlock[];
  dataBlocks: OcrBlock[];
} {
  const dims = estimateImageDimensions(blocks);
  const addressBlocks: OcrBlock[] = [];
  const dataBlocks: OcrBlock[] = [];

  for (const block of blocks) {
    if (!block.frame) {
      dataBlocks.push(block);
      continue;
    }

    const relCenterY =
      (block.frame.y + block.frame.height / 2) / dims.height;

    if (relCenterY <= BACK_ZONES.addressYMax) {
      addressBlocks.push(block);
    } else {
      dataBlocks.push(block);
    }
  }

  addressBlocks.sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0));
  dataBlocks.sort((a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0));

  return { addressBlocks, dataBlocks };
}

/**
 * Extrae texto de los bloques de nombre usando información espacial.
 *
 * En la zona de nombres, los bloques suelen seguir este patrón:
 *   Bloque 1: "APELLIDO PATERNO"  (etiqueta)
 *   Bloque 2: "GARCIA"            (valor)
 *   Bloque 3: "APELLIDO MATERNO"  (etiqueta)
 *   Bloque 4: "LOPEZ"             (valor)
 *   Bloque 5: "NOMBRE(S)"         (etiqueta)
 *   Bloque 6: "JUAN ANTONIO"      (valor)
 *
 * Pero ML Kit puede fusionar etiqueta+valor en un solo bloque,
 * o desordenar los bloques. Usamos las coordenadas Y para
 * establecer el orden correcto.
 */
export function extractNamesFromSpatial(
  nameBlocks: OcrBlock[],
): {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  method: "spatial";
} | null {
  if (nameBlocks.length === 0) return null;

  const result = {
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
  };

  // Agrupar bloques en pares (etiqueta → valor) por proximidad Y
  // Los bloques ya están ordenados por Y.
  const lines: string[] = [];
  for (const block of nameBlocks) {
    // Cada bloque puede tener múltiples líneas
    for (const line of block.lines) {
      if (line.text.trim().length >= 2) {
        lines.push(line.text.trim().toUpperCase());
      }
    }
  }

  // Buscar etiquetas seguidas de valores
  const PATERNO_RE = /^(?:A(?:PELLID|PELL[I1]D)[O0]\s+)?PATERN[O0]$/i;
  const MATERNO_RE = /^(?:A(?:PELLID|PELL[I1]D)[O0]\s+)?MATERN[O0]$/i;
  const NOMBRE_RE = /^N[O0]MBRE(?:\([S5]\))?$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

    if (PATERNO_RE.test(line) && nextLine && !isLabelLine(nextLine)) {
      result.apellidoPaterno = cleanValue(nextLine);
      i++; // skip value line
    } else if (MATERNO_RE.test(line) && nextLine && !isLabelLine(nextLine)) {
      result.apellidoMaterno = cleanValue(nextLine);
      i++;
    } else if (NOMBRE_RE.test(line) && nextLine && !isLabelLine(nextLine)) {
      result.nombre = cleanValue(nextLine);
      i++;
    }
    // Inline: "APELLIDO PATERNO GARCIA"
    else {
      const inlinePat = line.match(
        /^(?:A(?:PELLID|PELL[I1]D)[O0]\s+)?PATERN[O0]\s+(.+)$/i,
      );
      if (inlinePat && !result.apellidoPaterno) {
        result.apellidoPaterno = cleanValue(inlinePat[1]);
        continue;
      }
      const inlineMat = line.match(
        /^(?:A(?:PELLID|PELL[I1]D)[O0]\s+)?MATERN[O0]\s+(.+)$/i,
      );
      if (inlineMat && !result.apellidoMaterno) {
        result.apellidoMaterno = cleanValue(inlineMat[1]);
        continue;
      }
      const inlineNom = line.match(/^N[O0]MBRE(?:\([S5]\))?\s+(.+)$/i);
      if (inlineNom && !result.nombre) {
        result.nombre = cleanValue(inlineNom[1]);
        continue;
      }
    }
  }

  const found =
    result.apellidoPaterno || result.apellidoMaterno || result.nombre;
  return found ? { ...result, method: "spatial" } : null;
}

/**
 * @deprecated Usar extractAddressFromSpatialExpert de ine-address.ts
 * Extrae dirección de los bloques espaciales (versión simple).
 * Puede recibir bloques del frente o del reverso.
 * Los bloques se concatenan en orden Y para formar la dirección completa.
 */
export function extractAddressFromSpatial(
  addressBlocks: OcrBlock[],
): { value: string; confidence: number } {
  if (addressBlocks.length === 0) return { value: "", confidence: 0 };

  const lines: string[] = [];
  for (const block of addressBlocks) {
    for (const line of block.lines) {
      const text = line.text.trim().toUpperCase();
      if (text.length < 2) continue;
      // Filtrar líneas institucionales
      if (/INSTITUTO\s+(?:NACIONAL|FEDERAL)/i.test(text)) continue;
      if (/CREDENCIAL\s+PARA\s+VOTAR/i.test(text)) continue;
      // Filtrar etiqueta "DOMICILIO" sola
      if (/^D[O0]M[I1]C[I1]L[I1][O0]$/i.test(text)) continue;
      // Filtrar MRZ
      if (text.includes("<")) continue;
      lines.push(text);
    }
  }

  if (lines.length === 0) return { value: "", confidence: 0 };

  // Limpiar etiqueta "DOMICILIO" si aparece al inicio de una línea
  const cleaned = lines.map((l) =>
    l
      .replace(/^D[O0]M[I1]C[I1]L[I1][O0]\s+/i, "")
      .replace(/[|]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  ).filter((l) => l.length >= 2);

  const address = cleaned.join(", ");

  // Calcular confianza basada en patrones de dirección
  const hasNumero = /\d{1,5}/.test(address);
  const hasCP = /C\.?\s*P\.?\s*\d{5}/i.test(address) || /\b\d{5}\b/.test(address);
  const hasColonia = /COL\.?|COLONIA|FRACC\.?/i.test(address);
  const hasMunicipio = /MUNICIPIO|DELEGACI[OÓ]N|ALCALD[IÍ]A/i.test(address);
  const matchCount = [hasNumero, hasCP, hasColonia, hasMunicipio, cleaned.length >= 2]
    .filter(Boolean).length;
  const confidence = Math.min(0.5 + matchCount * 0.12, 0.98);

  return { value: address, confidence };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLabelLine(text: string): boolean {
  return (
    /^(?:A(?:PELLID|PELL[I1]D)[O0]|PATERN[O0]|MATERN[O0]|N[O0]MBRE|SEXO|FECHA|CURP|CLAVE|DOMICILIO|SECCI[OÓ]N|VIGENCIA|Estado|Municipio)/i.test(
      text,
    )
  );
}

function cleanValue(s: string): string {
  return s
    .replace(/[^A-ZÁÉÍÓÚÑÜ\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
