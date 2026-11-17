// src/app/(tabs)/agenda.tsx
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { obtenerEventos, obtenerEventosGuardados, guardarEvento, eliminarEventoGuardado } from "../../servicios/eventos";
import { obtenerLugares } from "../../servicios/lugares";

export default function AgendaScreen() {
  const { colors, theme } = useTheme();
  const { isAuthenticated } = useAuth();

  const [todosLosEventos, setTodosLosEventos] = useState<any[]>([]);
  const [eventosFiltrados, setEventosFiltrados] = useState<any[]>([]);
  const [eventosGuardadosIds, setEventosGuardadosIds] = useState<Set<string>>(new Set());
  
  // Diccionario para almacenar los lugares y buscar su nombre por ID
  const [lugaresMap, setLugaresMap] = useState<{ [key: string]: string }>({});
  
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroActivo, setFiltroActivo] = useState<"todos" | "hoy" | "guardados">("todos");

  useEffect(() => {
    async function cargarDatosAgenda() {
      try {
        const hoy = new Date().toISOString().split("T")[0];

        // Si el usuario está logueado consultamos los guardados al endpoint /yo/eventos-guardados
        const promesaGuardados = isAuthenticated 
          ? obtenerEventosGuardados().catch(() => []) 
          : Promise.resolve([]);

        // Ejecutamos en paralelo la llamada a eventos, lugares y eventos guardados
        const [respuestaEventos, respuestaLugares, idsGuardados] = await Promise.all([
          obtenerEventos(hoy),
          obtenerLugares().catch(() => ({ datos: [] })),
          promesaGuardados
        ]);

        // Parseamos los eventos
        const listaEventos = respuestaEventos?.datos || (Array.isArray(respuestaEventos) ? respuestaEventos : []);
        setTodosLosEventos(listaEventos);
        setEventosFiltrados(listaEventos);

        // Parseamos los lugares y armamos un mapa de ID -> Nombre
        const listaLugares = respuestaLugares?.datos || (Array.isArray(respuestaLugares) ? respuestaLugares : []);
        const mapa: { [key: string]: string } = {};
        listaLugares.forEach((lugar: any) => {
          mapa[lugar.id] = lugar.nombre;
        });
        setLugaresMap(mapa);

        // Guardamos los IDs de los eventos guardados por el usuario
        setEventosGuardadosIds(new Set(idsGuardados));

      } catch (error) {
        console.error("Error al cargar datos de la agenda:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatosAgenda();
  }, [isAuthenticated]);

  // Manejar el guardado o eliminación de un evento en la agenda (/yo/eventos-guardados)
  const handleToggleGuardar = async (eventoId: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Inicio de sesión requerido",
        "Debes iniciar sesión para guardar eventos en tu agenda personal.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Iniciar Sesión", onPress: () => router.push("/login") }
        ]
      );
      return;
    }

    try {
      const estaGuardado = eventosGuardadosIds.has(eventoId);

      if (estaGuardado) {
        await eliminarEventoGuardado(eventoId);
        setEventosGuardadosIds((prev) => {
          const nuevoSet = new Set(prev);
          nuevoSet.delete(eventoId);
          return nuevoSet;
        });
        Alert.alert("Agenda", "Evento removido de tus eventos guardados.");
      } else {
        await guardarEvento(eventoId);
        setEventosGuardadosIds((prev) => {
          const nuevoSet = new Set(prev);
          nuevoSet.add(eventoId);
          return nuevoSet;
        });
        Alert.alert("¡Éxito!", "Evento guardado en tu agenda correctamente.");
      }

      // Si el usuario está viendo el filtro de guardados, actualizamos la lista filtrada al instante
      if (filtroActivo === "guardados") {
        const actualizados = todosLosEventos.filter((item) => eventosGuardadosIds.has(item.id));
        setEventosFiltrados(actualizados);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado del evento.");
    }
  };

  // Función para cambiar el filtro (Todos / Hoy / Guardados)
  const cambiarFiltro = (tipo: "todos" | "hoy" | "guardados") => {
    if (tipo === "guardados" && !isAuthenticated) {
      Alert.alert(
        "Inicio de sesión requerido",
        "Inicia sesión para ver tus eventos guardados.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Iniciar Sesión", onPress: () => router.push("/login") }
        ]
      );
      return;
    }

    setFiltroActivo(tipo);

    if (tipo === "hoy") {
      const hoyString = new Date().toISOString().split("T")[0];
      const filtrados = todosLosEventos.filter((item) => {
        if (!item.inicio) return false;
        return item.inicio.startsWith(hoyString);
      });
      setEventosFiltrados(filtrados);
    } else if (tipo === "guardados") {
      const filtrados = todosLosEventos.filter((item) => eventosGuardadosIds.has(item.id));
      setEventosFiltrados(filtrados);
    } else {
      setEventosFiltrados(todosLosEventos);
    }
  };

  const formatearFechaHora = (isoString: string) => {
    if (!isoString) return { fecha: "", hora: "" };
    const fechaObj = new Date(isoString);
    
    const fecha = fechaObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const hora = fechaObj.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return { fecha, hora };
  };

  if (cargando) {
    return (
      <View style={[styles.centrado, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.textoCargando, { color: colors.textSecondary }]}>
          Cargando agenda...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          📅 Agenda Cultural y Turística
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Colón, Entre Ríos
        </Text>
      </View>

      {/* Botones de Filtro (Todos / Hoy / Guardados) */}
      <View style={styles.filtroContainer}>
        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { borderColor: colors.primary },
            filtroActivo === "todos" && { backgroundColor: colors.primary },
          ]}
          onPress={() => cambiarFiltro("todos")}
        >
          <Text
            style={[
              styles.textoBotonFiltro,
              { color: filtroActivo === "todos" ? "#fff" : colors.primary },
            ]}
          >
            Próximos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { borderColor: colors.primary },
            filtroActivo === "hoy" && { backgroundColor: colors.primary },
          ]}
          onPress={() => cambiarFiltro("hoy")}
        >
          <Text
            style={[
              styles.textoBotonFiltro,
              { color: filtroActivo === "hoy" ? "#fff" : colors.primary },
            ]}
          >
            Hoy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonFiltro,
            { borderColor: colors.primary },
            filtroActivo === "guardados" && { backgroundColor: colors.primary },
          ]}
          onPress={() => cambiarFiltro("guardados")}
        >
          <Text
            style={[
              styles.textoBotonFiltro,
              { color: filtroActivo === "guardados" ? "#fff" : colors.primary },
            ]}
          >
            Mis Guardados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Eventos */}
      <FlatList
        data={eventosFiltrados}
        keyExtractor={(item, index) => item.id || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.centrado}>
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              {filtroActivo === "hoy" 
                ? "No hay eventos programados para el día de hoy." 
                : filtroActivo === "guardados"
                ? "No tenés eventos guardados en tu agenda."
                : "No hay eventos próximos disponibles."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { fecha, hora } = formatearFechaHora(item.inicio);
          
          const nombreLugar = item.lugarId ? lugaresMap[item.lugarId] : null;
          const textoUbicacion = item.direccionLibre || nombreLugar || (item.lugarId ? `Lugar ID: ${item.lugarId}` : "Ubicación a confirmar");
          const estaGuardado = eventosGuardadosIds.has(item.id);

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/evento/${item.id}` as any)}
            >
              <View
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: theme === "dark" ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.eventFechaContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.eventFecha, { color: colors.primary }]}>
                      {fecha} ⏰ {hora} hs
                    </Text>
                  </View>

                  {/* Botón Guardar / Quitar Evento */}
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleToggleGuardar(item.id)}>
                    <Ionicons
                      name={estaGuardado ? "bookmark" : "bookmark-outline"}
                      size={20}
                      color={estaGuardado ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.eventTitulo, { color: colors.text }]}>
                  {item.titulo}
                </Text>

                <View style={styles.eventLocationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.eventLugar, { color: colors.textSecondary }]}
                  >
                    {textoUbicacion}
                  </Text>
                </View>

                <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>
                  {item.descripcion}
                </Text>

                {item.precio > 0 && (
                  <Text style={[styles.eventPrecio, { color: colors.primary }]}>
                    Entrada: ${item.precio}
                  </Text>
                )}

                {item.estado && item.estado !== "programado" && (
                  <Text style={[styles.eventEstado, { color: item.estado === "cancelado" ? "#d90429" : "#ffb703" }]}>
                    Estado: {item.estado.toUpperCase()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    padding: 20,
    marginTop: 40,
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  filtroContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  botonFiltro: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonFiltro: {
    fontSize: 12,
    fontWeight: "bold",
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0a9396",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventFechaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventFecha: {
    fontSize: 13,
    fontWeight: "600",
  },
  eventTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  eventLugar: {
    fontSize: 13,
    fontWeight: "500",
  },
  eventDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  eventPrecio: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
  },
  eventEstado: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
  },
});