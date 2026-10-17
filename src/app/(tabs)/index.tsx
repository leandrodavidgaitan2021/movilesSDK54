// src/app/(tabs)/index.tsx
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import CabeceraInicio from "../../components/CabeceraInicio";
import ListaLugares from "../../components/ListaLugares";
import MapaLugares from "../../components/MapaLugares";
import { useTheme } from "../../hooks/useTheme";
import { obtenerLugares } from "../../servicios/lugares";
import { Lugar } from "../../tipos";

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
  const [cargando, setCargando] = useState<boolean>(true);

  const [ubicacionActual, setUbicacionActual] = useState<{
    latitud: number;
    longitud: number;
  }>({
    latitud: -32.21568,
    longitud: -58.13649,
  });

  const [busquedaTexto, setBusquedaTexto] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todos");
  const [mostrarFiltrosExtra, setMostrarFiltrosExtra] = useState<boolean>(false);

  useEffect(() => {
    async function inicializar() {
      try {
        const respuesta = await obtenerLugares();
        setLugares(respuesta.datos);
      } catch (error) {
        console.error("Error al inicializar datos:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  const lugaresFiltrados = useMemo(() => {
    const filtrados = lugares.filter((lugar) => {
      const coincideNombre = lugar.nombre
        .toLowerCase()
        .includes(busquedaTexto.toLowerCase());

      if (categoriaSeleccionada === "Todos") {
        return coincideNombre;
      }

      const categoriaIdFormateado = `cat-${categoriaSeleccionada.toLowerCase().split(" ")[0]}`;
      const coincideCategoria =
        lugar.categoriaId.toLowerCase() === categoriaSeleccionada.toLowerCase() ||
        lugar.categoriaId.toLowerCase() === categoriaIdFormateado;

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
          Cargando Guía Turística...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Cabecera */}
      <CabeceraInicio colors={colors} theme={theme} />

      {/* 2. Mapa con altura de 380 */}
      <View style={styles.mapaContainer}>
        <MapaLugares ubicacionActual={ubicacionActual} lugares={lugaresFiltrados} />
      </View>

      {/* 3. Lista de lugares y filtros */}
      <ListaLugares
        lugaresFiltrados={lugaresFiltrados}
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
    height: 380,
    width: "100%",
    zIndex: 1,
  },
});