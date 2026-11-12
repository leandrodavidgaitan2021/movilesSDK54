import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Alert } from "react-native";
import CabeceraInicio from "../../components/CabeceraInicio";
import ListaLugares from "../../components/ListaLugares";
import MapaLugares from "../../components/MapaLugares";
import SimuladorUbicacion from "../../components/SimuladorUbicacion";
import { useTheme } from "../../hooks/useTheme";
import { useLocation } from "../../hooks/useLocation"; 
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
  
  // Utilizamos la logica del contexto de ubicacioón
  const {
    ubicacionActual,
    cambiarCoordenadasManual,
    activarGpsReal,
    inputLat,
    inputLon,
    setInputLat,
    setInputLon,
  } = useLocation();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const [mostrarSimulador, setMostrarSimulador] = useState<boolean>(false);
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todos");
  const [mostrarFiltrosExtra, setMostrarFiltrosExtra] = useState<boolean>(false);

  // Consultamos al backend o de SQLite (offline)
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

  const aplicarCoordenadasInputs = () => {
    const latNum = parseFloat(inputLat);
    const lonNum = parseFloat(inputLon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      Alert.alert("Error", "Por favor ingresa valores numéricos válidos para latitud y longitud.");
      return;
    }

    cambiarCoordenadasManual(latNum, lonNum);
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
          Cargando Guía Turística de Colón...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CabeceraInicio colors={colors} theme={theme} />

      {/* Boton para mostrar/ocultar el simulador */}
      <View style={{ paddingHorizontal: 15, paddingVertical: 5 }}>
        <Text 
          style={{ fontSize: 12, color: colors.primary, fontWeight: "600", textAlign: "right" }}
          onPress={() => setMostrarSimulador(!mostrarSimulador)}
        >
          {mostrarSimulador ? "Ocultar Simulador GPS 🛠️" : "Simular Ubicación 🛠️"}
        </Text>
      </View>

      {/* Componente simulador de ubicación */}
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

      {/* Componenete que muestra el mapa de lugares */}
      <View style={styles.mapaContainer}>
        <MapaLugares lugares={lugaresFiltrados} />
      </View>

      {/* Componente que lista los lugares y permite filtrar */}
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