import { StyleSheet, Text, View } from "react-native";
import { Lugar } from "../tipos";

interface Props {
  ubicacionActual: { latitud: number; longitud: number };
  lugares: Lugar[];
}

export default function MapaLugares({ ubicacionActual, lugares }: Props) {
  return (
    <View style={styles.mapContainer}>
      <View style={styles.fallback}>
        <Text style={styles.title}>Mapa no disponible en web</Text>
        <Text style={styles.subtitle}>
          Esta funcionalidad solo está disponible en la app móvil (Expo Go o
          desarrollo nativo).
        </Text>
        <Text style={styles.coords}>
          Ubicación actual: {ubicacionActual.latitud.toFixed(4)},{" "}
          {ubicacionActual.longitud.toFixed(4)}
        </Text>
        <Text style={styles.count}>
          Lugares mostrados: {lugares.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: "#e8f4fc",
    borderRadius: 12,
    overflow: "hidden",
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4a5568",
    textAlign: "center",
    marginBottom: 16,
  },
  coords: {
    fontSize: 13,
    color: "#2b6cb0",
    marginBottom: 6,
  },
  count: {
    fontSize: 13,
    color: "#2b6cb0",
  },
});
