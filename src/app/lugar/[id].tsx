// src/app/lugar/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme"; // <-- Importamos el hook del tema global
import { cambiarFavorito, esFavorito } from "../../servicios/favoritos";
import { obtenerLugares } from "../../servicios/lugares";
import { Lugar } from "../../tipos";

// Diccionario auxiliar para mostrar los días de la semana de forma legible
const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme(); // <-- Extraemos los colores y el tema actual

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      bounces={false}
    >
      {/* Sección de Imágenes / Carrusel visual */}
      <View
        style={[
          styles.imagenContainer,
          {
            backgroundColor:
              theme === "dark"
                ? colors.card
                : styles.imagenContainer.backgroundColor,
          },
        ]}
      >
        {lugar.imagenes && lugar.imagenes.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {lugar.imagenes.map((imgUrl, index) => (
              <Image
                key={index}
                source={{ uri: imgUrl }}
                style={styles.imagenLugar}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.imagenPlaceholder,
              {
                backgroundColor:
                  theme === "dark"
                    ? "#1e1e1e"
                    : styles.imagenPlaceholder.backgroundColor,
              },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={48}
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
              shadowColor: theme === "dark" ? "#000" : "#000",
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
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

        {/* Información adicional: Precio, Accesibilidad, Teléfono */}
        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoBadge,
              {
                backgroundColor:
                  theme === "dark"
                    ? colors.card
                    : styles.infoBadge.backgroundColor,
                borderColor: colors.border,
                borderWidth: theme === "dark" ? 1 : 0,
              },
            ]}
          >
            <Ionicons name="ticket-outline" size={18} color={colors.primary} />
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
                backgroundColor:
                  theme === "dark"
                    ? colors.card
                    : styles.infoBadge.backgroundColor,
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
              size={18}
              color={lugar.accesible ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.infoBadgeText, { color: colors.text }]}>
              {lugar.accesible ? "Accesible" : "No accesible"}
            </Text>
          </View>
        </View>

        {/* Contacto (Teléfono / Sitio Web) */}
        {(lugar.telefono || lugar.sitioWeb) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contacto
            </Text>
            {lugar.telefono && (
              <TouchableOpacity
                style={styles.contactoRow}
                onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.contactoLinkText, { color: colors.primary }]}
                >
                  {lugar.telefono}
                </Text>
              </TouchableOpacity>
            )}
            {lugar.sitioWeb && (
              <TouchableOpacity
                style={styles.contactoRow}
                onPress={() => Linking.openURL(lugar.sitioWeb!)}
              >
                <Ionicons name="globe-outline" size={18} color="#2980b9" />
                <Text style={[styles.contactoLinkText, { color: "#2980b9" }]}>
                  {lugar.sitioWeb}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Horarios de Atención */}
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
              {lugar.horarios.map((h, index) => (
                <View key={index} style={styles.horarioRow}>
                  <Text
                    style={[styles.horarioDia, { color: colors.textSecondary }]}
                  >
                    {DIAS_SEMANA[h.dia] ?? "Día"}
                  </Text>
                  <Text style={[styles.horarioHora, { color: colors.text }]}>
                    {h.abre} a {h.cierra} hs
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
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
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
  imagenContainer: { width: "100%", height: 250, backgroundColor: "#f0f0f0" },
  imagenLugar: { width: 400, height: 250, resizeMode: "cover" },
  imagenPlaceholder: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  imagenPlaceholderText: { fontSize: 14, marginTop: 5 },
  floatingBackButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: { padding: 20 },
  categoria: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    flex: 1,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  coordenadasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  coordenadasText: { fontSize: 13, marginLeft: 5 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: { fontSize: 14, lineHeight: 22 },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f8f5",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  infoBadgeText: { fontSize: 13, fontWeight: "500" },
  contactoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  contactoLinkText: { fontSize: 14, fontWeight: "600" },
  horariosContainer: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  horarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  horarioDia: { fontSize: 13, fontWeight: "500" },
  horarioHora: { fontSize: 13, fontWeight: "bold" },
  checkinButton: {
    flexDirection: "row",
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  checkinButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: { color: "#fff", fontWeight: "bold" },
});
