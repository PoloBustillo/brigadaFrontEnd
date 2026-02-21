/**
 * In-memory stale-while-revalidate cache
 *
 * Stores the last successful API response per key.
 * Lives in module scope — persists across screen unmount/remount within a session,
 * but resets when the app process is killed.
 *
 * Usage:
 *   const initial = getCached<T>('my:key');
 *   const [data, setData] = useState<T>(initial ?? []);
 *   const [isLoading, setIsLoading] = useState(!initial);
 *
 *   // after successful fetch:
 *   setData(result);
 *   setCached('my:key', result);
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
}

// Using a plain object for O(1) sync access (no async needed)
// biome-ignore lint/suspicious/noExplicitAny: generic store
const store: Record<string, CacheEntry<any>> = {};

/**
 * Returns the cached value if it exists and is not stale.
 * Returns null on cache miss or TTL expiry.
 * This is intentionally synchronous so it can be used during useState initialization.
 */
export function getCached<T>(key: string): T | null {
  const entry = store[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    delete store[key];
    return null;
  }
  return entry.data;
}

/**
 * Stores a value in the cache with the current timestamp.
 */
export function setCached<T>(key: string, data: T): void {
  store[key] = { data, ts: Date.now() };
}

/**
 * Removes a specific cache key (e.g., after logout).
 */
export function clearCached(key: string): void {
  delete store[key];
}

/**
 * Clears all cached data (e.g., on logout).
 */
export function clearAllCached(): void {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}
