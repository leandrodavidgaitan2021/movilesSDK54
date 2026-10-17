// src/componentes/MapaLugares.tsx
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Lugar } from "../tipos";

interface Props {
  ubicacionActual: { latitud: number; longitud: number };
  lugares: Lugar[];
}

export default function MapaLugares({ ubicacionActual, lugares }: Props) {
  const router = useRouter();

  // Función para verificar si la ubicación actual coincide con algún lugar de la lista
  const obtenerDatosUbicacionActual = () => {
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
      descripcionCorta: "Posición actual o simulada",
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

  // Verificamos si estamos en un lugar de la lista para no duplicar el marcador
  const lugarActualEnLista = lugares.find(
    (lugar) =>
      Math.abs(lugar.coordenadas.latitud - ubicacionActual.latitud) < 0.0001 &&
      Math.abs(lugar.coordenadas.longitud - ubicacionActual.longitud) < 0.0001
  );

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        region={{
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
        {/* Marcador de tu ubicación actual (solo si NO estás exactamente en un lugar de la lista) */}
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
          // Comparamos directamente si este lugar coincide con las coordenadas actuales
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
              // Si es tu ubicación actual, se fuerza obligatoriamente a "blue"
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

      {/* Globo de diálogo flotante estilo historieta */}
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

          {/* Pico del globo con color dinámico según la ubicación */}
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
  mapContainer: { flex: 1, position: "relative" },
  map: { width: "100%", height: "100%" },

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
    backgroundColor: "white", // Fondo normal para otros lugares
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
  // Fondo especial cuando estás en tu ubicación actual
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
    borderTopColor: "white", // Color normal del pico
    marginTop: -1,
  },
  // Pico con color adaptado al fondo de la ubicación actual
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