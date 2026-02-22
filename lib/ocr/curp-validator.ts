/**
 * 🔍 CURP Validator
 * =================
 * Valida un CURP en dos capas:
 *   1. Regex estricto local (sin red, instantáneo)
 *   2. Proxy backend → RENAPO para verificar existencia en el padrón
 *      y recuperar datos para cruzar con lo que capturó el OCR.
 *
 * El endpoint del backend en brigadaBackEnd/app/api/ocr.py actúa como
 * proxy para evitar CORS y centralizar rate-limiting.
 *
 * ── ¿Por qué no llamar a RENAPO directamente desde el móvil? ──────────────
 *   - RENAPO requiere autenticación en el tier productivo (token gubernamental).
 *   - Mobile → gobierno directamente tiene problemas de CORS.
 *   - Si RENAPO cambia su API, solo actualizamos ocr.py sin tocar el app.
 */

import { APP_CONFIG } from "@/constants/config";

const API_BASE = APP_CONFIG.api.baseUrl;

// ── Tipos ─────────────────────────────────────────────────────────────────────

/** Estado del CURP según RENAPO */
export type RenapoStatus =
  | "VIGE" // Vigente — el más común
  | "RCN" // Registrado, Certificado No confirmado (acta nueva)
  | "BAJA" // Baja del padrón
  | "NO_ENCONTRADO" // No existe en la base del padrón
  | null; // No se pudo consultar RENAPO

export interface CurpValidationResult {
  curp: string;
  /** Pasa el regex estricto local: 4L+6D+1LHM+5L+2AN */
  validFormat: boolean;
  /** Estado en el padrón RENAPO */
  renapoStatus: RenapoStatus;
  /** Nombres que devolvió RENAPO (para cruzar con OCR) */
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
  sexo: string | null;
  /** Fecha en formato "DD-MM-YYYY" según RENAPO */
  fechaNac: string | null;
  entidadNac: string | null;
  /** true si se logró llegar a RENAPO (aunque devuelva NOT_FOUND) */
  renapoReachable: boolean;
  /** Mensaje legible para mostrar en UI */
  displayMessage: string;
}

// ── Regex local ───────────────────────────────────────────────────────────────

const CURP_STRICT_RE = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Valida un CURP: primero con regex local, luego contra RENAPO vía backend.
 *
 * @param curp       CURP de 18 chars (se normaliza a mayúsculas internamente)
 * @param authToken  JWT del usuario autenticado (requerido para el backend)
 */
export async function validateCurp(
  curp: string,
  authToken: string,
): Promise<CurpValidationResult> {
  const normalized = curp.toUpperCase().trim();
  const validFormat = CURP_STRICT_RE.test(normalized);

  // Resultado vacío por defecto
  const empty: CurpValidationResult = {
    curp: normalized,
    validFormat,
    renapoStatus: null,
    nombre: null,
    apellido1: null,
    apellido2: null,
    sexo: null,
    fechaNac: null,
    entidadNac: null,
    renapoReachable: false,
    displayMessage: validFormat
      ? "Formato válido, no se pudo verificar con RENAPO."
      : "El CURP no tiene el formato correcto (18 caracteres, letras y dígitos en posiciones fijas).",
  };

  if (!validFormat) return empty;

  try {
    const resp = await fetch(`${API_BASE}/ocr/validate-curp/${normalized}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) return empty;

    const data = await resp.json();

    const status: RenapoStatus = mapRenapoStatus(data.renapo_status);
    return {
      curp: data.curp ?? normalized,
      validFormat: data.valid_format ?? validFormat,
      renapoStatus: status,
      nombre: data.nombre ?? null,
      apellido1: data.apellido1 ?? null,
      apellido2: data.apellido2 ?? null,
      sexo: data.sexo ?? null,
      fechaNac: data.fecha_nac ?? null,
      entidadNac: data.entidad_nac ?? null,
      renapoReachable: data.renapo_reachable ?? false,
      displayMessage: buildDisplayMessage(status, data.renapo_reachable),
    };
  } catch {
    return empty;
  }
}

/**
 * Validación offline — solo regex local, sin red.
 * Útil para validar mientras el usuario está escribiendo.
 */
export function validateCurpFormat(curp: string): boolean {
  return CURP_STRICT_RE.test(curp.toUpperCase().trim());
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapRenapoStatus(raw: string | null | undefined): RenapoStatus {
  if (!raw) return null;
  const s = String(raw).toUpperCase();
  if (s === "VIGE") return "VIGE";
  if (s === "RCN") return "RCN";
  if (s === "BAJA") return "BAJA";
  if (s.includes("NO_ENCONTRADO") || s === "FALSE") return "NO_ENCONTRADO";
  return null;
}

function buildDisplayMessage(status: RenapoStatus, reachable: boolean): string {
  if (!reachable) return "Formato válido. No se pudo contactar a RENAPO.";
  switch (status) {
    case "VIGE":
      return "✓ CURP vigente en el padrón RENAPO.";
    case "RCN":
      return "CURP registrado, acta pendiente de certificación (RCN).";
    case "BAJA":
      return "⚠ CURP dado de baja en el padrón.";
    case "NO_ENCONTRADO":
      return "⚠ CURP no encontrado en el padrón RENAPO.";
    default:
      return "CURP válido en formato. Sin respuesta de RENAPO.";
  }
}
