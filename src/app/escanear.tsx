// src/app/escanear.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { obtenerLugarPorId } from "../servicios/lugares";
import {
  parsearCodigoQr,
  registrarVisita,
  yaVisito,
} from "../servicios/visitas";

export default function EscanearScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Cargando permisos de la cámara...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons
          name="camera-outline"
          size={48}
          color={colors.primary}
          style={{ marginBottom: 15 }}
        />
        <Text
          style={[
            styles.text,
            { color: colors.text, textAlign: "center", paddingHorizontal: 20 },
          ]}
        >
          Necesitamos acceso a la cámara para que puedas escanear los códigos QR
          de los puntos turísticos.
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, marginBottom: 10 },
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecundario, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonSecundarioText, { color: colors.text }]}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || procesando) return;
    setScanned(true);
    setProcesando(true);

    try {
      const lugarId = parsearCodigoQr(data);

      if (!lugarId) {
        Alert.alert(
          "Código no reconocido",
          "Este QR no pertenece a la guía de Colón.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      const lugar = await obtenerLugarPorId(lugarId);
      if (!lugar) {
        Alert.alert(
          "Lugar no encontrado",
          "El código es de Colón pero ese lugar no está en el catálogo.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      if (isAuthenticated) {
        // COMPROBACIÓN: Verificamos si este lugar ya fue visitado previamente
        const yaRegistrado = await yaVisito(lugarId);

        if (yaRegistrado) {
          // Si ya existe, le avisamos al usuario y NO agregamos una nueva visita a la lista
          Alert.alert(
            "Lugar ya registrado",
            `Ya habías visitado "${lugar.nombre}". No se duplicará en tu recorrido.`,
            [
              {
                text: "Ver lugar",
                onPress: () => router.replace(`/lugar/${lugarId}`),
              },
              {
                text: "Ir a Mi Recorrido",
                onPress: () => router.replace("/(tabs)/recorrido"),
              },
            ]
          );
        } else {
          // Si es la primera vez que lo escanea, lo registra
          await registrarVisita({
            lugarId,
            origen: "qr",
          });

          Alert.alert(
            "¡Visita registrada!",
            `Check-in en ${lugar.nombre}.`,
            [
              {
                text: "Ver lugar",
                onPress: () => router.replace(`/lugar/${lugarId}`),
              },
              {
                text: "Ir a Mi Recorrido",
                onPress: () => router.replace("/(tabs)/recorrido"),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          lugar.nombre,
          "Iniciá sesión para guardar esta visita en tu recorrido.",
          [
            {
              text: "Ver lugar",
              onPress: () => router.replace(`/lugar/${lugarId}`),
            },
            {
              text: "Iniciar sesión",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo procesar el código. Intentá de nuevo.", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {procesando
            ? "Verificando código..."
            : "Apunta al código QR del tótem turístico"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  overlay: {
    position: "absolute",
    bottom: 60,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  buttonSecundario: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonSecundarioText: {
    fontWeight: "600",
    fontSize: 14,
  },
});