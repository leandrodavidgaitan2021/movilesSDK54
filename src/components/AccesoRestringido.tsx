import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

interface AccesoRestringidoProps {
  subtitulo: string;
}

export default function AccesoRestringido({
  subtitulo,
}: AccesoRestringidoProps) {
  const router = useRouter();
  const pathname = usePathname(); 
  const { colors } = useTheme(); 

  const handleIrAlLogin = () => {
    router.push({
      pathname: "/login",
      params: { redirect: pathname },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons
        name="lock-closed-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.title, { color: colors.text }]}>
        Acceso restringido
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitulo}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleIrAlLogin}
      >
        <Text style={styles.buttonText}>Ir a Iniciar Sesión</Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
