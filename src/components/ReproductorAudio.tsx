// src/components/ReproductorAudio.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

interface Props {
  audioguia?: {
    url?: string;
    duracionSegundos?: number;
  } | null;
  colors: any;
}

export default function ReproductorAudio({ audioguia, colors }: Props) {
  if (!audioguia || !audioguia.url) return null;

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.10:3000";

  const audioUrl = audioguia.url.startsWith("http")
    ? audioguia.url
    : `${apiBaseUrl}${audioguia.url.startsWith("/") ? "" : "/"}${audioguia.url}`;

  // Pasamos la URL como objeto { uri } y configuramos el updateInterval
  /*
  const player = useAudioPlayer({ uri: audioUrl }, {
    downloadFirst: true,
    updateInterval: 500, // Actualiza el estado cada medio segundo
  });
*/
const player = useAudioPlayer({ uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, {
  downloadFirst: true,
  updateInterval: 500,
});

  const status = useAudioPlayerStatus(player);

  const estaReproduciendo = status.playing;
  
  // ⚠️ EN EXPO-AUDIO LOS TIEMPOS VIENEN EN SEGUNDOS DIRECTAMENTE (NO EN MILISEGUNDOS)
  const posicionAudio = Math.floor(status.currentTime || 0);
  const duracionAudio = Math.floor(status.duration || 0) || audioguia.duracionSegundos || 0;

  const toggleReproduccionAudio = () => {
    if (!player) return;

    if (estaReproduciendo) {
      player.pause();
    } else {
      if (posicionAudio >= duracionAudio && duracionAudio > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  function formatTiempo(segundos: number) {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  return (
    <View
      style={[
        styles.audioguiaCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={[styles.audioPlayButton, { backgroundColor: colors.primary }]}
        onPress={toggleReproduccionAudio}
      >
        <Ionicons
          name={estaReproduciendo ? "pause" : "play"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={[styles.audioTitle, { color: colors.text }]}>
          Escuchar Audioguía
        </Text>
        <Text style={[styles.audioDuration, { color: colors.textSecondary }]}>
          {formatTiempo(posicionAudio)} / {formatTiempo(duracionAudio)}
        </Text>
      </View>
      <Ionicons name="headset-outline" size={24} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  audioguiaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  audioPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  audioInfo: { flex: 1 },
  audioTitle: { fontSize: 14, fontWeight: "bold" },
  audioDuration: { fontSize: 12, marginTop: 2 },
});