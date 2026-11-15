// src/app/(tabs)/perfil.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import AccesoRestringido from "../../components/AccesoRestringido";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useLoginBiometrico } from "../../hooks/useLoginBiometrico";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { obtenerCategorias } from "../../servicios/lugares";
import {
  actualizarCategoriasFavoritas,
  extraerCategoriasFavoritas,
  obtenerMiPerfil,
  PerfilUsuario,
} from "../../servicios/usuario";
import { Categoria } from "../../tipos";

export default function PerfilScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user, cargando, token, logout } = useAuth();
  const { sensor, activa, activar, desactivar } = useLoginBiometrico();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [favoritasIds, setFavoritasIds] = useState<string[]>([]);
  const [cargandoPerfil, setCargandoPerfil] = useState<boolean>(false);
  const [guardandoPrefs, setGuardandoPrefs] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setPerfil(null);
      setFavoritasIds([]);
      return;
    }

    async function cargarDatosCuenta() {
      setCargandoPerfil(true);
      try {
        const [datosPerfil, listaCategorias] = await Promise.all([
          obtenerMiPerfil(),
          obtenerCategorias(),
        ]);
        setPerfil(datosPerfil);
        setCategorias(listaCategorias);
        setFavoritasIds(extraerCategoriasFavoritas(datosPerfil));
      } catch (error) {
        console.warn("No se pudieron cargar los datos completos del perfil:", error);
      } finally {
        setCargandoPerfil(false);
      }
    }

    cargarDatosCuenta();
  }, [user]);

  async function alternarCategoria(categoriaId: string) {
    if (guardandoPrefs) return;

    const anteriores = favoritasIds;
    const nuevas = anteriores.includes(categoriaId)
      ? anteriores.filter((id) => id !== categoriaId)
      : [...anteriores, categoriaId];

    setFavoritasIds(nuevas);
    setGuardandoPrefs(true);

    try {
      const perfilActualizado = await actualizarCategoriasFavoritas(perfil, nuevas);
      setPerfil(perfilActualizado);
    } catch (error) {
      setFavoritasIds(anteriores);
      Alert.alert(
        "No se pudo actualizar",
        "Verificá tu conexión a internet para guardar tus categorías favoritas.",
      );
    } finally {
      setGuardandoPrefs(false);
    }
  }

  if (cargando) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <AccesoRestringido subtitulo="Inicia sesión para ver tu perfil, preferencias y lugares guardados offline." />
    );
  }

  return (
    <View
      style={[styles.containerLogeado, { backgroundColor: colors.background }]}
    >
      <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>{perfil?.nombre || "Mi Perfil"}</Text>
      <Text style={[styles.emailText, { color: colors.textSecondary }]}>
        {user}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
      >
      <View style={styles.filaHeaderCard}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Categorías favoritas
        </Text>
        {(cargandoPerfil || guardandoPrefs) && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
      <Text style={[styles.cardDesc, { color: colors.textSecondary, marginBottom: 10 }]}>
        Elegí qué tipo de lugares te interesan más en Colón.
      </Text>

      {categorias.length > 0 ? (
        <View style={styles.chipsContainer}>
            {categorias.map((cat) => {
              const seleccionada = favoritasIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => alternarCategoria(cat.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: seleccionada ? colors.primary : colors.background,
                      borderColor: seleccionada ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={seleccionada ? "checkmark-circle" : "add-circle-outline"}
                    size={16}
                    color={seleccionada ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: seleccionada ? "#fff" : colors.text },
                    ]}
                  >
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Conectate a internet para ver y editar tus categorías.
          </Text>
        )}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Tus datos offline
        </Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Los check-ins de tu recorrido se sincronizarán localmente en este
          dispositivo.
        </Text>
      </View>

      { sensor && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: theme === "dark" ? 1 : 0,
            },
          ]}
      >
        <View style={styles.filaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Ingreso con biometría
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Entrá sin escribir tu contraseña.
            </Text>
          </View>
          <Switch
            value={activa}
            onValueChange={(valor) => {
              if (valor && user && token) activar(user, token);
              else if (!valor) desactivar();
            }}
          />
        </View>
      </View>
    )}

      <TouchableOpacity
        style={styles.favoritosButton}
        onPress={() => router.push("/favoritos")}
      >
        <Ionicons name="star-outline" size={18} color="#27ae60" />
        <Text style={styles.favoritosButtonText}>Ver mis favoritos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  containerLogeado: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold",
    marginTop: 15, 
    textAlign: "center" 
  },
  emailText: { 
    fontSize: 15, 
    marginBottom: 20 
  },
  card: {
    width: "100%", 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 25, 
    elevation: 2 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 5 
  },
  cardDesc: { 
    fontSize: 13 
  },
  filaSwitch: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  favoritosButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "#e8f8f0", 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  favoritosButtonText: { 
    color: "#27ae60", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  logoutButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 8 
  },
  logoutText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  filaHeaderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
