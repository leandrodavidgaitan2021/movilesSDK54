// src/app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CabeceraInicio from "../../components/CabeceraInicio";
import ListaLugares from "../../components/ListaLugares";
import MapaLugares from "../../components/MapaLugares";
import SimuladorUbicacion from "../../components/SimuladorUbicacion";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { obtenerCategorias, obtenerLugares } from "../../servicios/lugares";
import { obtenerVisitas, registrarVisita } from "../../servicios/visitas";
import { Categoria, Lugar } from "../../tipos";

const RADIO_PROXIMIDAD_METROS = 150;

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
  const { user } = useAuth();
  const db = useSQLiteContext();
  const router = useRouter();

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

  // Control para aviso de proximidad (máximo 1 aviso por lugar y por día)
  const [lugaresVisitadosIds, setLugaresVisitadosIds] = useState<Set<string>>(new Set());
  const [avisosDescartadosHoy, setAvisosDescartadosHoy] = useState<Set<string>>(new Set());
  const [registrandoGps, setRegistrandoGps] = useState<boolean>(false);

  // 1. Obtener ubicación real por GPS al iniciar
  useEffect(() => {
    async function obtenerUbicacionGPS() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permiso de ubicación denegado. Usando ubicación por defecto.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
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

  // 2. Inicializar datos del backend y visitas previas
  useEffect(() => {
    async function inicializar() {
      try {
        const [respuestaLugares, respuestaCategorias, visitasGuardadas] = (await Promise.all([
          obtenerLugares(),
          obtenerCategorias(),
          obtenerVisitas(db),
        ])) as [any, any, any[]];

        setLugares(respuestaLugares.datos || respuestaLugares);
        setCategorias(
          Array.isArray(respuestaCategorias)
            ? respuestaCategorias
            : respuestaCategorias.datos || []
        );

        const ids = new Set<string>(
          visitasGuardadas.map((v) => v.lugarId.trim().toLowerCase())
        );
        setLugaresVisitadosIds(ids);
      } catch (error) {
        console.error("Error al inicializar datos:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, [db]);

  // Detectar el lugar más cercano dentro del radio de 150 metros que aún no fue visitado ni descartado hoy
  const lugarCercanoDetectado = useMemo(() => {
    if (lugares.length === 0) return null;

    let masCercano: { lugar: Lugar; distancia: number } | null = null;

    for (const lugar of lugares) {
      const clave = lugar.id.trim().toLowerCase();
      if (lugaresVisitadosIds.has(clave) || avisosDescartadosHoy.has(clave)) {
        continue;
      }

      const dist = calcularDistancia(
        ubicacionActual.latitud,
        ubicacionActual.longitud,
        lugar.coordenadas.latitud,
        lugar.coordenadas.longitud
      );

      if (dist <= RADIO_PROXIMIDAD_METROS) {
        if (!masCercano || dist < masCercano.distancia) {
          masCercano = { lugar, distancia: Math.round(dist) };
        }
      }
    }

    return masCercano;
  }, [lugares, ubicacionActual, lugaresVisitadosIds, avisosDescartadosHoy]);

  // Registrar visita por proximidad física ("gps")
  const handleRegistrarPorProximidad = async () => {
    if (!lugarCercanoDetectado) return;
    const { lugar } = lugarCercanoDetectado;

    try {
      setRegistrandoGps(true);
      const usuarioIdActual = typeof user === "string" ? user : "usr-201";

      const resultado = await registrarVisita(
        db,
        usuarioIdActual,
        lugar.id,
        "gps",
        null,
        null
      );

      setLugaresVisitadosIds((prev) => new Set(prev).add(lugar.id.trim().toLowerCase()));

      Alert.alert(
        resultado.esNueva ? "¡Visita registrada por cercanía!" : "Lugar ya en tu recorrido",
        resultado.esNueva
          ? `Registramos tu visita en ${lugar.nombre} por estar físicamente cerca. ¿Deseás agregarle una foto o nota?`
          : `${lugar.nombre} ya estaba en tu recorrido. Se actualizó la fecha.`,
        [
          {
            text: "Cerrar",
            style: "cancel",
          },
          {
            text: "Ir a cargar foto",
            onPress: () => router.push(`/lugar/${lugar.id}`),
          },
        ]
      );
    } catch (error) {
      console.error("Error registrando visita por GPS:", error);
      Alert.alert("Error", "No se pudo registrar la visita por cercanía.");
    } finally {
      setRegistrandoGps(false);
    }
  };

  const descartarAvisoHoy = (lugarId: string) => {
    setAvisosDescartadosHoy((prev) => new Set(prev).add(lugarId.trim().toLowerCase()));
  };

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se pudo acceder a los permisos de ubicación.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      setUbicacionActual({ latitud: lat, longitud: lon });
      setInputLat(lat.toString());
      setInputLon(lon.toString());
      Alert.alert("GPS Activado", "Ubicación real sincronizada correctamente.");
    } catch  {
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
      {/* 1. Cabecera */}
      <CabeceraInicio colors={colors} theme={theme} />

      {/* Botón desplegable para simular ubicación */}
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

      {/* Banner de Proximidad Física ("estando físicamente cerca") */}
      {lugarCercanoDetectado && (
        <View
          style={[
            styles.bannerProximidad,
            {
              backgroundColor: theme === "dark" ? "#1e3a29" : "#e8f8f0",
              borderColor: colors.primary,
            },
          ]}
        >
          <View style={styles.bannerInfo}>
            <Ionicons name="location" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitulo, { color: colors.text }]}>
                ¡Estás cerca de {lugarCercanoDetectado.lugar.nombre}!
              </Text>
              <Text style={[styles.bannerSubtitulo, { color: colors.textSecondary }]}>
                A {lugarCercanoDetectado.distancia} m de distancia
              </Text>
            </View>
          </View>

          <View style={styles.bannerAcciones}>
            <TouchableOpacity
              style={[styles.btnRegistrarCerca, { backgroundColor: colors.primary }]}
              onPress={handleRegistrarPorProximidad}
              disabled={registrandoGps}
            >
              <Text style={styles.btnRegistrarCercaTexto}>
                {registrandoGps ? "Guardando..." : "Registrar visita"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCerrarBanner}
              onPress={() => descartarAvisoHoy(lugarCercanoDetectado.lugar.id)}
              accessibilityLabel="Cerrar aviso de cercanía"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Mapa */}
      <View style={styles.mapaContainer}>
        <MapaLugares  lugares={lugaresFiltrados} />
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
  bannerProximidad: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bannerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerTitulo: {
    fontSize: 13,
    fontWeight: "bold",
  },
  bannerSubtitulo: {
    fontSize: 11,
  },
  bannerAcciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnRegistrarCerca: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnRegistrarCercaTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  btnCerrarBanner: {
    padding: 4,
  },
});