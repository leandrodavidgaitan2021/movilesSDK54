// src/components/MapaLugares.tsx
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform, Linking } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { Lugar } from "../tipos";
import { useLocation } from "../hooks/useLocation";
import { hayConexionInternet } from "../servicios/red";

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

  // Estado separado para mantener la línea recta activa aunque se cierre el cartel
  const [destinoRuta, setDestinoRuta] = useState<Lugar | null>(null);

  // Centrar la cámara en la ubicación actual del usuario
  const centrarEnUbicacionActual = () => {
    if (ubicacionActual && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ubicacionActual.latitud,
        longitude: ubicacionActual.longitud,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
      setLugarSeleccionado(obtenerDatosUbicacionActual());
    }
  };

  // Cada vez que 'ubicacionActual' cambie al inicio, movemos la cámara del mapa
  useEffect(() => {
    if (ubicacionActual && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ubicacionActual.latitud,
        longitude: ubicacionActual.longitud,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000);
    }
  }, [ubicacionActual]);

  // Función para abrir Google Maps externo o app de mapas nativa
  const abrirNavegacionExterna = async (lugarDestino: { latitud: number; longitud: number }) => {
    if (!ubicacionActual) return;

    const conectado = await hayConexionInternet();
    const latOrigen = ubicacionActual.latitud;
    const lonOrigen = ubicacionActual.longitud;
    const latDestino = lugarDestino.latitud;
    const lonDestino = lugarDestino.longitud;

    if (!conectado) {
      // Si no hay red, la app ya muestra la línea recta roja en el mapa, avisamos al usuario
      return;
    }

    const url = Platform.select({
      ios: `maps://app?saddr=${latOrigen},${lonOrigen}&daddr=${latDestino},${lonDestino}`,
      android: `https://www.google.com/maps/dir/?api=1&origin=${latOrigen},${lonOrigen}&destination=${latDestino},${lonDestino}&travelmode=driving`,
    });

    const urlWeb = `https://www.google.com/maps/dir/?api=1&origin=${latOrigen},${lonOrigen}&destination=${latDestino},${lonDestino}`;

    try {
      const supported = url ? await Linking.canOpenURL(url) : false;
      if (supported && url) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(urlWeb);
      }
    } catch {
      await Linking.openURL(urlWeb);
    }
  };

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
                  // Fijamos el destino de la ruta de forma independiente al cartel
                  setDestinoRuta(lugar);
                }
              }}
            />
          );
        })}

        {/* LÍNEA RECTA OFFLINE: Permanece visible aunque cierres el cartel */}
        {destinoRuta && (
          <Polyline
            coordinates={[
              { latitude: ubicacionActual.latitud, longitude: ubicacionActual.longitud },
              { latitude: destinoRuta.coordenadas.latitud, longitude: destinoRuta.coordenadas.longitud },
            ]}
            strokeColor="#FF3B30"
            strokeWidth={4}
            lineDashPattern={[6, 6]}
          />
        )}
      </MapView>

      {/* Botón flotante para centrar en la ubicación actual (Estilo Google Maps) */}
      <TouchableOpacity
        style={[
          styles.btnAccionFlotante,
          styles.btnMiUbicacion,
          destinoRuta ? { bottom: 75 } : { bottom: 20 },
        ]}
        onPress={centrarEnUbicacionActual}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color="#007AFF" />
      </TouchableOpacity>

      {/* Botón flotante para limpiar la ruta cuando el usuario lo desee */}
      {destinoRuta && (
        <TouchableOpacity
          style={styles.btnLimpiarRuta}
          onPress={() => setDestinoRuta(null)}
        >
          <Ionicons name="close-circle" size={16} color="#fff" />
          <Text style={styles.btnLimpiarRutaTexto}>Quitar línea</Text>
        </TouchableOpacity>
      )}

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

            {/* Acciones dentro del globo */}
            {!lugarSeleccionado.esUbicacionActual && (
              <View style={styles.accionesGlobo}>
                <TouchableOpacity
                  style={styles.btnVerDetalle}
                  onPress={() => router.push(`/lugar/${lugarSeleccionado.id}`)}
                >
                  <Text style={styles.btnVerDetalleTexto}>Ver detalle &rarr;</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnGoogleMaps}
                  onPress={() => {
                    const lugarObj = lugares.find((l) => l.id === lugarSeleccionado.id);
                    if (lugarObj) {
                      abrirNavegacionExterna(lugarObj.coordenadas);
                    }
                  }}
                >
                  <Ionicons name="navigate" size={14} color="#fff" />
                  <Text style={styles.btnGoogleMapsTexto}>Google Maps</Text>
                </TouchableOpacity>
              </View>
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
  accionesGlobo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  btnVerDetalle: {
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
  btnGoogleMaps: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  btnGoogleMapsTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
  btnAccionFlotante: {
    position: "absolute",
    right: 20,
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  btnMiUbicacion: {
    // La posición inferior se ajusta dinámicamente si hay un botón activo arriba
  },
  btnLimpiarRuta: {
    position: "absolute",
    bottom: 20,
    right: 80,
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  btnLimpiarRutaTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});