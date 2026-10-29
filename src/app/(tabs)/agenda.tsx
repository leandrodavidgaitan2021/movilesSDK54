// src/app/(tabs)/agenda.tsx
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const EVENTOS_COLON = [
  {
    id: "1",
    titulo: "Atardecer y Música en la Costanera",
    fecha: "21 de Noviembre",
    hora: "18:30 hs",
    lugar: "Playa Norte / Costanera de Colón",
    descripcion:
      "Disfrutá del atardecer sobre el Río Uruguay con DJs en vivo, foodtrucks y actividades al aire libre para inaugurar el fin de semana largo.",
  },
  {
    id: "2",
    titulo: "Noche de Bienestar y Relax en Termas",
    fecha: "22 de Noviembre",
    hora: "19:00 hs",
    lugar: "Complejo Termal Colón",
    descripcion:
      "Jornada nocturna especial con circuito de piscinas termales, masajes al aire libre y propuestas gastronómicas saludables.",
  },
  {
    id: "3",
    titulo: "Feria de Sabores Entrerrianos",
    fecha: "28 y 29 de Noviembre",
    hora: "12:00 hs",
    lugar: "Plaza San Martín",
    descripcion:
      "Patios gastronómicos, degustación de vinos de bodegas regionales y cervecerías artesanales locales.",
  },
  {
    id: "4",
    titulo: "Senderismo Fotográfico al Atardecer",
    fecha: "05 de Diciembre",
    hora: "17:30 hs",
    lugar: "Parque Nacional El Palmar",
    descripcion:
      "Recorrido guiado por los senderos de palmeras y arroyos para avistaje de fauna y fotografía de paisajes.",
  },
  {
    id: "5",
    titulo: "Paseo Náutico e Historia del Río",
    fecha: "12 de Diciembre",
    hora: "10:30 hs",
    lugar: "Puerto de Colón",
    descripcion:
      "Excursión guiada en embarcación por las islas del Río Uruguay y relato de la historia portuaria local.",
  },
  {
    id: "6",
    titulo: "Fiesta Nacional de la Artesanía",
    fecha: "14 de Febrero",
    hora: "20:00 hs",
    lugar: "Predio Ex Metalúrgica",
    descripcion:
      "El evento cultural más importante de la región con exposición de artesanos de todo el país y shows musicales en vivo.",
  },
];

export default function AgendaScreen() {
  const { colors, theme } = useTheme();
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("http://192.168.100.6:3000/eventos")
      .then((res) => res.json())
      .then((data) => {
        setEventos(data.datos || data);
        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al cargar eventos:", error);
        setCargando(false);
      });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          📅 Agenda Cultural y Turística
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Colón, Entre Ríos (Próximos Eventos)
        </Text>
      </View>

      {/* Lista de Eventos */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.eventCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: theme === "dark" ? 1 : 0,
              },
            ]}
          >
            {/* Fila Fecha, Hora y Marcador */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.eventFechaContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.eventFecha, { color: colors.primary }]}>
                  {item.fecha} - ⏰ {item.hora}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Título del evento */}
            <Text style={[styles.eventTitulo, { color: colors.text }]}>
              {item.titulo}
            </Text>

            {/* Ubicación */}
            <View style={styles.eventLocationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.eventLugar, { color: colors.textSecondary }]}
              >
                {item.lugar}
              </Text>
            </View>

            {/* Descripción */}
            <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>
              {item.descripcion}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0a9396",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventFechaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventFecha: {
    fontSize: 13,
    fontWeight: "600",
  },
  eventTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  eventLugar: {
    fontSize: 13,
    fontWeight: "500",
  },
  eventDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
