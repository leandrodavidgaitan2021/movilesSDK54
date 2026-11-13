import * as Network from 'expo-network';

export async function hayConexionInternet(): Promise<boolean> {
  try {
    const estadoRed = await Network.getNetworkStateAsync();
    return !!(estadoRed.isConnected && estadoRed.isInternetReachable !== false);
  } catch (error) {
    console.error("Error al verificar la red:", error);
    return false;
  }
}