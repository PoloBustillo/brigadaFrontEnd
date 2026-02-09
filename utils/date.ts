/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha a string legible
 */
export function formatDate(
  timestamp: number,
  format: "short" | "long" = "short",
): string {
  const date = new Date(timestamp);

  if (format === "short") {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatea una hora a string
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp, "short")} ${formatTime(timestamp)}`;
}

/**
 * Calcula diferencia en días entre dos fechas
 */
export function daysDifference(timestamp1: number, timestamp2: number): number {
  const diff = Math.abs(timestamp1 - timestamp2);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formatea duración en milisegundos a string legible
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Obtiene timestamp de inicio del día
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Obtiene timestamp de fin del día
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(timestamp: number): boolean {
  const today = getStartOfDay(Date.now());
  const date = getStartOfDay(timestamp);
  return today === date;
}

/**
 * Formatea fecha relativa (ej: "hace 2 horas", "ayer")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(timestamp, "short");
  }

  if (days > 1) {
    return `hace ${days} días`;
  }

  if (days === 1) {
    return "ayer";
  }

  if (hours > 1) {
    return `hace ${hours} horas`;
  }

  if (hours === 1) {
    return "hace 1 hora";
  }

  if (minutes > 1) {
    return `hace ${minutes} minutos`;
  }

  if (minutes === 1) {
    return "hace 1 minuto";
  }

  return "hace un momento";
}
