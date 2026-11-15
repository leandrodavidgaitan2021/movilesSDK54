import React, { createContext, useState, useEffect, ReactNode } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";

interface Coordenadas {
  latitud: number;
  longitud: number;
}

interface LocationContextType {
  ubicacionActual: Coordenadas | null;
  cambiarCoordenadasManual: (lat: number, lon: number) => void;
  activarGpsReal: () => Promise<void>;
  inputLat: string;
  inputLon: string;
  setInputLat: (val: string) => void;
  setInputLon: (val: string) => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [ubicacionActual, setUbicacionActual] = useState<Coordenadas | null>(null);
  const [inputLat, setInputLat] = useState<string>("");
  const [inputLon, setInputLon] = useState<string>("");

  // 1. Al arrancar, obtiene automáticamente la posición GPS real (Oro Verde)
  useEffect(() => {
    const obtenerUbicacionInicial = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "No se pudo acceder a los permisos de ubicación.");
          // Coordenada de respaldo en Oro Verde si deniega permisos
          setUbicacionActual({ latitud: -31.8389, longitud: -60.5256 });
          setInputLat("-31.8389");
          setInputLon("-60.5256");
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
        console.error("Error al obtener ubicación inicial:", error);
        // Respaldo por seguridad en Oro Verde
        setUbicacionActual({ latitud: -31.8389, longitud: -60.5256 });
        setInputLat("-31.8389");
        setInputLon("-60.5256");
      }
    };

    obtenerUbicacionInicial();
  }, []);

  // 2. Al tocar los chips del simulador o escribir manual, actualiza las coordenadas
  // Esto moverá automáticamente el marcador "Estás aquí" y el mapa.
  const cambiarCoordenadasManual = (lat: number, lon: number) => {
    setUbicacionActual({ latitud: lat, longitud: lon });
    setInputLat(lat.toString());
    setInputLon(lon.toString());
  };

  // 3. Botón para volver a la posición real del GPS
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
        ubicacionActual: ubicacionActual!,
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