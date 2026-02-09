/**
 * Estado de sincronización de un ítem
 */
export enum SyncStatus {
  PENDING = "pending",
  SYNCING = "syncing",
  SYNCED = "synced",
  ERROR = "error",
  CONFLICT = "conflict",
}

/**
 * Tipo de operación de sincronización
 */
export enum SyncOperation {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

/**
 * Ítem en la cola de sincronización
 */
export interface SyncQueueItem {
  id: string;
  entityType: "survey_response" | "survey_schema" | "user";
  entityId: string;
  operation: SyncOperation;
  data: any;
  status: SyncStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Estado global de sincronización
 */
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: number;
  pendingCount: number;
  errorCount: number;
  autoSyncEnabled: boolean;
}

/**
 * Resultado de una operación de sincronización
 */
export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  errors: {
    itemId: string;
    error: string;
  }[];
  timestamp: number;
}

/**
 * Conflicto de sincronización
 */
export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localData: any;
  remoteData: any;
  detectedAt: number;
}

/**
 * Estrategia de resolución de conflictos
 */
export enum ConflictResolutionStrategy {
  LOCAL_WINS = "local_wins",
  REMOTE_WINS = "remote_wins",
  MANUAL = "manual",
  MERGE = "merge",
}
