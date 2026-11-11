import React, { createContext, useState, ReactNode } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";

interface Coordenadas {
  latitud: number;
  longitud: number;
}

interface LocationContextType {
  ubicacionActual: Coordenadas;
  cambiarCoordenadasManual: (lat: number, lon: number) => void;
  activarGpsReal: () => Promise<void>;
  inputLat: string;
  inputLon: string;
  setInputLat: (val: string) => void;
  setInputLon: (val: string) => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

const COLON_DEFAULT = {
  latitud: -32.21568,
  longitud: -58.13649,
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [ubicacionActual, setUbicacionActual] = useState<Coordenadas>(COLON_DEFAULT);
  const [inputLat, setInputLat] = useState<string>(COLON_DEFAULT.latitud.toString());
  const [inputLon, setInputLon] = useState<string>(COLON_DEFAULT.longitud.toString());

  const cambiarCoordenadasManual = (lat: number, lon: number) => {
    setUbicacionActual({ latitud: lat, longitud: lon });
    setInputLat(lat.toString());
    setInputLon(lon.toString());
  };

  const activarGpsReal = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se pudo acceder a los permisos de ubicación.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      setUbicacionActual({ latitud: lat, longitud: lon });
      setInputLat(lat.toString());
      setInputLon(lon.toString());
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la posición actual del GPS.");
    }
  };

  return (
    <LocationContext.Provider
      value={{
        ubicacionActual,
        cambiarCoordenadasManual,
        activarGpsReal,
        inputLat,
        inputLon,
        setInputLat,
        setInputLon,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}