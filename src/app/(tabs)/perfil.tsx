// src/app/(tabs)/perfil.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AccesoRestringido from "../../components/AccesoRestringido";
import { useAuth } from "../../hooks/useAuth"; // <-- Importamos el hook de autenticación global
import { useTheme } from "../../hooks/useTheme"; // <-- Importamos el hook del tema global

export default function PerfilScreen() {
  const { colors, theme } = useTheme();
  const { user, isAuthenticated, cargando, logout } = useAuth(); // <-- Consumimos el contexto global

  if (cargando) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <AccesoRestringido subtitulo="Inicia sesión para ver tu perfil, preferencias y lugares guardados offline." />
    );
  }

  return (
    <View
      style={[styles.containerLogeado, { backgroundColor: colors.background }]}
    >
      <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>
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
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Tus datos offline
        </Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
          Los check-ins de tu recorrido se sincronizarán localmente en este
          dispositivo.
        </Text>
      </View>

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
    padding: 20,
  },
  containerLogeado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  emailText: {
    fontSize: 15,
    marginBottom: 20,
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
