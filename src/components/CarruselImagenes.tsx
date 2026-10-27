// src/components/CarruselImagenes.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: ANCHO_PANTALLA } = Dimensions.get("window");

interface Props {
  imagenes: (string | any)[];
  colors: any;
  theme: string;
  onPressBack: () => void;
}

export default function CarruselImagenes({
  imagenes,
  colors,
  theme,
  onPressBack,
}: Props) {
  const [imagenActiva, setImagenActiva] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setImagenActiva(Math.round(index));
  };

  return (
    <View
      style={[
        styles.imagenContainer,
        { backgroundColor: theme === "dark" ? colors.card : "#f0f0f0" },
      ]}
    >
      {imagenes && imagenes.length > 0 ? (
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {imagenes.map((imagen, index) => (
              <Image
                key={index}
                source={typeof imagen === "string" ? { uri: imagen } : imagen}
                style={styles.imagenLugar}
              />
            ))}
          </ScrollView>

          {imagenes.length > 1 && (
            <View style={styles.pagination}>
              {imagenes.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.puntoPagination,
                    {
                      backgroundColor:
                        index === imagenActiva
                          ? colors.primary
                          : "rgba(255,255,255,0.5)",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.imagenPlaceholder,
            { backgroundColor: theme === "dark" ? "#1e1e1e" : "#ecf0f1" },
          ]}
        >
          <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.imagenPlaceholderText, { color: colors.textSecondary }]}>
            Sin imágenes disponibles
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.floatingBackButton,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: theme === "dark" ? 1 : 0,
          },
        ]}
        onPress={onPressBack}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  imagenContainer: {
    width: ANCHO_PANTALLA,
    height: 220,
    backgroundColor: "#f0f0f0",
  },
  imagenLugar: {
    width: ANCHO_PANTALLA,
    height: 220,
    resizeMode: "cover",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    gap: 6,
  },
  puntoPagination: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  imagenPlaceholder: {
    width: ANCHO_PANTALLA,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  imagenPlaceholderText: {
    fontSize: 13,
    marginTop: 4,
  },
  floatingBackButton: {
    position: "absolute",
    top: 35,
    left: 15,
    zIndex: 10,
    padding: 6,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});