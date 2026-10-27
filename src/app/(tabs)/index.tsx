// src/app/(tabs)/index.tsx
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Alert } from "react-native";
import * as Location from "expo-location";
import CabeceraInicio from "../../components/CabeceraInicio";
import ListaLugares from "../../components/ListaLugares";
import MapaLugares from "../../components/MapaLugares";
import SimuladorUbicacion from "../../components/SimuladorUbicacion";
import { useTheme } from "../../hooks/useTheme";
import { obtenerLugares, obtenerCategorias } from "../../servicios/lugares";
import { Lugar, Categoria } from "../../tipos";

function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PantallaInicio() {
  const { colors, theme } = useTheme();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Ubicación actual (por defecto Colón, Entre Ríos)
  const [ubicacionActual, setUbicacionActual] = useState<{
    latitud: number;
    longitud: number;
  }>({
    latitud: -32.21568,
    longitud: -58.13649,
  });

  // Estados para el Simulador de Ubicación
  const [mostrarSimulador, setMostrarSimulador] = useState<boolean>(false);
  const [inputLat, setInputLat] = useState<string>("-32.21568");
  const [inputLon, setInputLon] = useState<string>("-58.13649");

  const [busquedaTexto, setBusquedaTexto] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todos");
  const [mostrarFiltrosExtra, setMostrarFiltrosExtra] = useState<boolean>(false);

  // 1. Obtener ubicación real por GPS al iniciar
  useEffect(() => {
    async function obtenerUbicacionGPS() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permiso de ubicación denegado. Usando ubicación por defecto.");
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
        console.error("Error al obtener la ubicación del GPS:", error);
      }
    }

    obtenerUbicacionGPS();
  }, []);

  // 2. Inicializar datos del backend en paralelo
  useEffect(() => {
    async function inicializar() {
      try {
        const [respuestaLugares, respuestaCategorias] = (await Promise.all([
          obtenerLugares(),
          obtenerCategorias(),
        ])) as [any, any];

        setLugares(respuestaLugares.datos || respuestaLugares);
        setCategorias(
          Array.isArray(respuestaCategorias)
            ? respuestaCategorias
            : respuestaCategorias.datos || []
        );
      } catch (error) {
        console.error("Error al inicializar datos:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  // Funciones del simulador
  const cambiarCoordenadasManual = (lat: number, lon: number) => {
    setUbicacionActual({ latitud: lat, longitud: lon });
    setInputLat(lat.toString());
    setInputLon(lon.toString());
  };

  const aplicarCoordenadasInputs = () => {
    const latNum = parseFloat(inputLat);
    const lonNum = parseFloat(inputLon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      Alert.alert("Error", "Por favor ingresa valores numéricos válidos para latitud y longitud.");
      return;
    }

    setUbicacionActual({ latitud: latNum, longitud: lonNum });
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
      Alert.alert("GPS Activado", "Ubicación real sincronizada correctamente.");
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la posición actual del GPS.");
    }
  };

  const lugaresFiltrados = useMemo(() => {
    const filtrados = lugares.filter((lugar) => {
      const coincideNombre = lugar.nombre
        .toLowerCase()
        .includes(busquedaTexto.toLowerCase());

      if (categoriaSeleccionada === "Todos") {
        return coincideNombre;
      }

      const coincideCategoria = lugar.categoriaId === categoriaSeleccionada;
      return coincideNombre && coincideCategoria;
    });

    return [...filtrados].sort((a, b) => {
      const distanciaA = calcularDistancia(
        ubicacionActual.latitud,
        ubicacionActual.longitud,
        a.coordenadas.latitud,
        a.coordenadas.longitud
      );
      const distanciaB = calcularDistancia(
        ubicacionActual.latitud,
        ubicacionActual.longitud,
        b.coordenadas.latitud,
        b.coordenadas.longitud
      );
      return distanciaA - distanciaB;
    });
  }, [lugares, busquedaTexto, categoriaSeleccionada, ubicacionActual]);

  const limpiarFiltros = () => {
    setBusquedaTexto("");
    setCategoriaSeleccionada("Todos");
    setMostrarFiltrosExtra(false);
  };

  const seleccionarCategoria = (cat: string) => {
    setCategoriaSeleccionada(cat);
    setMostrarFiltrosExtra(false);
  };

  if (cargando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.textoCargando, { color: colors.textSecondary }]}>
          Cargando Guía Turística y GPS...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Cabecera (puedes agregar un botón para alternar el simulador si lo deseas) */}
      <CabeceraInicio colors={colors} theme={theme} />

      {/* Botón opcional para desplegar/ocultar el simulador */}
      <View style={{ paddingHorizontal: 15, paddingVertical: 5 }}>
        <Text 
          style={{ fontSize: 12, color: colors.primary, fontWeight: "600", textAlign: "right" }}
          onPress={() => setMostrarSimulador(!mostrarSimulador)}
        >
          {mostrarSimulador ? "Ocultar Simulador GPS 🛠️" : "Simular Ubicación 🛠️"}
        </Text>
      </View>

      {/* Componente Simulador de Ubicación */}
      <SimuladorUbicacion
        mostrar={mostrarSimulador}
        inputLat={inputLat}
        inputLon={inputLon}
        setInputLat={setInputLat}
        setInputLon={setInputLon}
        onAplicarManual={aplicarCoordenadasInputs}
        onCambiarCoordenadas={cambiarCoordenadasManual}
        onGpsReal={activarGpsReal}
      />

      {/* 2. Mapa */}
      <View style={styles.mapaContainer}>
        <MapaLugares ubicacionActual={ubicacionActual} lugares={lugaresFiltrados} />
      </View>

      {/* 3. Lista de lugares y filtros */}
      <ListaLugares
        lugaresFiltrados={lugaresFiltrados}
        categorias={categorias}
        ubicacionActual={ubicacionActual}
        colors={colors}
        theme={theme}
        busquedaTexto={busquedaTexto}
        setBusquedaTexto={setBusquedaTexto}
        categoriaSeleccionada={categoriaSeleccionada}
        seleccionarCategoria={seleccionarCategoria}
        mostrarFiltrosExtra={mostrarFiltrosExtra}
        setMostrarFiltrosExtra={setMostrarFiltrosExtra}
        limpiarFiltros={limpiarFiltros}
        calcularDistancia={calcularDistancia}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoCargando: { marginTop: 10, fontSize: 16 },
  mapaContainer: {
    height: 250,
    width: "100%",
    zIndex: 1,
  },
});