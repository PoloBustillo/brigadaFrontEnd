/**
 * 🔄 Sync Context - Brigada Digital
 * Contexto para manejar el estado de sincronización
 */

import React, { createContext, useContext, useState } from "react";

interface SyncItem {
  id: string;
  type: "survey" | "response" | "user";
  timestamp: number;
}

interface SyncContextType {
  pendingItems: SyncItem[];
  pendingCount: number;
  pendingByType: {
    surveys: number;
    responses: number;
    users: number;
  };
  addPendingItem: (item: Omit<SyncItem, "timestamp">) => void;
  removePendingItem: (id: string) => void;
  clearPending: () => void;
  syncAll: () => Promise<void>;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [pendingItems, setPendingItems] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = pendingItems.length;

  const pendingByType = {
    surveys: pendingItems.filter((item) => item.type === "survey").length,
    responses: pendingItems.filter((item) => item.type === "response").length,
    users: pendingItems.filter((item) => item.type === "user").length,
  };

  const addPendingItem = (item: Omit<SyncItem, "timestamp">) => {
    const newItem: SyncItem = {
      ...item,
      timestamp: Date.now(),
    };
    setPendingItems((prev) => [...prev, newItem]);
  };

  const removePendingItem = (id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearPending = () => {
    setPendingItems([]);
  };

  const syncAll = async () => {
    if (isSyncing || pendingItems.length === 0) return;

    setIsSyncing(true);
    try {
      // TODO: Implementar sincronización real con API
      console.log("Syncing items:", pendingItems);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearPending();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        pendingItems,
        pendingCount,
        pendingByType,
        addPendingItem,
        removePendingItem,
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
