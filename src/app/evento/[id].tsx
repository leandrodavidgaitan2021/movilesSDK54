// src/app/evento/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { obtenerEventoPorId } from "../../servicios/eventos";
import { obtenerLugarPorId } from "../../servicios/lugares";
import CarruselImagenes from "../../components/CarruselImagenes"; // <-- Asegúrate de ajustar la ruta según dónde tengas guardado tu componente

export default function DetalleEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const router = useRouter();

  const [evento, setEvento] = useState<any>(null);
  const [nombreLugar, setNombreLugar] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    async function cargarDetalle() {
      if (!id) return;
      try {
        const datosEvento = await obtenerEventoPorId(id);
        setEvento(datosEvento);

        if (datosEvento?.lugarId) {
          const lugarInfo = await obtenerLugarPorId(datosEvento.lugarId);
          if (lugarInfo?.nombre) {
            setNombreLugar(lugarInfo.nombre);
          }
        }
      } catch (error) {
        console.error("Error al cargar detalle del evento:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [id]);

  const formatearFechaHoraCompleta = (isoString: string) => {
    if (!isoString) return "";
    const fechaObj = new Date(isoString);
    const fechaFormateada = fechaObj.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  };

  if (cargando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.textoCargando, { color: colors.textSecondary }]}>
          Cargando detalle del evento...
        </Text>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <Text style={[styles.textoCargando, { color: colors.text }]}>
          No se encontró información del evento.
        </Text>
        <TouchableOpacity style={[styles.botonVolver, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preparamos las imágenes para el carrusel (si la API devuelve imagenUrl, lo transformamos en array)
  // Nota: Si tu API devuelve una ruta relativa y necesitas concatenarla con la URL base de tu servidor, hazlo aquí (ej: `${API_URL}/${evento.imagenUrl}`)
  const listaImagenes = evento.imagenUrl ? [evento.imagenUrl] : [];

  return (
    <View style={[styles.containerPrincipal, { backgroundColor: colors.background }]}>
      {/* Componente Carrusel de Imágenes con el botón flotante de retroceso integrado */}
      <CarruselImagenes
        imagenes={listaImagenes}
        colors={colors}
        theme={theme}
        onPressBack={() => router.back()}
      />

      <ScrollView style={styles.containerContenido} showsVerticalScrollIndicator={false}>
        {/* Cabecera / Título */}
        <View style={styles.headerContainer}>
          <Text style={[styles.titulo, { color: colors.text }]}>{evento.titulo}</Text>
          
          {evento.estado && evento.estado !== "programado" && (
            <View style={[styles.badgeEstado, { backgroundColor: evento.estado === "cancelado" ? "#d90429" : "#ffb703" }]}>
              <Text style={styles.textoBadge}>{evento.estado.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Información de Fechas */}
        <View style={[styles.seccionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}>
          <View style={styles.rowInfo}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.labelInfo, { color: colors.textSecondary }]}>Inicio</Text>
              <Text style={[styles.valorInfo, { color: colors.text }]}>{formatearFechaHoraCompleta(evento.inicio)}</Text>
            </View>
          </View>

          {evento.fin && (
            <View style={[styles.rowInfo, { marginTop: 12 }]}>
              <Ionicons name="time" size={18} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.labelInfo, { color: colors.textSecondary }]}>Finalización</Text>
                <Text style={[styles.valorInfo, { color: colors.text }]}>{formatearFechaHoraCompleta(evento.fin)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Ubicación */}
        <View style={[styles.seccionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}>
          <View style={styles.rowInfo}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.labelInfo, { color: colors.textSecondary }]}>Ubicación</Text>
              <Text style={[styles.valorInfo, { color: colors.text }]}>
                {evento.direccionLibre || nombreLugar || `Lugar ID: ${evento.lugarId}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Precio de entrada */}
        {evento.precio !== undefined && (
          <View style={[styles.seccionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}>
            <View style={styles.rowInfo}>
              <Ionicons name="ticket" size={18} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.labelInfo, { color: colors.textSecondary }]}>Costo de Entrada</Text>
                <Text style={[styles.valorInfo, { color: colors.primary, fontWeight: "bold" }]}>
                  {evento.precio > 0 ? `$${evento.precio}` : "Entrada Libre y Gratuita"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Descripción Completa */}
        <View style={[styles.seccionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: theme === "dark" ? 1 : 0 }]}>
          <Text style={[styles.tituloSeccion, { color: colors.text }]}>Acerca del evento</Text>
          <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{evento.descripcion}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerPrincipal: {
    flex: 1,
  },
  containerContenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badgeEstado: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  textoBadge: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  seccionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  rowInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelInfo: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  valorInfo: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
  },
  botonVolver: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});