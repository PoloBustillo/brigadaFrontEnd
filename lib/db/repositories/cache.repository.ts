/**
 * KV Cache Repository
 *
 * Simple key-value cache backed by SQLite for offline-first data.
 * Used to cache API responses (assignments, surveys) so the app
 * works without network.
 */

import { db } from "../database";

export class CacheRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  private isDatabaseLocked(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return /database is locked|finalizeAsync/i.test(error.message);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private enqueueWrite(task: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(task)
      .catch(() => {
        // Keep queue alive for subsequent operations.
      });
    return this.writeQueue;
  }

  private async runWithRetry(task: () => Promise<void>): Promise<void> {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await task();
        return;
      } catch (error) {
        const shouldRetry = this.isDatabaseLocked(error) && attempt < maxAttempts;
        if (!shouldRetry) {
          throw error;
        }
        await this.sleep(60 * attempt);
      }
    }
  }

  /**
   * Get a cached value by key. Returns null if not found or expired.
   */
  async get<T = string>(key: string, parse = false): Promise<T | null> {
    try {
      await db.initialize();
      const connection = db.getConnection();
      const result = await connection.getFirstAsync<{
        cache_value: string;
        expires_at: string | null;
      }>(`SELECT cache_value, expires_at FROM kv_cache WHERE cache_key = ?`, [
        key,
      ]);

      if (!result) return null;

      // Check expiration
      if (result.expires_at && new Date(result.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }

      if (parse) {
        return JSON.parse(result.cache_value) as T;
      }
      return result.cache_value as T;
    } catch (error) {
      console.error(`❌ Cache get failed for "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a cached value. Optionally set a TTL in milliseconds.
   */
  async set(
    key: string,
    value: string | object,
    ttlMs?: number,
  ): Promise<void> {
    try {
      await db.initialize();
      await this.enqueueWrite(async () => {
        await this.runWithRetry(async () => {
          const connection = db.getConnection();
          const serialized =
            typeof value === "string" ? value : JSON.stringify(value);
          const expiresAt = ttlMs
            ? new Date(Date.now() + ttlMs).toISOString()
            : null;

          await connection.runAsync(
            `INSERT OR REPLACE INTO kv_cache (cache_key, cache_value, expires_at, updated_at)
             VALUES (?, ?, ?, datetime('now'))`,
            [key, serialized, expiresAt],
          );
        });
      });
    } catch (error) {
      console.error(`❌ Cache set failed for "${key}":`, error);
    }
  }

  /**
   * Delete a cached entry by key.
   */
  async delete(key: string): Promise<void> {
    try {
      await db.initialize();
      await this.enqueueWrite(async () => {
        await this.runWithRetry(async () => {
          const connection = db.getConnection();
          await connection.runAsync(`DELETE FROM kv_cache WHERE cache_key = ?`, [
            key,
          ]);
        });
      });
    } catch (error) {
      console.error(`❌ Cache delete failed for "${key}":`, error);
    }
  }

  /**
   * Clear all expired entries.
   */
  async cleanupExpired(): Promise<number> {
    try {
      await db.initialize();
      const connection = db.getConnection();
      const result = await connection.runAsync(
        `DELETE FROM kv_cache WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`,
      );
      return result.changes;
    } catch {
      return 0;
    }
  }
}

export const cacheRepository = new CacheRepository();
