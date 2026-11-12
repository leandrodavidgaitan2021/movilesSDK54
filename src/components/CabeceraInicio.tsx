// src/components/CabeceraInicio.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// 1. Define la interfaz de las propiedades que recibe el componente
interface Props {
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
  theme: string;
}

// 2. Desestructura props tipadas correctamente
export default function CabeceraInicio({ colors, theme }: Props) {
  const router = useRouter();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Colon - Secretaria de Turismo
      </Text>
      <TouchableOpacity
        style={[
          styles.qrButton,
          { backgroundColor: theme === "dark" ? "#2c2c2c" : "#f0f0f0" },
        ]}
        onPress={() => router.push("/escanear")}
      >
        <Ionicons name="qr-code-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  qrButton: { padding: 6, borderRadius: 8 },
});