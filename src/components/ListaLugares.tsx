// src/components/ListaLugares.tsx
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Lugar, Categoria } from "../tipos";
import PanelFiltros from "./PanelFiltros";

interface Props {
  lugaresFiltrados: Lugar[];
  categorias: Categoria[];
  ubicacionActual: { latitud: number; longitud: number };
  colors: any;
  theme: string;
  busquedaTexto: string;
  setBusquedaTexto: (texto: string) => void;
  categoriaSeleccionada: string;
  seleccionarCategoria: (cat: string) => void;
  mostrarFiltrosExtra: boolean;
  setMostrarFiltrosExtra: (mostrar: boolean) => void;
  limpiarFiltros: () => void;
  calcularDistancia: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

export default function ListaLugares({
  lugaresFiltrados,
  categorias,
  ubicacionActual,
  colors,
  theme,
  busquedaTexto,
  setBusquedaTexto,
  categoriaSeleccionada,
  seleccionarCategoria,
  mostrarFiltrosExtra,
  setMostrarFiltrosExtra,
  limpiarFiltros,
  calcularDistancia,
}: Props) {
  const router = useRouter();

  const lugaresParaMostrar = lugaresFiltrados.filter((item) => {
    const metros = calcularDistancia(
      ubicacionActual.latitud,
      ubicacionActual.longitud,
      item.coordenadas.latitud,
      item.coordenadas.longitud
    );
    return metros > 1; 
  });

  const obtenerTituloCabecera = () => {
    if (busquedaTexto.trim() !== "") {
      return `Resultados para "${busquedaTexto}" (${lugaresParaMostrar.length})`;
    }
    if (categoriaSeleccionada === "Todos") {
      return `Todos (${lugaresParaMostrar.length})`;
    }
    const categoriaEncontrada = categorias.find((c) => c.id === categoriaSeleccionada);
    return `${categoriaEncontrada ? categoriaEncontrada.nombre : "Filtrados"} (${lugaresParaMostrar.length})`;
  };

  return (
    <View style={styles.cercaContainer}>
      <View style={styles.listHeaderRow}>
        <Text style={[styles.cercaTitle, { color: colors.text }]}>
          {obtenerTituloCabecera()}
        </Text>

        <View style={styles.accionesFiltroRow}>
          {/* Botón para abrir el Modal de Filtros */}
          <TouchableOpacity
            style={[
              styles.botonAccionFiltro,
              {
                backgroundColor: theme === "dark" ? "#1a2e22" : "#e8f8f0",
                borderColor: theme === "dark" ? "#275c3e" : "#c6e7d6",
              },
            ]}
            onPress={() => setMostrarFiltrosExtra(true)}
          >
            <Ionicons name="funnel-outline" size={13} color={colors.primary} />
            <Text style={[styles.botonAccionText, { color: colors.primary }]}>
              {categoriaSeleccionada === "Todos"
                ? "Filtrar"
                : categorias.find((c) => c.id === categoriaSeleccionada)?.nombre || "Filtrar"}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.primary} />
          </TouchableOpacity>

          {/* Botón Limpiar (aparece solo si hay filtro o búsqueda activa) */}
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
              <Ionicons name="close-circle-outline" size={13} color="#d9534f" />
              <Text style={[styles.botonLimpiarText, { color: "#d9534f" }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal que envuelve a PanelFiltros para que se abra flotando */}
      {mostrarFiltrosExtra && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar lugares</Text>
              <TouchableOpacity onPress={() => setMostrarFiltrosExtra(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <PanelFiltros
              colors={colors}
              theme={theme}
              busquedaTexto={busquedaTexto}
              setBusquedaTexto={setBusquedaTexto}
              categoriaSeleccionada={categoriaSeleccionada}
              seleccionarCategoria={(cat) => {
                seleccionarCategoria(cat);
                setMostrarFiltrosExtra(false); // Opcional: cierra el modal al seleccionar una categoría
              }}
              categorias={categorias}
            />
          </View>
        </View>
      )}

      <FlatList
        data={lugaresParaMostrar}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const metros = calcularDistancia(
            ubicacionActual.latitud,
            ubicacionActual.longitud,
            item.coordenadas.latitud,
            item.coordenadas.longitud
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
              <Text style={[styles.lugarDistancia, { color: colors.primary }]}>
                {textoDistancia}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cercaContainer: { flex: 1, padding: 15 },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cercaTitle: { fontSize: 16, fontWeight: "bold" },
  accionesFiltroRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  botonAccionFiltro: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  botonAccionText: { fontSize: 12, fontWeight: "600" },
  botonLimpiar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  botonLimpiarText: { fontSize: 11, fontWeight: "600" },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
    padding: 20,
  },
  modalContent: {
    width: "100%",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  modalTitle: { fontSize: 15, fontWeight: "bold" },
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
});