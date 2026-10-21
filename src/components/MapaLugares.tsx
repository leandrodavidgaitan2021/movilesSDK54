import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Lugar } from "../tipos";

interface Props {
  ubicacionActual: { latitud: number; longitud: number };
  lugares: Lugar[];
}

export default function MapaLugares({ ubicacionActual, lugares }: Props) {
  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        region={{
          latitude: ubicacionActual.latitud,
          longitude: ubicacionActual.longitud,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation={false}
      >
        <Marker
          coordinate={{
            latitude: ubicacionActual.latitud,
            longitude: ubicacionActual.longitud,
          }}
          title="Tu ubicación"
          description="Posición actual o simulada"
          pinColor="blue"
        />

        {lugares.map((lugar) => (
          <Marker
            key={lugar.id}
            coordinate={{
              latitude: lugar.coordenadas.latitud,
              longitude: lugar.coordenadas.longitud,
            }}
            title={lugar.nombre}
            description={lugar.descripcionCorta}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1 },
  map: { width: "100%", height: "100%" },
});
