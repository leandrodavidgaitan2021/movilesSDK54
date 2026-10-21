import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  mostrar: boolean;
  inputLat: string;
  inputLon: string;
  setInputLat: (val: string) => void;
  setInputLon: (val: string) => void;
  onAplicarManual: () => void;
  onCambiarCoordenadas: (lat: number, lon: number) => void;
  onGpsReal: () => void;
}

export default function SimuladorUbicacion({
  mostrar,
  inputLat,
  inputLon,
  setInputLat,
  setInputLon,
  onAplicarManual,
  onCambiarCoordenadas,
  onGpsReal,
}: Props) {
  if (!mostrar) return null;

  return (
    <View style={styles.simuladorContainer}>
      <Text style={styles.simuladorLabel}>Latitud y Longitud Actuales:</Text>
      <View style={styles.inputsRow}>
        <TextInput
          style={styles.inputCoord}
          value={inputLat}
          onChangeText={setInputLat}
          keyboardType="numeric"
          placeholder="Latitud"
        />
        <TextInput
          style={styles.inputCoord}
          value={inputLon}
          onChangeText={setInputLon}
          keyboardType="numeric"
          placeholder="Longitud"
        />
        <TouchableOpacity style={styles.botonAplicar} onPress={onAplicarManual}>
          <Text style={styles.botonAplicarText}>Ir</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sugerenciaLabel}>Accesos directos en Colón:</Text>
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.2214, -58.1381)}
        >
          <Text style={styles.chipText}>Centro / Plaza</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.235, -58.142)}
        >
          <Text style={styles.chipText}>Termas Colón</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.215, -58.13)}
        >
          <Text style={styles.chipText}>Costanera</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botonGpsReal} onPress={onGpsReal}>
        <Ionicons name="locate" size={16} color="#27ae60" />
        <Text style={styles.botonGpsRealText}>
          Usar mi ubicación real (GPS)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  simuladorContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  simuladorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  inputsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  inputCoord: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  botonAplicar: {
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  botonAplicarText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sugerenciaLabel: { fontSize: 11, color: "#888", marginBottom: 4 },
  chipsRow: { flexDirection: "row", gap: 6 },
  chip: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipText: { fontSize: 11, color: "#333", fontWeight: "500" },
  botonGpsReal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f8f0",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#c6e7d6",
    gap: 6,
  },
  botonGpsRealText: { color: "#27ae60", fontWeight: "600", fontSize: 12 },
});
