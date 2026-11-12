// app/index.tsx
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme"; // Ajusta la ruta de tu hook según corresponda

export default function PantallaBienvenida() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.titulo, { color: colors.text }]}>Turismo Colón</Text>
      <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
        Descubre los mejores lugares de la ciudad
      </Text>

      <TouchableOpacity
        style={[styles.boton, { backgroundColor: colors.primary }]}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.textoBoton}>Explorar Lugares</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  boton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
