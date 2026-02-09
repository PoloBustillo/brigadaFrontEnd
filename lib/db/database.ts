/**
 * Database Connection Manager
 *
 * Singleton para gestionar la conexión a SQLite con Expo SQLite
 */

import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private drizzleDb: ReturnType<typeof drizzle> | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Inicializar la base de datos
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return; // Ya inicializada
    }

    try {
      // Abrir base de datos
      this.db = await SQLite.openDatabaseAsync("brigada.db");

      // Inicializar Drizzle ORM
      this.drizzleDb = drizzle(this.db);

      // Ejecutar schema
      await this.executeSchema();

      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  /**
   * Ejecutar el schema SQL
   */
  private async executeSchema(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // TODO: Cargar schema.sql desde assets
    // Por ahora, ejecutar tablas manualmente
    // En producción, cargar desde: require('../db/schema.sql')

    console.log("⚠️ Schema execution: Load from schema.sql file");
  }

  /**
   * Obtener la conexión SQLite nativa
   */
  getConnection(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Obtener la instancia de Drizzle ORM
   */
  getDrizzle(): ReturnType<typeof drizzle> {
    if (!this.drizzleDb) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.drizzleDb;
  }

  /**
   * Ejecutar una transacción
   */
  async transaction<T>(
    callback: (tx: SQLite.SQLiteDatabase) => Promise<T>,
  ): Promise<T> {
    const db = this.getConnection();

    try {
      await db.execAsync("BEGIN TRANSACTION");
      const result = await callback(db);
      await db.execAsync("COMMIT");
      return result;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  }

  /**
   * Cerrar la base de datos
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.drizzleDb = null;
    }
  }
}

export const db = DatabaseManager.getInstance();
export { DatabaseManager };
