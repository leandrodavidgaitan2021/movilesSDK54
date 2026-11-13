// src/app/lugar/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { cambiarFavorito, esFavorito } from "../../servicios/favoritos";
import { obtenerLugarPorId } from "../../servicios/lugares";
import { obtenerVisitas, registrarVisita } from "../../servicios/visitas";
import { Lugar } from "../../tipos";

// Componentes modularizados
import CarruselImagenes from "../../components/CarruselImagenes";
import HorariosAtencion from "../../components/HorariosAtencion";
import InfoLugaresBadges from "../../components/InfoLugaresBadges";
import ReproductorAudio from "../../components/ReproductorAudio";

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const db = useSQLiteContext();
  const { user } = useAuth();
  const { colors, theme } = useTheme();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [esFav, setEsFav] = useState<boolean>(false);

  // Estados para Foto y Nota de la Bitácora
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [nota, setNota] = useState<string>("");
  const [guardandoVisita, setGuardandoVisita] = useState<boolean>(false);
  const [yaVisitado, setYaVisitado] = useState<boolean>(false);

  useEffect(() => {
    async function cargarDetalle() {
      try {
        if (typeof id === "string") {
          const idSanitizado = id.replace(/[)(\s]/g, "").trim().toLowerCase();
          const lugarData = await obtenerLugarPorId(idSanitizado, db);
          if (lugarData) {
            setLugar(lugarData);

            // Verificar si ya existe una visita previa del usuario autenticado
            if (user) {
              const visitas = await obtenerVisitas(db);
              const visitaPrevia = visitas.find(
                (v) =>
                  v.usuarioId === user &&
                  v.lugarId.toLowerCase() === lugarData.id.toLowerCase()
              );

              if (visitaPrevia) {
                setYaVisitado(true);
                if (visitaPrevia.fotoUri) setFotoUri(visitaPrevia.fotoUri);
                if (visitaPrevia.nota) setNota(visitaPrevia.nota);
              }
            }
          }
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
  }, [id, db, user]);

  useEffect(() => {
    async function verificarFavorito() {
      if (lugar?.id && user) {
        const favorito = await esFavorito(user, lugar.id);
        setEsFav(favorito);
      } else {
        setEsFav(false);
      }
    }
    verificarFavorito();
  }, [lugar?.id, user]);

  async function cambiarEstrella() {
    if (!lugar) return;
    if (!user) {
      Alert.alert(
        "Iniciá sesión para guardar en favoritos",
        "Podés ver todos los lugares sin cuenta. La cuenta sirve para guardar tus favoritos y tu recorrido.",
        [
          { text: "Ahora no", style: "cancel" },
          {
            text: "Iniciar sesión",
            onPress: () =>
              router.push({
                pathname: "/login",
                params: { redirect: `/lugar/${lugar.id}` },
              }),
          },
        ]
      );
      return;
    }

    const nuevoEstado = await cambiarFavorito(user, lugar.id);
    setEsFav(nuevoEstado);
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

  // Capturar foto y guardar persistentemente en expo-file-system
  const tomarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se requiere acceso a la cámara para tomar una foto."
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!resultado.canceled && resultado.assets[0].uri) {
        const uriTemporal = resultado.assets[0].uri;

        // Copiar a almacenamiento permanente del dispositivo
        const carpetaFotos = new Directory(Paths.document, "fotos_visitas");
        if (!carpetaFotos.exists) {
          carpetaFotos.create();
        }

        const archivoTemp = new File(uriTemporal);
        const archivoDefinitivo = new File(
          carpetaFotos,
          `visita_${Date.now()}.jpg`
        );
        archivoTemp.copy(archivoDefinitivo);

        setFotoUri(archivoDefinitivo.uri);
      }
    } catch (error) {
      console.error("Error capturando foto:", error);
      Alert.alert("Error", "No se pudo tomar la fotografía.");
    }
  };

  // Guardar o actualizar Visita con Foto y Nota en SQLite sin duplicar el lugar
  const handleGuardarVisitaManual = async () => {
    if (!lugar) return;
    if (!user) {
      Alert.alert(
        "Iniciá sesión para registrar visitas",
        "Podés explorar todos los lugares libremente, pero necesitás tu cuenta para guardar visitas y fotos en Mi Recorrido.",
        [
          { text: "Ahora no", style: "cancel" },
          {
            text: "Iniciar sesión",
            onPress: () =>
              router.push({
                pathname: "/login",
                params: { redirect: `/lugar/${lugar.id}` },
              }),
          },
        ]
      );
      return;
    }

    try {
      setGuardandoVisita(true);

      const resultado = await registrarVisita(
        db,
        user,
        lugar.id,
        "manual",
        fotoUri,
        nota.trim() || null
      );

      setYaVisitado(true);

      Alert.alert(
        resultado.esNueva ? "¡Visita registrada!" : "¡Bitácora actualizada!",
        resultado.esNueva
          ? "El lugar, tu foto y tu nota se han guardado en Mi Recorrido."
          : "Se actualizó la foto y nota de este lugar sin duplicarlo en Mi Recorrido."
      );
    } catch (error) {
      console.error("Error guardando visita:", error);
      Alert.alert("Error", "No se pudo registrar la visita en la base de datos.");
    } finally {
      setGuardandoVisita(false);
    }
  };

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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. Carrusel de Imágenes */}
      <CarruselImagenes
        imagenes={lugar.imagenes}
        colors={colors}
        theme={theme}
        onPressBack={() => router.back()}
      />

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

        {/* 2. Reproductor de Audioguía */}
        <ReproductorAudio audioguia={lugar.audioguia} colors={colors} />

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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contacto
            </Text>
            <View style={styles.contactoInlineContainer}>
              {lugar.telefono && (
                <TouchableOpacity
                  style={[
                    styles.contactoChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: theme === "dark" ? 1 : 0,
                    },
                  ]}
                  onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.contactoChipText, { color: colors.primary }]}
                  >
                    {lugar.telefono}
                  </Text>
                </TouchableOpacity>
              )}
              {lugar.sitioWeb && (
                <TouchableOpacity
                  style={[
                    styles.contactoChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: theme === "dark" ? 1 : 0,
                    },
                  ]}
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

        {/* 4. Horarios de Apertura */}
        <HorariosAtencion horarios={lugar.horarios} colors={colors} />

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Acerca del lugar
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {lugar.descripcion}
          </Text>
        </View>

        {/* 5. SECCIÓN BITÁCORA: Foto y Nota Personalizada de la Visita */}
        <View
          style={[
            styles.cardRegistro,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: theme === "dark" ? 1 : 0,
            },
          ]}
        >
          <Text style={[styles.cardTitulo, { color: colors.text }]}>
            {yaVisitado
              ? "Bitácora de este lugar (Ya en tu recorrido)"
              : "Bitácora personal de la visita"}
          </Text>

          {/* Botón Tomar Foto */}
          <TouchableOpacity
            style={[
              styles.btnFoto,
              {
                backgroundColor: theme === "dark" ? "#1e3a29" : "#e8f8f0",
              },
            ]}
            onPress={tomarFoto}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={[styles.btnFotoTexto, { color: colors.primary }]}>
              {fotoUri ? "Tomar nueva foto" : "Tomar foto en este lugar"}
            </Text>
          </TouchableOpacity>

          {/* Previsualización de Foto Tomada */}
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
          ) : null}

          {/* Campo para Escribir Nota Corta */}
          <TextInput
            style={[
              styles.inputNota,
              {
                backgroundColor: theme === "dark" ? "#2a2a2a" : "#fafafa",
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Escribe una nota corta sobre tu visita..."
            placeholderTextColor={colors.textSecondary}
            value={nota}
            onChangeText={setNota}
            maxLength={200}
            multiline
          />

          {/* Botón Guardar en Mi Recorrido */}
          <TouchableOpacity
            style={[
              styles.btnGuardar,
              { backgroundColor: colors.primary },
              guardandoVisita && { opacity: 0.7 },
            ]}
            onPress={handleGuardarVisitaManual}
            disabled={guardandoVisita}
          >
            <Ionicons name="bookmark-outline" size={18} color="#fff" />
            <Text style={styles.btnGuardarTexto}>
              {guardandoVisita
                ? "Guardando..."
                : yaVisitado
                ? "Actualizar foto y nota"
                : "Registrar en Mi Recorrido"}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: { padding: 16 },
  categoria: { fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4, flex: 1 },
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
  mapButtonText: { fontSize: 13, fontWeight: "bold" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 20 },
  contactoInlineContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  contactoChipText: { fontSize: 13, fontWeight: "600" },
  backButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backButtonText: { color: "#fff", fontWeight: "bold" },

  // Estilos de la Bitácora (Foto + Nota)
  cardRegistro: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitulo: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  btnFoto: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  btnFotoTexto: { fontWeight: "600", fontSize: 14 },
  fotoPreview: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12 },
  inputNota: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  btnGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  btnGuardarTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});