// src/app/(tabs)/recorrido.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AccesoRestringido from "../../components/AccesoRestringido";
import { useAuth } from "../../hooks/useAuth"; // <-- Importamos el hook de autenticación global
import { useTheme } from "../../hooks/useTheme"; // <-- Importamos el hook del tema global

const lugaresVisitados = [
  {
    id: "lug-001",
    nombre: "Termas Colón",
    fechaCheckin: "11 de Septiembre, 2026",
    categoriaId: "cat-termas",
  },
  {
    id: "lug-002",
    nombre: "Playa Norte",
    fechaCheckin: "12 de Septiembre, 2026",
    categoriaId: "cat-playas",
  },
];

export default function RecorridoScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { isAuthenticated, cargando } = useAuth(); // <-- Usamos el hook useAuth para la sesión y el estado de carga

  if (cargando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccesoRestringido subtitulo="Inicia sesión para ver tu bitácora de viaje, progreso y lugares visitados en Colón." />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera de la sección */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mi Recorrido</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bitácora de lugares descubiertos en Colón
        </Text>
      </View>

      {/* Tarjeta de Progreso / Resumen */}
      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
      >
        <Ionicons name="trophy-outline" size={32} color={colors.primary} />
        <View style={styles.progressInfo}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Progreso de viaje
          </Text>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Has visitado {lugaresVisitados.length} de 15 puntos turísticos
          </Text>
        </View>
      </View>

      {/* Lista de lugares visitados / check-ins */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Lugares visitados (Check-in)
      </Text>

      {lugaresVisitados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="compass-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Aún no has registrado ningún lugar.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Usa el botón de QR en el inicio para escanear tótems en la ciudad.
          </Text>
        </View>
      ) : (
        <FlatList
          data={lugaresVisitados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: theme === "dark" ? 1 : 0,
                },
              ]}
              //onPress={() => router.push(`/lugar/${item.id}`)}
            >
              <View style={styles.itemIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.nombre}
                </Text>
                <Text
                  style={[styles.itemDate, { color: colors.textSecondary }]}
                >
                  Registrado el {item.fechaCheckin}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  progressCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressInfo: {
    marginLeft: 15,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressText: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIconContainer: {
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
    marginTop: 5,
  },
});
