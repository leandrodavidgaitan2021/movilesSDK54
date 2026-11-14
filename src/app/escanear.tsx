// src/app/escanear.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  // Recibimos el parámetro 'modo' pasada por la URL (por defecto será 'visita')
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const esModoVer = modo === "ver";

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
      // Validamos si el lugar existe en la base de datos local
      const lugarData = await obtenerLugarPorId(lugarId, db);
      const nombreLugar = lugarData?.nombre ?? lugarId;

      if (!lugarData) {
        Alert.alert(
          "Lugar no encontrado",
          "El código QR es válido pero el lugar no está registrado en la base de datos.",
          [{ text: "Reintentar", onPress: () => setScanned(false) }]
        );
        return;
      }

      // --- CASO A: ESCANEAR PARA VER LA FICHA DEL LUGAR ---
      if (esModoVer) {
        router.replace(`/lugar/${lugarId}`);
        return;
      }

      // --- CASO B: ESCANEAR PARA REGISTRAR VISITA (EN RECORRIDO) ---
      const usuarioIdActual = typeof user === "string" ? user : "usr-201";

      const resultado = await registrarVisita(
        db,
        usuarioIdActual,
        lugarId,
        "qr",
        null,
        null
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
      console.error("Error crítico al procesar el código QR:", error);
      Alert.alert("Error", "No se pudo procesar la información del código QR.");
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

      {/* Indicador visual del modo activo */}
      <View style={styles.overlay}>
        <Ionicons
          name={esModoVer ? "eye-outline" : "qr-code-outline"}
          size={18}
          color="#fff"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.overlayText}>
          {esModoVer
            ? "Modo: Escanear para ver Ficha"
            : "Modo: Escanear para Registrar Visita"}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  overlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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