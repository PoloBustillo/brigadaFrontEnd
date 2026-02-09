/**
 * 🗄️ CLIENTE DE BASE DE DATOS SQLite
 *
 * Configuración centralizada de Drizzle + Expo SQLite
 * Singleton pattern para evitar múltiples conexiones
 */

import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

// Nombre de la base de datos
const DB_NAME = "brigada.db";

// Instancia de SQLite
let sqliteInstance: ReturnType<typeof openDatabaseSync> | null = null;

// Instancia de Drizzle
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Inicializa la base de datos
 * Se debe llamar al iniciar la app
 */
export function initDatabase() {
  if (sqliteInstance && db) {
    console.log("✅ Database already initialized");
    return db;
  }

  try {
    console.log("🔧 Initializing SQLite database...");

    // Abrir conexión a SQLite
    sqliteInstance = openDatabaseSync(DB_NAME);

    // Crear instancia de Drizzle
    db = drizzle(sqliteInstance, { schema });

    console.log("✅ Database initialized successfully");

    return db;
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Obtiene la instancia de la base de datos
 * Lanza error si no está inicializada
 */
export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Cierra la conexión a la base de datos
 * Útil para testing o cleanup
 */
export function closeDatabase() {
  if (sqliteInstance) {
    sqliteInstance.closeSync();
    sqliteInstance = null;
    db = null;
    console.log("✅ Database connection closed");
  }
}

/**
 * Resetea la base de datos (⚠️ SOLO PARA DESARROLLO)
 * Elimina y recrea todas las tablas
 */
export async function resetDatabase() {
  if (!db) {
    throw new Error("Database not initialized");
  }

  console.warn("⚠️ RESETTING DATABASE - ALL DATA WILL BE LOST");

  // Aquí se ejecutarían las migraciones o recreación de tablas
  // Por ahora solo un placeholder
  console.log("🔄 Database reset (implementation pending)");
}

// Exportar el schema para uso externo
export { schema };

// Exportar tipos
export type Database = NonNullable<typeof db>;
