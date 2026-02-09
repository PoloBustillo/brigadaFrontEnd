import { create } from "zustand";
import { SyncState } from "../features/sync/types/sync.types";

interface SyncStoreState extends SyncState {
  // Acciones
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  updateLastSync: () => void;
  setPendingCount: (count: number) => void;
  setErrorCount: (count: number) => void;
  toggleAutoSync: () => void;
  resetSyncState: () => void;
}

/**
 * Store de Zustand para manejar el estado de sincronización
 */
export const useSyncStore = create<SyncStoreState>((set) => ({
  // Estado inicial
  isOnline: true,
  isSyncing: false,
  lastSyncAt: undefined,
  pendingCount: 0,
  errorCount: 0,
  autoSyncEnabled: true,

  // Acciones
  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
  },

  setSyncing: (isSyncing: boolean) => {
    set({ isSyncing });
  },

  updateLastSync: () => {
    set({ lastSyncAt: Date.now() });
  },

  setPendingCount: (count: number) => {
    set({ pendingCount: count });
  },

  setErrorCount: (count: number) => {
    set({ errorCount: count });
  },

  toggleAutoSync: () => {
    set((state) => ({ autoSyncEnabled: !state.autoSyncEnabled }));
  },

  resetSyncState: () => {
    set({
      isSyncing: false,
      pendingCount: 0,
      errorCount: 0,
    });
  },
}));
