// src/components/HorariosAtencion.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { agruparHorarios } from "../utils/horarios";

interface Props {
  horarios: any[];
  colors: any;
}

export default function HorariosAtencion({ horarios, colors }: Props) {
  if (!horarios || horarios.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Horarios de Apertura
      </Text>
      <View
        style={[
          styles.horariosContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {agruparHorarios(horarios).map((item, index) => (
          <View key={index} style={styles.horarioRow}>
            <Text style={[styles.horarioDia, { color: colors.textSecondary }]}>
              {item.textoDias}
            </Text>
            <Text style={[styles.horarioHora, { color: colors.text }]}>
              {item.hora}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  horariosContainer: { padding: 10, borderRadius: 8, borderWidth: 1 },
  horarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  horarioDia: { fontSize: 12, fontWeight: "500" },
  horarioHora: { fontSize: 12, fontWeight: "bold" },
});