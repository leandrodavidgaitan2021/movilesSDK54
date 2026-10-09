// src/components/FiltrosYBusqueda.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

const CATEGORIAS = [
  "Todos",
  "playas",
  "termas",
  "museos y patrimonio",
  "gastronomía",
  "artesanías",
  "naturaleza",
  "alojamiento",
];

interface Props {
  busquedaTexto: string;
  setBusquedaTexto: (texto: string) => void;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (cat: string) => void;
}

export default function FiltrosYBusqueda({
  busquedaTexto,
  setBusquedaTexto,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
}: Props) {
  const { colors, theme } = useTheme();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Verificamos si hay algún filtro activo
  const hayFiltrosActivos =
    busquedaTexto.length > 0 || categoriaSeleccionada !== "Todos";

  // Función para limpiar los filtros
  const limpiarFiltros = () => {
    setBusquedaTexto("");
    setCategoriaSeleccionada("Todos");
  };

  return (
    <View style={styles.containerPrincipal}>
      {/* Contenedor horizontal para el botón de filtrar y el botón condicional de limpiar */}
      <View style={styles.botonesSuperioresRow}>
        <TouchableOpacity
          style={[
            styles.botonDesplegable,
            {
              backgroundColor: hayFiltrosActivos ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hayFiltrosActivos ? "#fff" : colors.text}
          />
          <Text
            style={[
              styles.textoBotonDesplegable,
              { color: hayFiltrosActivos ? "#fff" : colors.text },
            ]}
          >
            {hayFiltrosActivos ? "Filtrado activo" : "Filtrar"}
          </Text>
        </TouchableOpacity>

        {/* Botón de limpiar que aparece al lado solo si hay filtros activos */}
        {hayFiltrosActivos && (
          <TouchableOpacity
            style={[
              styles.botonLimpiarExterior,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={limpiarFiltros}
          >
            <Ionicons name="trash-outline" size={18} color={colors.text} />
            <Text
              style={[styles.textoBotonLimpiarExterior, { color: colors.text }]}
            >
              Limpiar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal / Menú Desplegable */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Cabecera del Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filtrar lugares
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Barra de Búsqueda */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar lugares por nombre..."
                value={busquedaTexto}
                onChangeText={setBusquedaTexto}
                placeholderTextColor={colors.textSecondary}
              />
              {busquedaTexto.length > 0 && (
                <TouchableOpacity onPress={() => setBusquedaTexto("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Selector de Categorías */}
            <Text style={[styles.seccionTitulo, { color: colors.text }]}>
              Categorías
            </Text>
            <ScrollView
              contentContainerStyle={styles.categoriasContainerModal}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORIAS.map((cat) => {
                const activo = categoriaSeleccionada === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoriaChip,
                      {
                        backgroundColor:
                          theme === "dark" ? "#2c2c2c" : "#f1f2f6",
                        borderColor: theme === "dark" ? "#444" : "#dcdde1",
                      },
                      activo && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setCategoriaSeleccionada(cat)}
                  >
                    <Text
                      style={[
                        styles.categoriaTexto,
                        { color: colors.textSecondary },
                        activo && styles.categoriaTextoActivo,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Botón Aplicar / Cerrar */}
            <TouchableOpacity
              style={[styles.botonAplicar, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoBotonAplicar}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  containerPrincipal: {
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  botonesSuperioresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonDesplegable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textoBotonDesplegable: {
    fontSize: 14,
    fontWeight: "600",
  },
  botonLimpiarExterior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textoBotonLimpiarExterior: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "75%",
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  categoriasContainerModal: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 15,
  },
  categoriaChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoriaTexto: { fontSize: 13, fontWeight: "500" },
  categoriaTextoActivo: { color: "#fff", fontWeight: "bold" },
  botonAplicar: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBotonAplicar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
