// src/app/(tabs)/recorrido.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNetworkState } from "expo-network";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AccesoRestringido from "../../components/AccesoRestringido";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { obtenerLugares } from "../../servicios/lugares";
import {
  cantidadLugaresVisitados,
  obtenerVisitasConLugar,
  registrarVisita,
  sincronizarColaVisitas,
  VisitaConLugar,
} from "../../servicios/visitas";
import { Lugar } from "../../tipos";

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
  const db = useSQLiteContext();
  const networkState = useNetworkState();
  const { colors, theme } = useTheme();
  const { isAuthenticated, cargando: cargandoAuth } = useAuth();

  const [visitas, setVisitas] = useState<VisitaConLugar[]>([]);
  const [lugaresDisponibles, setLugaresDisponibles] = useState<Lugar[]>([]);
  const [totalLugares, setTotalLugares] = useState<number>(0);
  const [distintos, setDistintos] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [sincronizando, setSincronizando] = useState<boolean>(false);

  // Estado para controlar la visibilidad del modal de selección manual
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Recargar los datos desde SQLite al enfocar la pantalla
  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      // 1. Si hay conexión y sesión, intentamos sincronizar pendientes primero
      if (isAuthenticated) {
        await sincronizarColaVisitas(db);
      }

      // 2. Leemos la lista actualizada desde SQLite
      const [lista, cant] = await Promise.all([
        obtenerVisitasConLugar(db),
        cantidadLugaresVisitados(db),
      ]);
      setVisitas(lista);
      setDistintos(cant);

      try {
        const lugaresRes = await obtenerLugares(db);
        setLugaresDisponibles(lugaresRes.datos);
        setTotalLugares(lugaresRes.meta.total);
      } catch (errLugares) {
        console.warn("No se pudieron actualizar lugares (usando caché):", errLugares);
      }
    } catch (e) {
      console.error("Error cargando recorrido desde SQLite:", e);
    } finally {
      setCargando(false);
    }
  }, [db, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        cargar();
      } else {
        setCargando(false);
      }
    }, [isAuthenticated, cargar])
  );

  // Sincroniza automáticamente cuando vuelve Internet, cuando volvés a la app,
  // o cada 8 segundos si quedó alguna visita en "Pendiente sync"
  useEffect(() => {
    if (!isAuthenticated) return;

    const intentarSincronizar = async () => {
      if (sincronizando) return;
      try {
        setSincronizando(true);
        const procesadas = await sincronizarColaVisitas(db);
        if (procesadas > 0) {
          const [lista, cant] = await Promise.all([
            obtenerVisitasConLugar(db),
            cantidadLugaresVisitados(db),
          ]);
          setVisitas(lista);
          setDistintos(cant);
        }
      } catch (error) {
        console.warn("Error en sincronización automática:", error);
      } finally {
        setSincronizando(false);
      }
    };

    // 1. Disparo inmediato si cambió la red
    if (networkState.isInternetReachable) {
      intentarSincronizar();
    }

    // 2. Disparo al volver a primer plano desde el panel de Wi-Fi/Modo Avión del celular
    const subAppState = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        intentarSincronizar();
      }
    });

    // 3. Reintento automático cada 8 segundos SOLO si hay pendientes en pantalla
    const hayPendientes = visitas.some((v) => !v.sincronizada);
    const intervalo = hayPendientes
      ? setInterval(intentarSincronizar, 8000)
      : null;

    return () => {
      subAppState.remove();
      if (intervalo) clearInterval(intervalo);
    };
  }, [networkState.isInternetReachable, isAuthenticated, db, visitas]);

  // Guardar o actualizar visita manual en SQLite sin duplicar
  const handleRegistroManual = async (lugarId: string, nombreLugar: string) => {
    try {
      const resultado = await registrarVisita(
        db,
        "usr-201",
        lugarId,
        "manual",
        null,
        null
      );

      setModalVisible(false);
      cargar();

      Alert.alert(
        resultado.esNueva ? "¡Lugar registrado!" : "Lugar ya en tu recorrido",
        resultado.esNueva
          ? `Has agregado ${nombreLugar} a tu bitácora. ¿Deseas agregarle una foto ahora?`
          : `${nombreLugar} ya estaba en tu recorrido. Se actualizó la fecha y puedes cargarle nuevas fotos desde su ficha.`,
        [
          { text: "Cerrar", style: "cancel" },
          {
            text: "Ir a cargar foto",
            onPress: () => router.push(`/lugar/${lugarId}`),
          },
        ]
      );
    } catch (error) {
      console.error("Error al registrar visita manual:", error);
      Alert.alert("Error", "No se pudo registrar la visita en la base de datos.");
    }
  };

  // 1. Primero esperamos solo a que verifique si hay sesión guardada
  if (cargandoAuth) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 2. Si NO está logueado, cortamos acá y mostramos Acceso Restringido
  if (!isAuthenticated) {
    return (
      <AccesoRestringido subtitulo="Inicia sesión para ver tu bitácora de viaje, progreso y lugares visitados en Colón." />
    );
  }

  // 3. Si está logueado, mostramos el spinner mientras lee SQLite
  if (cargando && visitas.length === 0) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mi Recorrido</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bitácora de lugares descubiertos en Colón
        </Text>
      </View>

      {/* Tarjeta de Progreso */}
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

      {/* Encabezado de la Lista de Visitas */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Lugares visitados
        </Text>

        <View style={styles.botonesAccionHeader}>
          <TouchableOpacity
            style={[styles.btnEscanear, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/escanear")}
          >
            <Ionicons name="qr-code-outline" size={16} color="#fff" />
            <Text style={styles.btnEscanearText}>QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnManualHeader,
              { borderColor: colors.primary, backgroundColor: colors.card },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.btnManualHeaderText, { color: colors.primary }]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estado vacío o Renderizado de Lista */}
      {visitas.length === 0 ? (
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
            Escaneá el QR de un cartel o seleccionalo manualmente.
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              style={[
                styles.btnEscanearGrande,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push("/escanear")}
            >
              <Ionicons name="qr-code-outline" size={18} color="#fff" />
              <Text style={styles.btnEscanearText}>Escanear QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnEscanearGrande,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.btnEscanearText, { color: colors.primary }]}>
                Ingreso Manual
              </Text>
            </TouchableOpacity>
          </View>
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
                  {item.lugar?.nombre ?? `Lugar ID: ${item.lugarId}`}
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

                {/* Insignias de Origen y Estado Offline/Sync */}
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
                  {!item.sincronizada ? (
                    <View
                      style={[styles.badge, { backgroundColor: "#f39c1222" }]}
                    >
                      <Text style={[styles.badgeText, { color: "#e67e22" }]}>
                        Pendiente sync
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[styles.badge, { backgroundColor: "#27ae6022" }]}
                    >
                      <Text style={[styles.badgeText, { color: "#27ae60" }]}>
                        Sincronizado
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

      {/* Modal de Selección Manual de Lugares */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>
              Seleccioná el lugar visitado
            </Text>

            <FlatList
              data={lugaresDisponibles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemLugarModal, { borderBottomColor: colors.border }]}
                  onPress={() => handleRegistroManual(item.id, item.nombre)}
                >
                  <Text style={[styles.textoLugarModal, { color: colors.text }]}>
                    {item.nombre}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.btnCerrarModal}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoCerrar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  botonesAccionHeader: {
    flexDirection: "row",
    gap: 8,
  },
  btnEscanear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  btnManualHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnEscanearText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  btnManualHeaderText: {
    fontWeight: "600",
    fontSize: 13,
  },
  btnEscanearGrande: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
    textAlign: "center",
  },
  itemLugarModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  textoLugarModal: {
    fontSize: 15,
    fontWeight: "500",
  },
  btnCerrarModal: {
    marginTop: 16,
    alignSelf: "center",
  },
  textoCerrar: {
    color: "crimson",
    fontWeight: "bold",
    fontSize: 15,
  },
});