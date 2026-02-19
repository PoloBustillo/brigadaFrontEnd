/**
 * Configuración general de la aplicación
 */
import Constants from "expo-constants";

/**
 * En desarrollo, Expo expone la IP del host en Constants.expoConfig.hostUri
 * (e.g. "192.168.1.10:8081"). Usamos esa IP para llegar al backend desde el
 * dispositivo físico o emulador sin depender de "localhost".
 */
const getDevApiUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0]; // strip port
    return `http://${host}:8000`;
  }
  return "http://localhost:8000"; // fallback para simulador iOS
};

export const APP_CONFIG = {
  // Información de la app
  name: "Brigada Surveys",
  version: "1.0.0",

  // Base de datos
  database: {
    name: "brigada.db",
    version: 2,
  },

  // Sincronización
  sync: {
    autoSyncEnabled: true,
    syncIntervalMs: 5 * 60 * 1000, // 5 minutos
    maxRetries: 3,
    retryDelayMs: 5000,
    requireWiFi: false, // Sincronizar también con datos móviles
  },

  // API
  api: {
    baseUrl: __DEV__
      ? getDevApiUrl()
      : "https://api.brigada.com",
    timeout: 30000, // 30 seconds
  },

  // Validación
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxPhotos: 5,
    photoQuality: 0.8,
    locationAccuracy: 50, // metros
  },

  // UI
  ui: {
    questionsPerPage: 5,
    debounceMs: 300,
    toastDuration: 3000,
  },
};

/**
 * Configuración de logs (solo en desarrollo)
 */
export const LOG_CONFIG = {
  enabled: __DEV__,
  logLevel: __DEV__ ? "debug" : "error",
};
