// src/app/escanear.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { obtenerLugarPorId } from "../servicios/lugares";
import { registrarVisita } from "../servicios/visitas";

export default function EscanearScreen() {
  const db = useSQLiteContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Si los permisos aún se están cargando
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.text }]}>
          Cargando permisos de la cámara...
        </Text>
      </View>
    );
  }

  // Si el permiso no ha sido concedido
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
    if (scanned) return; // Evita múltiples escaneos continuos
    setScanned(true);

    // 1. Limpiamos espacios en blanco y llevamos a mayúsculas
    const dataLimpia = data ? data.trim().toUpperCase() : "";

    // 2. Validación anti-crash
    if (!dataLimpia.startsWith("COLON:")) {
      Alert.alert(
        "Código QR no válido",
        "El código escaneado no pertenece a los carteles turísticos oficiales de Colón.",
        [
          {
            text: "Reintentar",
            onPress: () => setScanned(false),
          },
        ]
      );
      return;
    }

    // Extraer el id del lugar (ejemplo: "COLON:LUG-004" -> "lug-004")
    const lugarId = dataLimpia.replace("COLON:", "").trim().toLowerCase();

    try {
      // Buscamos el nombre del lugar para mostrarlo en el cartel
      const lugarData = await obtenerLugarPorId(lugarId, db);
      const nombreLugar = lugarData?.nombre ?? lugarId;
      const usuarioIdActual = typeof user === "string" ? user : "usr-201";

      // 3. Registrar o actualizar visita en SQLite sin duplicar
      const resultado = await registrarVisita(
        db,
        usuarioIdActual,
        lugarId,
        "qr",
        null,
        null // Conservar foto o nota previa si ya existía
      );

      Alert.alert(
        resultado.esNueva ? "¡Lugar registrado!" : "Lugar ya en tu recorrido",
        resultado.esNueva
          ? `Has agregado ${nombreLugar} a tu bitácora. ¿Deseas agregarle una foto ahora?`
          : `${nombreLugar} ya estaba en tu recorrido. Se actualizó la fecha y puedes cargarle nuevas fotos desde su ficha.`,
        [
          {
            text: "CERRAR",
            style: "cancel",
            onPress: () => router.replace("/(tabs)/recorrido"),
          },
          {
            text: "IR A CARGAR FOTO",
            onPress: () => router.replace(`/lugar/${lugarId}`),
          },
        ]
      );
    } catch (error) {
      console.error("Error crítico al guardar la visita en SQLite:", error);
      Alert.alert("Error", "No se pudo guardar la visita en la base de datos.");
      setScanned(false);
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

      {/* Botón flotante para cerrar o volver */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Apunta al código QR del tótem turístico
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