// src/app/lugar/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { cambiarFavorito, esFavorito } from "../../servicios/favoritos";
import { api } from "../../servicios/api";
import { Lugar } from "../../tipos";

// Componentes modularizados
import CarruselImagenes from "../../components/CarruselImagenes";
import ReproductorAudio from "../../components/ReproductorAudio";
import InfoLugaresBadges from "../../components/InfoLugaresBadges";
import HorariosAtencion from "../../components/HorariosAtencion";

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
        const response = await api.get(`/lugares/${id}`);
        const lugarData = response.data.datos || response.data;
        
        if (lugarData) {
          setLugar(lugarData);
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
      Alert.alert(
        "Iniciá sesión para guardar en favoritos",
        "Podés ver todos los lugares sin cuenta. La cuenta sirve para guardar tus favoritos y tu recorrido.", 
        [
          { text: "Ahora no", style: "cancel"},
          { text: "Iniciar sesión", onPress: () => router.push({ pathname: "/login", params: { redirect: `/lugar/${id}`} })},
        ]
      );
      return;
    }

    if (typeof id === "string") {
      const nuevoEstado = await cambiarFavorito(user, id);
      setEsFav(nuevoEstado);
    }
  }

  function abrirGoogleMaps() {
    if (!lugar || !lugar.coordenadas) return;

    const { latitud: latDestino, longitud: lonDestino } = lugar.coordenadas;
    const latOrigen = -32.21568; 
    const lonOrigen = -58.13649; 

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} bounces={false}>
      
      {/* 1. Carrusel de Imágenes */}
      <CarruselImagenes
        imagenes={lugar.imagenes}
        colors={colors}
        theme={theme}
        onPressBack={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={[styles.categoria, { color: colors.primary }]}>
          {lugar.categoriaId ? lugar.categoriaId.toUpperCase().replace("CAT-", "") : "TURISMO"}
        </Text>

        <View style={styles.filaTitulo}>
          <Text style={[styles.title, { color: colors.text }]}>
            {lugar.nombre}
          </Text>
          <TouchableOpacity onPress={cambiarEstrella} accessibilityLabel={esFav ? "Quitar de favoritos" : "Agregar a favoritos"}>
            <Ionicons name={esFav ? "star" : "star-outline"} size={26} color="#f1c40f" />
          </TouchableOpacity>
        </View>

        <View style={styles.coordenadasContainer}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.coordenadasText, { color: colors.textSecondary }]}>
            {lugar.direccion}
          </Text>
        </View>

        {/* 2. Reproductor de Audioguía moderno con expo-audio */}
        <ReproductorAudio
          audioguia={lugar.audioguia}
          colors={colors}
        />

        {/* Botón Cómo llegar */}
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

        {/* 3. Insignias de información */}
        <InfoLugaresBadges
          precioEntrada={lugar.precioEntrada}
          accesible={lugar.accesible}
          colors={colors}
          theme={theme}
        />

        {/* Contacto */}
        {(lugar.telefono || lugar.sitioWeb) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contacto</Text>
            <View style={styles.contactoInlineContainer}>
              {lugar.telefono && (
                <TouchableOpacity
                  style={[styles.contactoChip, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}
                  onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={[styles.contactoChipText, { color: colors.primary }]}>{lugar.telefono}</Text>
                </TouchableOpacity>
              )}
              {lugar.sitioWeb && (
                <TouchableOpacity
                  style={[styles.contactoChip, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}
                  onPress={() => Linking.openURL(lugar.sitioWeb!)}
                >
                  <Ionicons name="globe-outline" size={16} color="#2980b9" />
                  <Text style={[styles.contactoChipText, { color: "#2980b9" }]}>Sitio Web</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 4. Horarios de Apertura */}
        <HorariosAtencion horarios={lugar.horarios} colors={colors} />

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acerca del lugar</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {lugar.descripcion}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  textoCargando: { marginTop: 10, fontSize: 16 },
  errorText: { fontSize: 16, marginTop: 10, marginBottom: 20 },
  content: { padding: 16 },
  categoria: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4, flex: 1 },
  filaTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  coordenadasContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
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
  mapButtonText: { fontSize: 13, fontWeight: "bold" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 20 },
  contactoInlineContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactoChip: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, gap: 6 },
  contactoChipText: { fontSize: 13, fontWeight: "600" },
  backButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backButtonText: { color: "#fff", fontWeight: "bold" },
});