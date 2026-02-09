// TODO: Instalar @react-native-community/netinfo
// import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
type NetInfoState = any;

/**
 * Utilidad para detectar y monitorear el estado de la red
 */
export class NetworkDetector {
  private static listeners: ((isConnected: boolean) => void)[] = [];

  /**
   * Verifica si hay conexión a internet
   */
  static async isConnected(): Promise<boolean> {
    // TODO: Implementar con NetInfo cuando se instale la librería
    return true;
    // const state = await NetInfo.fetch();
    // return state.isConnected ?? false;
  }

  /**
   * Verifica si hay conexión de buena calidad (WiFi o datos móviles fuertes)
   */
  static async hasGoodConnection(): Promise<boolean> {
    // TODO: Implementar con NetInfo cuando se instale la librería
    return true;
    // const state = await NetInfo.fetch();
    //
    // if (!state.isConnected) {
    //   return false;
    // }
    //
    // // WiFi generalmente es buena conexión
    // if (state.type === "wifi") {
    //   return true;
    // }
    //
    // // Verificar calidad de datos móviles
    // if (state.type === "cellular") {
    //   const details = state.details as any;
    //   // 4G/LTE o superior
    //   return details?.cellularGeneration === "4g" || details?.cellularGeneration === "5g";
    // }
    //
    // return state.isConnected ?? false;
  }

  /**
   * Suscribirse a cambios en el estado de la red
   */
  static subscribe(callback: (isConnected: boolean) => void): () => void {
    this.listeners.push(callback);

    // TODO: Configurar listener de NetInfo cuando se instale la librería
    // const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    //   const isConnected = state.isConnected ?? false;
    //   this.notifyListeners(isConnected);
    // });

    // Retornar función de cleanup
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
      // unsubscribe();
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private static notifyListeners(isConnected: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error("Error en listener de red:", error);
      }
    });
  }

  /**
   * Esperar a que haya conexión (con timeout)
   */
  static async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    const isCurrentlyConnected = await this.isConnected();
    if (isCurrentlyConnected) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((isConnected) => {
        if (isConnected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}
