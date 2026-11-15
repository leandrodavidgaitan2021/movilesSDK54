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

      <Text style={styles.sugerenciaLabel}>Accesos directos en Colón (5 lugares):</Text>
      <View style={styles.chipsContainer}>
        {/* 1. Oficina de Turismo */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.21568, -58.13649)}
        >
          <Text style={styles.chipText}>Oficina Turismo</Text>
        </TouchableOpacity>

        {/* 2. Centro / Plaza San Martín */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.2214, -58.1381)}
        >
          <Text style={styles.chipText}>Centro / Plaza</Text>
        </TouchableOpacity>

        {/* 3. Complejo Termal Colón */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.2305, -58.1452)}
        >
          <Text style={styles.chipText}>Termas Colón</Text>
        </TouchableOpacity>

        {/* 4. Playa Norte / Costanera */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-32.2091, -58.1310)}
        >
          <Text style={styles.chipText}>Playa Norte</Text>
        </TouchableOpacity>

        {/* 5. Parque Nacional El Palmar (Cercanías/Acceso) */}
        <TouchableOpacity
          style={styles.chip}
          onPress={() => onCambiarCoordenadas(-31.8590, -58.2380)}
        >
          <Text style={styles.chipText}>El Palmar</Text>
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
  sugerenciaLabel: { fontSize: 11, color: "#888", marginBottom: 6 },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 5,
    paddingHorizontal: 10,
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
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#c6e7d6",
    gap: 6,
  },
  botonGpsRealText: { color: "#27ae60", fontWeight: "600", fontSize: 12 },
});