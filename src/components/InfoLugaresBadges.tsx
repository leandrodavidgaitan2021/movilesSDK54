// src/components/InfoLugaresBadges.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  precioEntrada?: number | null;
  accesible?: boolean;
  colors: any;
  theme: string;
}

export default function InfoLugaresBadges({
  precioEntrada,
  accesible,
  colors,
  theme,
}: Props) {
  const esGratis = precioEntrada === 0 || precioEntrada == null;

  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoBadge,
          {
            backgroundColor: theme === "dark" ? colors.card : "#f1f8f5",
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
      >
        <Ionicons name="ticket-outline" size={16} color={colors.primary} />
        <Text style={[styles.infoBadgeText, { color: colors.text }]}>
          {esGratis ? "Entrada Gratuita" : `$${precioEntrada}`}
        </Text>
      </View>

      <View
        style={[
          styles.infoBadge,
          {
            backgroundColor: theme === "dark" ? colors.card : "#f1f8f5",
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
      >
        <Ionicons
          name={accesible ? "accessibility-outline" : "close-circle-outline"}
          size={16}
          color={accesible ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.infoBadgeText, { color: colors.text }]}>
          {accesible ? "Accesible" : "No accesible"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  infoBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  infoBadgeText: { fontSize: 12, fontWeight: "500" },
});