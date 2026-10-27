// src/components/PanelFiltros.tsx
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Categoria } from "../tipos";

interface Props {
  colors: any;
  theme: string;
  busquedaTexto: string;
  setBusquedaTexto: (texto: string) => void;
  categoriaSeleccionada: string;
  seleccionarCategoria: (cat: string) => void;
  categorias: Categoria[];
}

export default function PanelFiltros({
  colors,
  theme,
  busquedaTexto,
  setBusquedaTexto,
  categoriaSeleccionada,
  seleccionarCategoria,
  categorias,
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
        {/* Opción "Todos" */}
        <TouchableOpacity
          key="Todos"
          style={[
            styles.pildora,
            {
              backgroundColor:
                categoriaSeleccionada === "Todos"
                  ? colors.primary
                  : theme === "dark"
                  ? "#333"
                  : "#eee",
            },
          ]}
          onPress={() => seleccionarCategoria("Todos")}
        >
          <Text
            style={[
              styles.pildoraTexto,
              {
                color: categoriaSeleccionada === "Todos" ? "#fff" : colors.text,
              },
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {/* Mapeamos usando cat.id para que coincida con lugar.categoriaId */}
        {categorias.map((cat) => {
          const seleccionada = categoriaSeleccionada === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pildora,
                {
                  backgroundColor: seleccionada
                    ? colors.primary
                    : theme === "dark"
                    ? "#333"
                    : "#eee",
                },
              ]}
              onPress={() => seleccionarCategoria(cat.id)} // Pasamos el ID exacto (ej: "cat-playas")
            >
              <Text
                style={[
                  styles.pildoraTexto,
                  {
                    color: seleccionada ? "#fff" : colors.text,
                  },
                ]}
              >
                {cat.nombre} {/* Mostramos el nombre legible al usuario */}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  searchInput: { 
    flex: 1, 
    fontSize: 13 
  },
  categoriasPildoras: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 6 
  },
  pildora: { 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 12 
  },
  pildoraTexto: { 
    fontSize: 11, 
    fontWeight: "500" 
  },
});