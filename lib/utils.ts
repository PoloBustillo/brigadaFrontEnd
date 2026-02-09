/**
 * 🔑 UTILIDADES GENERALES
 *
 * Funciones auxiliares para generación de IDs, validaciones, etc.
 */

import * as Crypto from "expo-crypto";

/**
 * Genera un UUID v4
 */
export function generateId(): string {
  return Crypto.randomUUID();
}

/**
 * Convierte Date a timestamp Unix (segundos)
 */
export function dateToTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convierte timestamp Unix a Date
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Calcula el progreso de una encuesta (0.0 a 1.0)
 */
export function calculateProgress(
  totalQuestions: number,
  answeredQuestions: number,
): number {
  if (totalQuestions === 0) return 0;
  return Math.min(answeredQuestions / totalQuestions, 1.0);
}

/**
 * Valida si un email es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CURP mexicano
 */
export function isValidCURP(curp: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return curpRegex.test(curp);
}

/**
 * Valida Clave de Elector
 */
export function isValidClaveElector(clave: string): boolean {
  const claveRegex = /^[A-Z]{6}\d{8}[HM]\d{3}$/;
  return claveRegex.test(clave);
}

/**
 * Formatea bytes a formato legible
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calcula SHA256 de un string
 */
export async function calculateSHA256(text: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text,
  );
  return digest;
}

/**
 * Delay asíncrono (para testing/retry)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delayMs}ms`);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
