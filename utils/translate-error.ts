/**
 * Translate common backend/API error messages from English to Spanish.
 * Falls through to the original message if no translation matches.
 */

import * as Sentry from "@sentry/react-native";

const ERROR_MAP: [RegExp, string][] = [
  // Auth
  [/incorrect.*username.*password/i, "Usuario o contraseña incorrectos"],
  [/invalid.*credentials/i, "Credenciales inválidas"],
  [/not.*authorized/i, "No tienes autorización para esta acción"],
  [/token.*expired/i, "Tu sesión expiró. Inicia sesión de nuevo"],
  [/could.*not.*validate/i, "Error de autenticación. Inicia sesión de nuevo"],
  // Network
  [/network.*error/i, "Error de conexión. Revisa tu internet"],
  [/timeout/i, "El servidor tardó demasiado. Intenta de nuevo"],
  [/econnrefused/i, "No se pudo conectar al servidor"],
  [/fetch.*failed/i, "Error de conexión. Revisa tu internet"],
  // Server
  [/internal.*server/i, "Error en el servidor. Intenta más tarde"],
  [/500/i, "Error en el servidor. Intenta más tarde"],
  [/502|503|504/i, "Servidor no disponible. Intenta más tarde"],
  // Survey-specific
  [/survey.*not.*found/i, "La encuesta no fue encontrada"],
  [/version.*not.*found/i, "La versión de la encuesta no fue encontrada"],
  [/already.*submitted/i, "Ya enviaste una respuesta para esta encuesta"],
  [/not.*published/i, "Esta encuesta aún no está publicada"],
  [/assignment.*not.*found/i, "No tienes esta encuesta asignada"],
  // Validation
  [/field.*required/i, "Faltan campos obligatorios"],
  [/invalid.*email/i, "El correo electrónico no es válido"],
  [/invalid.*phone/i, "El número de teléfono no es válido"],
  // Generic
  [/not.*found/i, "Recurso no encontrado"],
  [/bad.*request/i, "Solicitud inválida"],
  [/forbidden/i, "No tienes permiso para esta acción"],
];

export function translateError(message: string | undefined | null): string {
  if (!message) return "Ocurrió un error inesperado";

  // Already in Spanish? Return as-is (simple heuristic: contains common Spanish words)
  if (
    /error de|no se pudo|intenta|inválid|obligatori|conexión|servidor/i.test(
      message,
    )
  ) {
    return message;
  }

  for (const [pattern, translation] of ERROR_MAP) {
    if (pattern.test(message)) {
      return translation;
    }
  }

  // Fallback: return original if short enough, generic message if too technical
  if (message.length > 120) {
    return "Ocurrió un error inesperado. Intenta de nuevo";
  }

  return message;
}

/**
 * Extract readable error message from an API error object.
 * Handles axios-like errors, standard Error objects, and strings.
 * Unexpected / unrecognised errors are forwarded to Sentry automatically.
 */
export function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return translateError(err);
  if (err && typeof err === "object") {
    // Axios-style: err.response.data.detail
    const axiosDetail = (err as any)?.response?.data?.detail;
    if (typeof axiosDetail === "string") return translateError(axiosDetail);
    // Array of validation errors (FastAPI)
    if (Array.isArray(axiosDetail)) {
      const msgs = axiosDetail
        .map((e: any) => e?.msg)
        .filter(Boolean)
        .join(". ");
      return translateError(msgs || "Error de validación");
    }
    // Standard Error — capture unexpected ones in Sentry
    if (err instanceof Error) {
      const translated = translateError(err.message);
      // Only capture truly unexpected errors (not auth / network / validation)
      const isExpected =
        /sesión|conexión|servidor|credenciales|autoriza|permiso|encuesta|asignada|publicada|encontrado|validaci/i.test(
          translated,
        );
      if (!isExpected) {
        Sentry.captureException(err);
      }
      return translated;
    }
    // Any .message property
    const msg = (err as any)?.message;
    if (typeof msg === "string") return translateError(msg);
  }
  // Completely unknown — capture in Sentry
  Sentry.captureException(err);
  return "Ocurrió un error inesperado";
}
