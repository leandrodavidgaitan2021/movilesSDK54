import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { Lugar } from "../tipos";
import { useLocation } from "../hooks/useLocation";

interface Props {
  lugares: Lugar[]; 
}

export default function MapaLugares({ lugares }: Props) {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  // Extraemos la ubicación actual del contexto
  const { ubicacionActual } = useLocation();

  // Función auxiliar segura
  const obtenerDatosUbicacionActual = () => {
    if (!ubicacionActual) {
      return {
        id: "tu-ubicacion",
        nombre: "Estás aquí",
        subtitulo: null,
        descripcionCorta: "Posición actual",
        esUbicacionActual: true,
      };
    }

    const lugarEncontrado = lugares.find(
      (lugar) =>
        Math.abs(lugar.coordenadas.latitud - ubicacionActual.latitud) < 0.0001 &&
        Math.abs(lugar.coordenadas.longitud - ubicacionActual.longitud) < 0.0001
    );

    if (lugarEncontrado) {
      return {
        id: lugarEncontrado.id,
        nombre: "Estás aquí",
        subtitulo: lugarEncontrado.nombre,
        descripcionCorta: lugarEncontrado.descripcionCorta,
        esUbicacionActual: true,
      };
    }

    return {
      id: "tu-ubicacion",
      nombre: "Estás aquí",
      subtitulo: null,
      descripcionCorta: "Posición actual",
      esUbicacionActual: true,
    };
  };

  const [lugarSeleccionado, setLugarSeleccionado] = useState<{
    id: string;
    nombre: string;
    subtitulo: string | null;
    descripcionCorta: string;
    esUbicacionActual: boolean;
  } | null>(obtenerDatosUbicacionActual);

  // Cada vez que 'ubicacionActual' cambie (por ejemplo, al tocar un chip de Colón o GPS),
  // movemos la cámara del mapa automáticamente a las nuevas coordenadas.
  useEffect(() => {
    if (ubicacionActual && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ubicacionActual.latitud,
        longitude: ubicacionActual.longitud,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000); // Duración de la animación en ms
    }
  }, [ubicacionActual]);

  // Si la ubicación aún es null, mostramos el indicador de carga
  if (!ubicacionActual) {
    return (
      <View style={[styles.mapContainer, styles.centrado]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: "#666" }}>Obteniendo ubicación GPS...</Text>
      </View>
    );
  }

  const lugarActualEnLista = lugares.find(
    (lugar) =>
      Math.abs(lugar.coordenadas.latitud - ubicacionActual.latitud) < 0.0001 &&
      Math.abs(lugar.coordenadas.longitud - ubicacionActual.longitud) < 0.0001
  );

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: ubicacionActual.latitud,
          longitude: ubicacionActual.longitud,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation={false}
        onPress={() => {
          setLugarSeleccionado(obtenerDatosUbicacionActual());
        }}
      >
        {/* Marcador de tu ubicación actual */}
        {!lugarActualEnLista && (
          <Marker
            coordinate={{
              latitude: ubicacionActual.latitud,
              longitude: ubicacionActual.longitud,
            }}
            pinColor="blue"
            onPress={(e) => {
              e.stopPropagation();
              setLugarSeleccionado(obtenerDatosUbicacionActual());
            }}
          />
        )}

        {/* Marcadores de los lugares */}
        {lugares.map((lugar) => {
          const esEsteLugar =
            Math.abs(lugar.coordenadas.latitud - ubicacionActual.latitud) < 0.0001 &&
            Math.abs(lugar.coordenadas.longitud - ubicacionActual.longitud) < 0.0001;

          return (
            <Marker
              key={lugar.id}
              coordinate={{
                latitude: lugar.coordenadas.latitud,
                longitude: lugar.coordenadas.longitud,
              }}
              pinColor={esEsteLugar ? "blue" : "red"}
              onPress={(e) => {
                e.stopPropagation();
                if (esEsteLugar) {
                  setLugarSeleccionado(obtenerDatosUbicacionActual());
                } else {
                  setLugarSeleccionado({
                    id: lugar.id,
                    nombre: lugar.nombre,
                    subtitulo: null,
                    descripcionCorta: lugar.descripcionCorta,
                    esUbicacionActual: false,
                  });
                }
              }}
            />
          );
        })}
      </MapView>

      {/* Globo flotante */}
      {lugarSeleccionado && (
        <View style={styles.contenedorGlobo}>
          <View
            style={[
              styles.globoDialogo,
              lugarSeleccionado.esUbicacionActual && styles.fondoUbicacionActual,
            ]}
          >
            <View style={styles.dialogoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo} numberOfLines={1}>
                  {lugarSeleccionado.nombre}
                </Text>

                {lugarSeleccionado.subtitulo && (
                  <Text style={styles.subtituloLugar} numberOfLines={1}>
                    {lugarSeleccionado.subtitulo}
                  </Text>
                )}

                <Text style={styles.descripcion} numberOfLines={2}>
                  {lugarSeleccionado.descripcionCorta}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLugarSeleccionado(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>

            {!lugarSeleccionado.esUbicacionActual && (
              <TouchableOpacity
                style={styles.btnVerDetalle}
                onPress={() => router.push(`/lugar/${lugarSeleccionado.id}`)}
              >
                <Text style={styles.btnVerDetalleTexto}>Ver detalle &rarr;</Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.picoGlobo,
              lugarSeleccionado.esUbicacionActual && styles.picoUbicacionActual,
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { 
    flex: 1, 
    position: "relative" 
  },
  centrado: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  map: { 
    width: "100%", 
    height: "100%" 
  },
  contenedorGlobo: {
    position: "absolute",
    top: 15,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 10,
  },
  globoDialogo: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  fondoUbicacionActual: {
    backgroundColor: "#e8f0fe", 
    borderColor: "#b9d2ff",
  },
  picoGlobo: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
    marginTop: -1,
  },
  picoUbicacionActual: {
    borderTopColor: "#e8f0fe",
  },
  dialogoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titulo: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
    color: "#007AFF",
  },
  subtituloLugar: {
    fontWeight: "600",
    fontSize: 14,
    color: "#2E8B57",
    marginBottom: 3,
  },
  descripcion: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  btnVerDetalle: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0e1fd",
  },
  btnVerDetalleTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#007AFF",
  },
});