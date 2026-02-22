/**
 * Configuración general de la aplicación
 */
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
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://api.psic-danieladiaz.com",
    timeout: 30000,
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
