// src/servicios/red.ts
import * as Network from 'expo-network';

/**
 * Verifica si el dispositivo cuenta con conexión activa a internet.
 */
export async function hayConexionInternet(): Promise<boolean> {
  try {
    const estadoRed = await Network.getNetworkStateAsync();
    return !!(estadoRed.isConnected && estadoRed.isInternetReachable !== false);
  } catch (error) {
    console.error("Error al verificar la red:", error);
    return false; // Ante la duda, asumimos offline para forzar el uso del caché local
  }
}