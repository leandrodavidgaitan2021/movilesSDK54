// src/app/lugar/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  TextInput,
} from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { cambiarFavorito, esFavorito } from "../../servicios/favoritos";
import { obtenerLugares } from "../../servicios/lugares";
import { Lugar } from "../../tipos";
import { agruparHorarios } from "../../utils/horarios";
import { useAuth } from "../../hooks/useAuth";
import * as ImagePicker from "expo-image-picker";
import {
  registrarVisita,
  verificarProximidad,
  RADIO_PROXIMIDAD_METROS,
} from "../../servicios/visitas";

// Obtenemos el ancho exacto de la pantalla actual
const { width: ANCHO_PANTALLA } = Dimensions.get("window");

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [esFav, setEsFav] = useState<boolean>(false);
  // --- estados del modal / visita ---
  const [modalVisible, setModalVisible] = useState(false);
  const [nota, setNota] = useState("");
  const [registrando, setRegistrando] = useState(false);
  // --- estados extra (foto + GPS) ---
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [origenElegido, setOrigenElegido] = useState<"manual" | "gps">("manual");
  const [chequeandoGps, setChequeandoGps] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function cargarDetalle() {
      try {
        const respuesta = await obtenerLugares();
        const encontrado = respuesta.datos.find((item) => item.id === id);
        if (encontrado) {
          setLugar(encontrado);
        }
      } catch (error) {
        console.error("Error al cargar el detalle del lugar:", error);
      } finally {
        setCargando(false);
      }
    }
    if (id) {
      cargarDetalle();
    }
  }, [id]);

  useEffect(() => {
    async function verificarFavorito() {
      if (typeof id === "string") {
        const favorito = await esFavorito(id);
        setEsFav(favorito);
      }
    }
    verificarFavorito();
  }, [id]);

  async function cambiarEstrella() {
    if (typeof id === "string") {
      const nuevoEstado = await cambiarFavorito(id);
      setEsFav(nuevoEstado);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.textoCargando, { color: colors.textSecondary }]}>
          Cargando detalle...
        </Text>
      </View>
    );
  }

  if (!lugar) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          No se encontró el lugar solicitado.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function tomarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Sin permiso",
        "Necesitamos la cámara para asociar una foto a la visita."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setFotoUri(result.assets[0].uri);
    }
  }

  async function elegirDeGaleria() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Sin permiso", "Necesitamos acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setFotoUri(result.assets[0].uri);
    }
  }

  async function intentarCheckinGps() {
    if (!lugar) return;
    if (!isAuthenticated) {
      Alert.alert("Iniciá sesión", "Necesitás una cuenta para guardar el recorrido.");
      return;
    }

    setChequeandoGps(true);
    try {
      const resultado = await verificarProximidad(lugar.coordenadas);
      if (resultado === null) {
        Alert.alert(
          "Ubicación no disponible",
          "Activá el GPS o concedé el permiso de ubicación para registrar por proximidad."
        );
        return;
      }
      if (!resultado.cerca) {
        Alert.alert(
          "Todavía lejos",
          `Estás a unos ${resultado.metros} m. Acercate a menos de ${RADIO_PROXIMIDAD_METROS} m para registrar por GPS.`
        );
        return;
      }
      setOrigenElegido("gps");
      setNota("");
      setFotoUri(null);
      setModalVisible(true);
    } finally {
      setChequeandoGps(false);
    }
  }

  function abrirCheckinManual() {
    if (!isAuthenticated) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás una cuenta para guardar el recorrido.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ir a login", onPress: () => router.push("/login") },
        ]
      );
      return;
    }
    setOrigenElegido("manual");
    setNota("");
    setFotoUri(null);
    setModalVisible(true);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      bounces={false}
    >
      {/* Sección de Imágenes / Carrusel visual adaptativo */}
      <View
        style={[
          styles.imagenContainer,
          {
            backgroundColor: theme === "dark" ? colors.card : "#f0f0f0",
          },
        ]}
      >
        {lugar.imagenes && lugar.imagenes.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {lugar.imagenes.map((imagen, index) => (
              <Image
                key={index}
                source={typeof imagen === "string" ? { uri: imagen } : imagen}
                style={styles.imagenLugar}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.imagenPlaceholder,
              {
                backgroundColor: theme === "dark" ? "#1e1e1e" : "#ecf0f1",
              },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={40}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.imagenPlaceholderText,
                { color: colors.textSecondary },
              ]}
            >
              Sin imágenes disponibles
            </Text>
          </View>
        )}

        {/* Botón flotante para volver */}
        <TouchableOpacity
          style={[
            styles.floatingBackButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: theme === "dark" ? 1 : 0,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.categoria, { color: colors.primary }]}>
          {lugar.categoriaId
            ? lugar.categoriaId.toUpperCase().replace("CAT-", "")
            : "TURISMO"}
        </Text>

        <View style={styles.filaTitulo}>
          <Text style={[styles.title, { color: colors.text }]}>
            {lugar.nombre}
          </Text>
          <TouchableOpacity
            onPress={cambiarEstrella}
            accessibilityLabel={
              esFav ? "Quitar de favoritos" : "Agregar a favoritos"
            }
          >
            <Ionicons
              name={esFav ? "star" : "star-outline"}
              size={26}
              color="#f1c40f"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.coordenadasContainer}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.coordenadasText, { color: colors.textSecondary }]}
          >
            {lugar.direccion}
          </Text>
        </View>

        {/* Información adicional */}
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoBadge,
              {
                backgroundColor: theme === "dark" ? colors.card : "#f1f8f5",
                borderColor: colors.border,
                borderWidth: theme === "dark" ? 1 : 0,
              },
            ]}
          >
            <Ionicons name="ticket-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoBadgeText, { color: colors.text }]}>
              {lugar.precioEntrada === 0
                ? "Entrada Gratuita"
                : `$${lugar.precioEntrada}`}
            </Text>
          </View>
          <View
            style={[
              styles.infoBadge,
              {
                backgroundColor: theme === "dark" ? colors.card : "#f1f8f5",
                borderColor: colors.border,
                borderWidth: theme === "dark" ? 1 : 0,
              },
            ]}
          >
            <Ionicons
              name={
                lugar.accesible
                  ? "accessibility-outline"
                  : "close-circle-outline"
              }
              size={16}
              color={lugar.accesible ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.infoBadgeText, { color: colors.text }]}>
              {lugar.accesible ? "Accesible" : "No accesible"}
            </Text>
          </View>
        </View>

        {/* Contacto */}
        {(lugar.telefono || lugar.sitioWeb) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contacto
            </Text>
            <View style={styles.contactoInlineContainer}>
              {lugar.telefono && (
                <TouchableOpacity
                  style={styles.contactoChip}
                  onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={[styles.contactoChipText, { color: colors.primary }]}>
                    {lugar.telefono}
                  </Text>
                </TouchableOpacity>
              )}
              {lugar.sitioWeb && (
                <TouchableOpacity
                  style={styles.contactoChip}
                  onPress={() => Linking.openURL(lugar.sitioWeb!)}
                >
                  <Ionicons name="globe-outline" size={16} color="#2980b9" />
                  <Text style={[styles.contactoChipText, { color: "#2980b9" }]}>
                    Sitio Web
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Horarios */}
        {lugar.horarios && lugar.horarios.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Horarios de Apertura
            </Text>
            <View
              style={[
                styles.horariosContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {agruparHorarios(lugar.horarios).map((item, index) => (
                <View key={index} style={styles.horarioRow}>
                  <Text
                    style={[styles.horarioDia, { color: colors.textSecondary }]}
                  >
                    {item.textoDias}
                  </Text>
                  <Text style={[styles.horarioHora, { color: colors.text }]}>
                    {item.hora}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Acerca del lugar
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {lugar.descripcion}
          </Text>
        </View>

        {/* Botones de Check-in */}
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: colors.primary }]}
          onPress={abrirCheckinManual}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.checkinButtonText}>Registrar visita (manual)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.checkinButton,
            {
              backgroundColor: "transparent",
              borderWidth: 1.5,
              borderColor: colors.primary,
              marginTop: 8,
              opacity: chequeandoGps ? 0.6 : 1,
            },
          ]}
          onPress={intentarCheckinGps}
          disabled={chequeandoGps}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.primary} />
          <Text style={[styles.checkinButtonText, { color: colors.primary }]}>
            {chequeandoGps ? "Comprobando ubicación..." : "Estoy cerca (GPS)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal para nota/foto al registrar visita */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Registrar visita
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {lugar.nombre} · {origenElegido === "gps" ? "Por GPS" : "Manual"}
            </Text>

            {/* Foto */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Foto (opcional)
            </Text>
            {fotoUri ? (
              <View style={{ marginBottom: 10 }}>
                <Image
                  source={{ uri: fotoUri }}
                  style={{ width: "100%", height: 160, borderRadius: 10 }}
                />
                <TouchableOpacity onPress={() => setFotoUri(null)} style={{ marginTop: 6 }}>
                  <Text style={{ color: "#e74c3c", fontWeight: "600" }}>Quitar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.fotoBtn, { borderColor: colors.border }]}
                  onPress={tomarFoto}
                >
                  <Ionicons name="camera-outline" size={22} color={colors.primary} />
                  <Text style={{ color: colors.text, fontSize: 13, marginTop: 4 }}>
                    Cámara
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fotoBtn, { borderColor: colors.border }]}
                  onPress={elegirDeGaleria}
                >
                  <Ionicons name="images-outline" size={22} color={colors.primary} />
                  <Text style={{ color: colors.text, fontSize: 13, marginTop: 4 }}>
                    Galería
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Nota */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Nota (opcional)
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Ej: Hacía 38 grados pero valió la pena"
              placeholderTextColor={colors.textSecondary}
              value={nota}
              onChangeText={setNota}
              multiline
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnSec, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
                disabled={registrando}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnPri,
                  {
                    backgroundColor: colors.primary,
                    opacity: registrando ? 0.6 : 1,
                  },
                ]}
                disabled={registrando}
                onPress={async () => {
                  try {
                    setRegistrando(true);
                    // Actualiza o registra la visita usando la lógica unificada de visitas.ts
                    await registrarVisita({
                      lugarId: lugar.id,
                      origen: origenElegido,
                      nota: nota.trim() || null,
                      fotoUri: fotoUri,
                    });
                    setModalVisible(false);
                    Alert.alert(
                      "¡Guardado!",
                      `Se actualizó la información de ${lugar.nombre} en tu recorrido.`,
                      [
                        {
                          text: "Ver recorrido",
                          onPress: () => router.push("/(tabs)/recorrido"),
                        },
                        { text: "OK" },
                      ]
                    );
                  } catch (e) {
                    console.error(e);
                    Alert.alert("Error", "No se pudo actualizar la visita.");
                  } finally {
                    setRegistrando(false);
                  }
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  {registrando ? "Guardando..." : "Guardar visita"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoCargando: { marginTop: 10, fontSize: 16 },
  errorText: { fontSize: 16, marginTop: 10, marginBottom: 20 },
  imagenContainer: { 
    width: ANCHO_PANTALLA, 
    height: 200, 
    backgroundColor: "#f0f0f0" 
  },
  imagenLugar: { 
    width: ANCHO_PANTALLA, 
    height: 200, 
    resizeMode: "cover" 
  },
  imagenPlaceholder: {
    width: ANCHO_PANTALLA,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  imagenPlaceholderText: { 
    fontSize: 13, 
    marginTop: 4 
  },
  floatingBackButton: {
    position: "absolute",
    top: 35,
    left: 15,
    zIndex: 10,
    padding: 6,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: { padding: 16 },
  categoria: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    flex: 1,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  coordenadasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  coordenadasText: { fontSize: 12, marginLeft: 4 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },
  description: { fontSize: 13, lineHeight: 20 },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  infoBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  infoBadgeText: { fontSize: 12, fontWeight: "500" },
  contactoInlineContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  contactoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
    gap: 6,
  },
  contactoChipText: { fontSize: 13, fontWeight: "600" },
  horariosContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  horarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  horarioDia: { fontSize: 12, fontWeight: "500" },
  horarioHora: { fontSize: 12, fontWeight: "bold" },
  checkinButton: {
    flexDirection: "row",
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
    marginBottom: 20,
  },
  checkinButtonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderWidth: 1,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtnSec: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnPri: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  fotoBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});