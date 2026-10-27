import AsyncStorage from "@react-native-async-storage/async-storage";
import { Favorito, Lugar } from "../tipos";
import { obtenerLugares } from "./lugares";

function claveFavoritos(usuarioId: string): string {
    return `@favoritos:${usuarioId.toLowerCase()}`;
}

async function leerFavoritos(usuarioId: string): Promise<Favorito[]> {
    const guardado = await AsyncStorage.getItem(claveFavoritos(usuarioId));
    if (!guardado) return [];
    return JSON.parse(guardado) as Favorito[];
}

export async function esFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    const favoritos = await leerFavoritos(usuarioId);
    return favoritos.some((f) => f.lugarId === lugarId);
}

export async function cambiarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    const favoritos = await leerFavoritos(usuarioId);
    const yaExiste = favoritos.find((f) => f.lugarId === lugarId);

    const nuevosFavoritos = yaExiste
        ? favoritos.filter((f) => f.lugarId !== lugarId)
        : [
            ...favoritos,
            {
                id: `fav-${Date.now()}`,
                usuarioId,
                lugarId,
                creadoEn: new Date().toISOString(),
            },
        ];

    await AsyncStorage.setItem(
        claveFavoritos(usuarioId),
        JSON.stringify(nuevosFavoritos),
    );
    return !yaExiste;
}

export async function obtenerLugaresFav(usuarioId:string): Promise<Lugar[]> {
    const favoritos = await leerFavoritos(usuarioId);
    const idsFavoritos = favoritos.map ((f) => f.lugarId);
    const respuestaLugares = await obtenerLugares();
    return respuestaLugares.datos.filter((lugar) => idsFavoritos.includes(lugar.id));
}