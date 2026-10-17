// src/app/lugar/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { cambiarFavorito, esFavorito } from "../../servicios/favoritos";
import { obtenerLugares } from "../../servicios/lugares";
import { Lugar } from "../../tipos";
import { agruparHorarios } from "../../utils/horarios";

// Obtenemos el ancho exacto de la pantalla actual
const { width: ANCHO_PANTALLA } = Dimensions.get("window");

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [esFav, setEsFav] = useState<boolean>(false);

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
      if (typeof id === "string" && user) {
        const favorito = await esFavorito(user, id);
        setEsFav(favorito);
      } else {
        setEsFav(false);
      }
    }
    verificarFavorito();
  }, [id, user]);

  async function cambiarEstrella() {
    if (!user) {
      Alert.alert (
        "Iniciá sesión para guardar en favoritos",
        "Podés ver todos los lugares sin cuenta. La cuenta sirve para guardar tus favoritos y tu recorrido.", 
        [
          { text: "Ahora no", style: "cancel"},
          { text: "Iniciar sesión", onPress: () => router.push({ pathname: "/login", params: { redirect: `/lugar/${id}`} })},
        ],
      );
      return;
    }

    if (typeof id === "string") {
      const nuevoEstado = await cambiarFavorito(user, id);
      setEsFav(nuevoEstado);
    }
  }

  // Función para abrir Google Maps indicando origen y destino
  function abrirGoogleMaps() {
    if (!lugar || !lugar.coordenadas) return;

    const { latitud: latDestino, longitud: lonDestino } = lugar.coordenadas;
    
    // Si tienes guardada la ubicación actual (puedes reemplazar estas variables por las reales de tu estado o contexto)
    // Por defecto usaremos el centro de Colón o una coordenada simulada si la tienes accesible.
    const latOrigen = -32.21568; // Reemplaza por tu latitud actual/simulada
    const lonOrigen = -58.13649; // Reemplaza por tu longitud actual/simulada

    const etiquetaDestino = encodeURIComponent(lugar.nombre);

    // URL universal que soporta origen (saddr) y destino (daddr) para trazar ruta
    const url = Platform.select({
      ios: `maps://app?saddr=${latOrigen},${lonOrigen}&daddr=${latDestino},${lonDestino}`,
      android: `https://www.google.com/maps/dir/?api=1&origin=${latOrigen},${lonOrigen}&destination=${latDestino},${lonDestino}&travelmode=driving`,
    });

    const urlWeb = `https://www.google.com/maps/dir/?api=1&origin=${latOrigen},${lonOrigen}&destination=${latDestino},${lonDestino}`;

    Linking.canOpenURL(url!)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Linking.openURL(urlWeb);
        }
      })
      .catch(() => {
        Linking.openURL(urlWeb);
      });
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      bounces={false}
    >
      {/* Sección de Imágenes / Carrusel visual adaptativo a Dark/Light */}
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

        {/* Botón flotante para volver adaptado */}
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

        {/* Botón de Cómo llegar / Google Maps */}
        <TouchableOpacity
          style={[
            styles.mapButton,
            {
              backgroundColor: theme === "dark" ? colors.card : "#e8f4fd",
              borderColor: colors.border,
              borderWidth: theme === "dark" ? 1 : 0,
            },
          ]}
          onPress={abrirGoogleMaps}
        >
          <Ionicons name="navigate-outline" size={18} color="#2980b9" />
          <Text style={[styles.mapButtonText, { color: "#2980b9" }]}>
            Cómo llegar (Abrir en Google Maps)
          </Text>
        </TouchableOpacity>

        {/* Información adicional: Precio, Accesibilidad */}
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

        {/* Contacto en línea horizontal (Teléfono / Sitio Web) */}
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

        {/* Horarios de Atención Agrupados */}
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

        {/* Descripción Detallada */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Acerca del lugar
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {lugar.descripcion}
          </Text>
        </View>

        {/* Botón de Check-in */}
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            alert(`¡Check-in realizado con éxito en ${lugar.nombre}!`)
          }
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.checkinButtonText}>Hacer Check-in aquí</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#f0f0f0",
  },
  imagenLugar: {
    width: ANCHO_PANTALLA,
    height: 200,
    resizeMode: "cover",
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
    marginTop: 4,
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
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: "bold",
  },
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
});