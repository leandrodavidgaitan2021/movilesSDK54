// src/app/(tabs)/agenda.tsx
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme"; // <-- Importamos el hook del tema global

const eventosLocales = [
  {
    id: "evt-001",
    titulo: "Fiesta Nacional de la Artesanía",
    fecha: "Febrero (Próximamente)",
    lugar: "Predio Ferial - Costanera",
    descripcion:
      "El evento cultural y artesanal más importante de la región con artistas en vivo.",
  },
  {
    id: "evt-002",
    titulo: "Encuentro de Motos Colón",
    fecha: "Marzo (Próximamente)",
    lugar: "Polideportivo Municipal",
    descripcion:
      "Reunión de motociclistas de todo el país con caravanas y shows de rock.",
  },
  {
    id: "evt-003",
    titulo: "Feria de Sabores Entrerrianos",
    fecha: "Fin de semana largo",
    lugar: "Plaza San Martín",
    descripcion:
      "Patios gastronómicos, degustación de vinos regionales y cervecerías artesanales.",
  },
];

export default function AgendaScreen() {
  const { colors, theme } = useTheme(); // <-- Extraemos los colores y el tema actual

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Agenda de Eventos
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Próximas fiestas y actividades culturales en Colón
        </Text>
      </View>

      {/* Lista de Eventos */}
      <FlatList
        data={eventosLocales}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
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
            <View style={styles.eventHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.eventFecha, { color: colors.primary }]}>
                {item.fecha}
              </Text>
            </View>
            <Text style={[styles.eventTitulo, { color: colors.text }]}>
              {item.titulo}
            </Text>
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
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  eventFecha: {
    fontSize: 12,
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
