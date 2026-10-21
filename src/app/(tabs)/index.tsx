// src/app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapaLugares from "../../components/MapaLugares";
import SimuladorUbicacion from "../../components/SimuladorUbicacion";
import { useTheme } from "../../hooks/useTheme";
import { obtenerLugares } from "../../servicios/lugares";
import { Lugar } from "../../tipos";

function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ubicacionActual, setUbicacionActual] = useState<{
    latitud: number;
    longitud: number;
  }>({
    latitud: -31.8333,
    longitud: -60.5167,
  });

  const [mostrarSimulador, setMostrarSimulador] = useState<boolean>(false);
  const [inputLat, setInputLat] = useState<string>("-32.2214");
  const [inputLon, setInputLon] = useState<string>("-58.1381");

  // Estados de Búsqueda y Filtros
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("Todos");

  // Estado para controlar la visibilidad del panel desplegable
  const [mostrarFiltrosExtra, setMostrarFiltrosExtra] =
    useState<boolean>(false);

  useEffect(() => {
    async function inicializar() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          let ubicacion = await Location.getCurrentPositionAsync({});
          const realLat = ubicacion.coords.latitude;
          const realLon = ubicacion.coords.longitude;
          setUbicacionActual({ latitud: realLat, longitud: realLon });
          setInputLat(realLat.toString());
          setInputLon(realLon.toString());
        }

        const respuesta = await obtenerLugares();
        setLugares(respuesta.datos);
      } catch (error) {
        console.error("Error al inicializar datos o GPS:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  const aplicarUbicacionManual = () => {
    const lat = parseFloat(inputLat);
    const lon = parseFloat(inputLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setUbicacionActual({ latitud: lat, longitud: lon });
    } else {
      alert("Por favor ingresa coordenadas válidas");
    }
  };

  const cambiarCoordenadasDirectas = (lat: number, lon: number) => {
    setInputLat(lat.toString());
    setInputLon(lon.toString());
    setUbicacionActual({ latitud: lat, longitud: lon });
  };

  const obtenerUbicacionRealGps = async () => {
    try {
      setCargando(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let ubicacion = await Location.getCurrentPositionAsync({});
        const realLat = ubicacion.coords.latitude;
        const realLon = ubicacion.coords.longitude;
        setUbicacionActual({ latitud: realLat, longitud: realLon });
        setInputLat(realLat.toString());
        setInputLon(realLon.toString());
      } else {
        alert("Se requieren permisos de ubicación para usar el GPS.");
      }
    } catch (error) {
      console.error("Error al obtener la ubicación real:", error);
      alert("No se pudo obtener la ubicación actual.");
    } finally {
      setCargando(false);
    }
  };

  // Filtrado y ordenamiento automático por cercanía
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
        lugar.categoriaId.toLowerCase() ===
          categoriaSeleccionada.toLowerCase() ||
        lugar.categoriaId.toLowerCase() === categoriaIdFormateado;

      return coincideNombre && coincideCategoria;
    });

    return [...filtrados].sort((a, b) => {
      const distanciaA = calcularDistancia(
        ubicacionActual.latitud,
        ubicacionActual.longitud,
        a.coordenadas.latitud,
        a.coordenadas.longitud,
      );
      const distanciaB = calcularDistancia(
        ubicacionActual.latitud,
        ubicacionActual.longitud,
        b.coordenadas.latitud,
        b.coordenadas.longitud,
      );
      return distanciaA - distanciaB;
    });
  }, [lugares, busquedaTexto, categoriaSeleccionada, ubicacionActual]);

  const limpiarFiltros = () => {
    setBusquedaTexto("");
    setCategoriaSeleccionada("Todos");
    setMostrarFiltrosExtra(false); // Ocultar también al limpiar si se desea
  };

  // Función al seleccionar una categoría específica
  const seleccionarCategoria = (cat: string) => {
    setCategoriaSeleccionada(cat);
    setMostrarFiltrosExtra(false); // Se oculta automáticamente al filtrar
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
      {/* Cabecera */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Colon - Secretaria de Turismo
        </Text>
        <TouchableOpacity
          style={[
            styles.qrButton,
            { backgroundColor: theme === "dark" ? "#2c2c2c" : "#f0f0f0" },
          ]}
          onPress={() => router.push("/escanear")}
        >
          <Ionicons name="qr-code-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Botón desplegable para simular ubicación */}
      <TouchableOpacity
        style={[
          styles.toggleSimulador,
          {
            backgroundColor: theme === "dark" ? "#1a2e22" : "#e8f8f0",
            borderBottomColor: theme === "dark" ? "#275c3e" : "#d4efdf",
          },
        ]}
        onPress={() => setMostrarSimulador(!mostrarSimulador)}
      >
        <Ionicons name="options-outline" size={18} color={colors.primary} />
        <Text style={[styles.toggleSimuladorText, { color: colors.primary }]}>
          {mostrarSimulador
            ? "Ocultar simulador de ubicación"
            : "Simular / Cambiar ubicación en Colón"}
        </Text>
      </TouchableOpacity>

      {/* Componente del Simulador */}
      <SimuladorUbicacion
        mostrar={mostrarSimulador}
        inputLat={inputLat}
        inputLon={inputLon}
        setInputLat={setInputLat}
        setInputLon={setInputLon}
        onAplicarManual={aplicarUbicacionManual}
        onCambiarCoordenadas={cambiarCoordenadasDirectas}
        onGpsReal={obtenerUbicacionRealGps}
      />

      {/* Componente del Mapa con altura definida */}
      <View style={styles.mapaContainer}>
        <MapaLugares
          ubicacionActual={ubicacionActual}
          lugares={lugaresFiltrados}
        />
      </View>

      {/* Listado de resultados: Título y Botón de Filtro al lado */}
      <View style={styles.cercaContainer}>
        <View style={styles.listHeaderRow}>
          <Text style={[styles.cercaTitle, { color: colors.text }]}>
            Lugares ({lugaresFiltrados.length})
          </Text>

          <View style={styles.accionesFiltroRow}>
            {/* Botón Principal de Filtros */}
            <TouchableOpacity
              style={[
                styles.botonAccionFiltro,
                {
                  backgroundColor: theme === "dark" ? "#1a2e22" : "#e8f8f0",
                  borderColor: theme === "dark" ? "#275c3e" : "#c6e7d6",
                },
              ]}
              onPress={() => setMostrarFiltrosExtra(!mostrarFiltrosExtra)}
            >
              <Ionicons
                name="funnel-outline"
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.botonAccionText, { color: colors.primary }]}>
                {categoriaSeleccionada === "Todos"
                  ? "Filtrar"
                  : categoriaSeleccionada}
              </Text>
              <Ionicons
                name={mostrarFiltrosExtra ? "chevron-up" : "chevron-down"}
                size={12}
                color={colors.primary}
              />
            </TouchableOpacity>

            {/* Botón de Limpiar (si hay filtros aplicados) */}
            {(busquedaTexto !== "" || categoriaSeleccionada !== "Todos") && (
              <TouchableOpacity
                style={[
                  styles.botonLimpiar,
                  {
                    backgroundColor: theme === "dark" ? "#3a1c1c" : "#fde8e8",
                    borderColor: theme === "dark" ? "#5c2727" : "#f5c6c6",
                  },
                ]}
                onPress={limpiarFiltros}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={13}
                  color="#d9534f"
                />
                <Text style={[styles.botonLimpiarText, { color: "#d9534f" }]}>
                  Limpiar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Panel desplegable que se oculta automáticamente al seleccionar categoría */}
        {mostrarFiltrosExtra && (
          <View
            style={[
              styles.panelFiltrosDesplegable,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.searchInputContainer,
                { backgroundColor: theme === "dark" ? "#2a2a2a" : "#f5f5f5" },
              ]}
            >
              <Ionicons
                name="search"
                size={16}
                color={colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar lugar por nombre..."
                placeholderTextColor={colors.textSecondary}
                value={busquedaTexto}
                onChangeText={setBusquedaTexto}
              />
            </View>

            <View style={styles.categoriasPildoras}>
              {["Todos", "Playas", "Alojamientos", "Gastronomia"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pildora,
                    {
                      backgroundColor:
                        categoriaSeleccionada === cat
                          ? colors.primary
                          : theme === "dark"
                            ? "#333"
                            : "#eee",
                    },
                  ]}
                  onPress={() => seleccionarCategoria(cat)}
                >
                  <Text
                    style={[
                      styles.pildoraTexto,
                      {
                        color:
                          categoriaSeleccionada === cat ? "#fff" : colors.text,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <FlatList
          data={lugaresFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const metros = calcularDistancia(
              ubicacionActual.latitud,
              ubicacionActual.longitud,
              item.coordenadas.latitud,
              item.coordenadas.longitud,
            );
            const textoDistancia =
              metros > 1000
                ? `${(metros / 1000).toFixed(1)} km`
                : `${Math.round(metros)} m`;

            return (
              <TouchableOpacity
                style={[
                  styles.lugarItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: theme === "dark" ? 1 : 0,
                  },
                ]}
                onPress={() => router.push(`/lugar/${item.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lugarNombre, { color: colors.text }]}>
                    {item.nombre}
                  </Text>
                  <Text
                    style={[styles.lugarDesc, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.descripcionCorta}
                  </Text>
                </View>
                <Text
                  style={[styles.lugarDistancia, { color: colors.primary }]}
                >
                  {textoDistancia}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoCargando: { marginTop: 10, fontSize: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  qrButton: { padding: 6, borderRadius: 8 },
  toggleSimulador: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  toggleSimuladorText: {
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 6,
  },
  cercaContainer: { flex: 1, padding: 15 },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cercaTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  accionesFiltroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  botonAccionFiltro: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  botonAccionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  botonLimpiar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  botonLimpiarText: {
    fontSize: 11,
    fontWeight: "600",
  },
  panelFiltrosDesplegable: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 6,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  categoriasPildoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pildora: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pildoraTexto: {
    fontSize: 11,
    fontWeight: "500",
  },
  lugarItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  lugarNombre: { fontSize: 15, fontWeight: "600" },
  lugarDesc: { fontSize: 12, maxWidth: 220, marginTop: 2 },
  lugarDistancia: { fontSize: 13, fontWeight: "bold" },
  mapaContainer: {
    height: 260, // Ajusta la altura según prefieras (ej. 250 o 300 píxeles)
    width: "100%",
    zIndex: 1,
  },
});
