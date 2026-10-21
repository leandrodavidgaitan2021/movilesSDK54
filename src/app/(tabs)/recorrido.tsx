// src/app/(tabs)/recorrido.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AccesoRestringido from "../../components/AccesoRestringido";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import {
  cantidadLugaresVisitados,
  obtenerVisitasConLugar,
  VisitaConLugar,
} from "../../servicios/visitas";
import { obtenerLugares } from "../../servicios/lugares";

function formatearFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function etiquetaOrigen(origen: string): string {
  switch (origen) {
    case "qr":
      return "QR";
    case "gps":
      return "Cerca";
    case "manual":
      return "Manual";
    default:
      return origen;
  }
}

export default function RecorridoScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { isAuthenticated, cargando: cargandoAuth } = useAuth();

  const [visitas, setVisitas] = useState<VisitaConLugar[]>([]);
  const [totalLugares, setTotalLugares] = useState(0);
  const [distintos, setDistintos] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [lista, lugaresRes, cant] = await Promise.all([
        obtenerVisitasConLugar(),
        obtenerLugares(),
        cantidadLugaresVisitados(),
      ]);
      setVisitas(lista);
      setTotalLugares(lugaresRes.meta.total);
      setDistintos(cant);
    } catch (e) {
      console.error("Error cargando recorrido:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  // Se actualiza cada vez que entrás a la pestaña
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        cargar();
      }
    }, [isAuthenticated, cargar])
  );

  if (cargandoAuth) {
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mi Recorrido</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bitácora de lugares descubiertos en Colón
        </Text>
      </View>

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
            Has visitado {distintos} de {totalLugares || "?"} puntos turísticos
          </Text>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {visitas.length} registro{visitas.length !== 1 ? "s" : ""} en total
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Lugares visitados
        </Text>
        <TouchableOpacity
          style={[styles.btnEscanear, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/escanear")}
        >
          <Ionicons name="qr-code-outline" size={16} color="#fff" />
          <Text style={styles.btnEscanearText}>Escanear QR</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.centradoLista}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : visitas.length === 0 ? (
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
            Escaneá el QR de un cartel, o hacé check-in desde el detalle de un
            lugar.
          </Text>
          <TouchableOpacity
            style={[
              styles.btnEscanearGrande,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/escanear")}
          >
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
            <Text style={styles.btnEscanearText}>Escanear código QR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visitas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
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
              onPress={() => router.push(`/lugar/${item.lugarId}`)}
              activeOpacity={0.7}
            >
              {item.fotoUri ? (
                <Image source={{ uri: item.fotoUri }} style={styles.itemFoto} />
              ) : (
                <View
                  style={[
                    styles.itemIconContainer,
                    {
                      backgroundColor:
                        theme === "dark" ? "#2a2a2a" : "#eef6f1",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={28}
                    color={colors.primary}
                  />
                </View>
              )}

              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.lugar?.nombre ?? item.lugarId}
                </Text>
                <Text
                  style={[styles.itemDate, { color: colors.textSecondary }]}
                >
                  {formatearFecha(item.fechaHora)}
                </Text>
                {item.nota ? (
                  <Text
                    style={[styles.itemNota, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    "{item.nota}"
                  </Text>
                ) : null}
                <View style={styles.badges}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.primary + "22" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {etiquetaOrigen(item.origen)}
                    </Text>
                  </View>
                  {!item.sincronizada && (
                    <View
                      style={[styles.badge, { backgroundColor: "#f39c1222" }]}
                    >
                      <Text style={[styles.badgeText, { color: "#e67e22" }]}>
                        Pendiente sync
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
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
  centradoLista: {
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
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressText: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  btnEscanear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnEscanearGrande: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  btnEscanearText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemFoto: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
  itemNota: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
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