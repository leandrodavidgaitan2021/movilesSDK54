// src/components/PanelFiltros.tsx
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 1. Agregamos todas las propiedades a la interfaz Props
interface Props {
  colors: any;
  theme: string;
  busquedaTexto: string;
  setBusquedaTexto: (texto: string) => void;
  categoriaSeleccionada: string;
  seleccionarCategoria: (cat: string) => void;
}

export default function PanelFiltros({
  colors,
  theme,
  busquedaTexto,
  setBusquedaTexto,
  categoriaSeleccionada,
  seleccionarCategoria,
}: Props) {
  return (
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
                  color: categoriaSeleccionada === cat ? "#fff" : colors.text,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  searchInput: { flex: 1, fontSize: 13 },
  categoriasPildoras: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pildora: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  pildoraTexto: { fontSize: 11, fontWeight: "500" },
});