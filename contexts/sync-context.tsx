/**
 * 🔄 Sync Context - Brigada Digital
 * Contexto para manejar el estado de sincronización
 * 
 * REGLA 6: Sincronización automática
 * - Sync automático cuando vuelve conexión
 * - Reintentos exponenciales si falla
 * - Manejo de errores parciales por documento
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

// REGLA 6: Estados extendidos para manejo de errores
interface SyncItem {
  id: string;
  type: "survey" | "response" | "user";
  timestamp: number;
  retryCount: number; // Número de reintentos realizados
  lastAttempt?: number; // Timestamp del último intento
  error?: string; // Mensaje de error si falló
  status: "pending" | "syncing" | "error" | "partial_error"; // Estado actual
}

interface SyncContextType {
  pendingItems: SyncItem[];
  pendingCount: number;
  pendingByType: {
    surveys: number;
    responses: number;
    users: number;
  };
  errorCount: number; // Items con error
  isOnline: boolean; // Estado de conectividad
  addPendingItem: (item: Omit<SyncItem, "timestamp" | "retryCount" | "status">) => void;
  removePendingItem: (id: string) => void;
  markItemError: (id: string, error: string, isPartial?: boolean) => void;
  clearPending: () => void;
  syncAll: () => Promise<void>;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

// REGLA 6: Configuración de reintentos exponenciales
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000, // 1 segundo
  maxDelay: 60000, // 1 minuto
  backoffMultiplier: 2,
};

// REGLA 6: Calcular delay para reintento con backoff exponencial
const calculateRetryDelay = (retryCount: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [pendingItems, setPendingItems] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingCount = pendingItems.length;

  const pendingByType = {
    surveys: pendingItems.filter((item) => item.type === "survey").length,
    responses: pendingItems.filter((item) => item.type === "response").length,
    users: pendingItems.filter((item) => item.type === "user").length,
  };

  const errorCount = pendingItems.filter(
    (item) => item.status === "error" || item.status === "partial_error"
  ).length;

  // REGLA 6: Sincronizar todos los items pendientes
  const syncAll = useCallback(async () => {
    if (!isOnline) {
      console.log("📵 Offline - Skipping sync");
      return;
    }

    if (isSyncing) {
      console.log("🔄 Sync already in progress");
      return;
    }

    const itemsToSync = pendingItems.filter(
      (item) => item.status === "pending" || item.status === "partial_error"
    );

    if (itemsToSync.length === 0) {
      console.log("✨ No items to sync");
      return;
    }

    setIsSyncing(true);
    console.log(`🚀 Starting sync of ${itemsToSync.length} items...`);

    try {
      // Marcar items como "syncing"
      setPendingItems((prev) =>
        prev.map((item) =>
          itemsToSync.find((i) => i.id === item.id)
            ? { ...item, status: "syncing" as const }
            : item
        )
      );

      // REGLA 6: Sincronizar items en paralelo (con límite de concurrencia)
      const CONCURRENT_LIMIT = 3;
      const results: boolean[] = [];
      
      for (let i = 0; i < itemsToSync.length; i += CONCURRENT_LIMIT) {
        const batch = itemsToSync.slice(i, i + CONCURRENT_LIMIT);
        const batchResults = await Promise.all(
          batch.map((item) => syncSingleItem(item))
        );
        results.push(...batchResults);
      }

      // Remover items sincronizados exitosamente
      const successfulIds = itemsToSync
        .filter((_, index) => results[index])
        .map((item) => item.id);

      setPendingItems((prev) =>
        prev.filter((item) => !successfulIds.includes(item.id))
      );

      const successCount = results.filter((r) => r).length;
      const failCount = results.filter((r) => !r).length;

      console.log(
        `✅ Sync complete: ${successCount} successful, ${failCount} failed`
      );
    } catch (error) {
      console.error("❌ Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, isSyncing, pendingItems]);

  // REGLA 6: Sincronizar individual con reintentos exponenciales
  const syncSingleItem = useCallback(async (item: SyncItem): Promise<boolean> => {
    try {
      console.log(`🔄 Syncing ${item.type} (${item.id}), attempt ${item.retryCount + 1}`);
      
      // TODO: Implementar sincronización real con API
      // Simular llamada API
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular fallo ocasional
          const shouldFail = Math.random() < 0.2; // 20% de fallo
          if (shouldFail) {
            reject(new Error("Network timeout"));
          } else {
            resolve(true);
          }
        }, 1000 + Math.random() * 1000);
      });

      console.log(`✅ Successfully synced ${item.type} (${item.id})`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to sync ${item.type} (${item.id}):`, error.message);
      
      // REGLA 6: Determinar si es error parcial (algunos documentos fallaron)
      const isPartialError = error.message?.includes("partial") || error.code === "PARTIAL_SYNC_ERROR";
      
      // Incrementar contador de reintentos
      const newRetryCount = item.retryCount + 1;
      
      if (newRetryCount >= RETRY_CONFIG.maxRetries) {
        // REGLA 6: Máximo de reintentos alcanzado
        setPendingItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  error: `Max retries reached: ${error.message}`,
                  status: isPartialError ? "partial_error" as const : "error" as const,
                  lastAttempt: Date.now(),
                }
              : i
          )
        );
        return false;
      }

      // REGLA 6: Calcular delay exponencial y programar reintento
      const retryDelay = calculateRetryDelay(newRetryCount);
      console.log(`⏱️  Retry ${newRetryCount}/${RETRY_CONFIG.maxRetries} for ${item.id} in ${retryDelay}ms`);
      
      // Actualizar item con nuevo conteo de reintentos
      setPendingItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                retryCount: newRetryCount,
                lastAttempt: Date.now(),
                error: error.message,
                status: isPartialError ? "partial_error" as const : "pending" as const,
              }
            : i
        )
      );

      // Programar reintento
      return new Promise((resolve) => {
        setTimeout(async () => {
          const updatedItems = pendingItems.filter((i) => i.id === item.id);
          if (updatedItems.length > 0) {
            const success = await syncSingleItem(updatedItems[0]);
            resolve(success);
          } else {
            resolve(false);
          }
        }, retryDelay);
      });
    }
  }, [pendingItems]);

  // REGLA 6: Detectar cambios en conectividad
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      const wasOffline = !isOnline;
      setIsOnline(online);

      // REGLA 6: Sincronizar automáticamente cuando vuelve la conexión
      if (online && wasOffline && pendingItems.length > 0) {
        console.log("🌐 Network restored - Auto-syncing pending items...");
        // Delay corto para asegurar que la conexión es estable
        syncTimeoutRef.current = setTimeout(() => {
          syncAll();
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      const currentSyncTimeout = syncTimeoutRef.current;
      if (currentSyncTimeout) clearTimeout(currentSyncTimeout);
    };
  }, [isOnline, pendingItems.length, syncAll]);

  const addPendingItem = useCallback((item: Omit<SyncItem, "timestamp" | "retryCount" | "status">) => {
    const newItem: SyncItem = {
      ...item,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    };
    setPendingItems((prev) => [...prev, newItem]);
    
    // REGLA 6: Intentar sincronizar inmediatamente si hay conexión
    if (isOnline) {
      syncTimeoutRef.current = setTimeout(() => {
        syncAll();
      }, 500);
    }
  }, [isOnline, syncAll]);

  const removePendingItem = useCallback((id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // REGLA 6: Marcar item con error (parcial o total)
  const markItemError = useCallback((id: string, error: string, isPartial = false) => {
    setPendingItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              error,
              status: isPartial ? "partial_error" : "error",
              lastAttempt: Date.now(),
            }
          : item
      )
    );
  }, []);

  const clearPending = useCallback(() => {
    setPendingItems([]);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        pendingItems,
        pendingCount,
        pendingByType,
        errorCount,
        isOnline,
        addPendingItem,
        removePendingItem,
        markItemError,
        clearPending,
        syncAll,
        isSyncing,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
