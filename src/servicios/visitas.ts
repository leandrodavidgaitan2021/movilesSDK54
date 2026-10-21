// src/servicios/visitas.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrigenVisita, Visita, Lugar } from "../tipos";
import { obtenerLugares } from "./lugares";

const CLAVE_VISITAS = "@visitas";

async function leerVisitas(): Promise<Visita[]> {
  const guardadas = await AsyncStorage.getItem(CLAVE_VISITAS);
  if (!guardadas) return [];
  return JSON.parse(guardadas) as Visita[];
}

async function guardarVisitas(visitas: Visita[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE_VISITAS, JSON.stringify(visitas));
}

/** Lista todas las visitas, más recientes primero */
export async function obtenerVisitas(): Promise<Visita[]> {
  const visitas = await leerVisitas();
  return visitas.sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
  );
}

export interface VisitaConLugar extends Visita {
  lugar: Lugar | null;
}

export async function obtenerVisitasConLugar(): Promise<VisitaConLugar[]> {
  const [visitas, respuestaLugares] = await Promise.all([
    obtenerVisitas(),
    obtenerLugares(),
  ]);
  const mapa = new Map(respuestaLugares.datos.map((l) => [l.id, l]));
  return visitas.map((v) => ({
    ...v,
    lugar: mapa.get(v.lugarId) ?? null,
  }));
}

/**
 * Registra o actualiza una visita.
 * Si el lugar ya fue registrado anteriormente, actualiza sus campos (foto, nota)
 * sin duplicar la entrada en "Mi Recorrido".
 */
export async function registrarVisita(params: {
  lugarId: string;
  origen: OrigenVisita;
  fotoUri?: string | null;
  nota?: string | null;
  usuarioId?: string;
}): Promise<Visita> {
  const visitas = await leerVisitas();

  // Buscamos si ya existe una visita grabada para este mismo lugar
  const indiceExistente = visitas.findIndex((v) => v.lugarId === params.lugarId);

  if (indiceExistente !== -1) {
    // ACTUALIZACIÓN: Si ya existía, conservamos el registro actualizando foto y/o nota
    const existente = visitas[indiceExistente];

    const actualizada: Visita = {
      ...existente,
      // Si nos pasan una foto nueva la usamos, si no mantenemos la anterior
      fotoUri: params.fotoUri !== undefined ? params.fotoUri : existente.fotoUri,
      // Si nos pasan una nota la guardamos, si no mantenemos la anterior
      nota: params.nota?.trim() ? params.nota.trim() : existente.nota,
      fechaHora: new Date().toISOString(), // Actualizamos la última interacción
      sincronizada: false,
    };

    visitas[indiceExistente] = actualizada;
    await guardarVisitas(visitas);
    return actualizada;
  }

  // ALTA: Si es la primera vez que visita el lugar, crea una nueva entrada
  const nueva: Visita = {
    id: `vis-${Date.now()}`,
    usuarioId: params.usuarioId ?? "local",
    lugarId: params.lugarId,
    fechaHora: new Date().toISOString(),
    origen: params.origen,
    fotoUri: params.fotoUri ?? null,
    nota: params.nota?.trim() || null,
    sincronizada: false,
  };

  visitas.push(nueva);
  await guardarVisitas(visitas);
  return nueva;
}

export async function yaVisito(lugarId: string): Promise<boolean> {
  const visitas = await leerVisitas();
  return visitas.some((v) => v.lugarId === lugarId);
}

export async function cantidadLugaresVisitados(): Promise<number> {
  const visitas = await leerVisitas();
  return new Set(visitas.map((v) => v.lugarId)).size;
}

/**
 * Formato del enunciado: "COLON:lug-004"
 * Si el QR no es nuestro, devuelve null.
 */
export function parsearCodigoQr(data: string): string | null {
  if (!data || typeof data !== "string") return null;
  const limpio = data.trim();

  if (limpio.startsWith("COLON:")) {
    const id = limpio.slice("COLON:".length).trim();
    if (id.startsWith("lug-")) return id;
  }

  if (limpio.startsWith("lug-")) return limpio;

  return null;
}

// ---------- GPS / proximidad ----------

/** Distancia en metros entre dos coordenadas (fórmula de Haversine) */
export function distanciaMetros(
  a: { latitud: number; longitud: number },
  b: { latitud: number; longitud: number }
): number {
  const R = 6371000; // radio de la Tierra en metros
  const toRad = (g: number) => (g * Math.PI) / 180;
  const dLat = toRad(b.latitud - a.latitud);
  const dLon = toRad(b.longitud - a.longitud);
  const lat1 = toRad(a.latitud);
  const lat2 = toRad(b.latitud);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Radio por defecto para considerar "estoy cerca" (metros) */
export const RADIO_PROXIMIDAD_METROS = 150;

/**
 * ¿Está el usuario dentro del radio del lugar?
 * Devuelve { cerca, metros } o null si no se pudo obtener ubicación.
 */
export async function verificarProximidad(
  coordenadasLugar: { latitud: number; longitud: number },
  radioMetros: number = RADIO_PROXIMIDAD_METROS
): Promise<{ cerca: boolean; metros: number } | null> {
  try {
    const Location = await import("expo-location");

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const metros = distanciaMetros(
      { latitud: pos.coords.latitude, longitud: pos.coords.longitude },
      coordenadasLugar
    );

    return { cerca: metros <= radioMetros, metros: Math.round(metros) };
  } catch {
    return null;
  }
}