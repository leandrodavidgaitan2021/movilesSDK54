import AsyncStorage from "@react-native-async-storage/async-storage";
import { Favorito } from "../tipos";

const CLAVE_FAVORITOS = "@favoritos";

async function leerFavoritos(): Promise<Favorito[]> {

    const guardados = await AsyncStorage.getItem(CLAVE_FAVORITOS);
    if (!guardados) return [];
    return JSON.parse(guardados) as Favorito[];

}

export async function obtenerFavoritos(): Promise<Favorito[]> {
    return leerFavoritos();
}

export async function esFavorito (lugarId: string): Promise<boolean> {
    const favoritos = await leerFavoritos();
    return favoritos.some ((f) => f.lugarId === lugarId);
}
    
export async function cambiarFavorito(lugarId: string): Promise<boolean> {
    const favoritos = await leerFavoritos();
    const yaExiste = favoritos.find((f) => f.lugarId === lugarId);
    
    const nuevosFavoritos = yaExiste ? favoritos.filter((f) => f.lugarId !== lugarId) : [ ...favoritos,
        {
            id: `fav-${Date.now()}`,
            usuarioId: "local",
            lugarId,
            creadoEn: new Date().toISOString(), 
        },
    ];

    await AsyncStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(nuevosFavoritos));
    return !yaExiste;
};