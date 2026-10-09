// src/app/escanear.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function EscanearScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const router = useRouter();
  const { colors } = useTheme();

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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Redirige directamente a la pantalla de detalle del lugar con el ID escaneado
    router.replace(`/lugar/${data}`);
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // Limitado estrictamente a códigos QR
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
