// src/app/(tabs)/agenda.tsx
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useState, useEffect } from "react";
import { obtenerEventos } from "../../servicios/eventos";
// src/app/(tabs)/agenda.tsx

export default function AgendaScreen() {
  const { colors, theme } = useTheme();
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    async function cargar() {
      const datos = await obtenerEventos("2025-11-21");
      setEventos(datos || []);
    }
    cargar();
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
