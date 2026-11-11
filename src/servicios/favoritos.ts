// src/servicios/favoritos.ts
import Storage from "expo-sqlite/kv-store";
import axios from "axios";
import { Favorito, Lugar } from "../tipos";
import { api } from "./api";
import { obtenerLugares } from "./lugares";
import { hayConexionInternet } from "./red";

/*
  Cómo funciona:
  - La API es la fuente de verdad de los favoritos de la cuenta.
  - En el celular queda una copia (kv-store) para mostrarlos sin conexión.
  - Cada cambio se aplica primero en la copia y se anota como "pendiente";
    después se intenta enviar a la API. Si no hay conexión (o el token venció),
    queda pendiente y se envía en la próxima sincronización.
*/

interface Pendiente {
    lugarId: string;
    accion: "agregar" | "quitar";
}

const claveFavoritos = (usuarioId: string) =>
    `@favoritos:${usuarioId.toLowerCase()}`;
const clavePendientes = (usuarioId: string) =>
    `@favoritos-pendientes:${usuarioId.toLowerCase()}`;

async function leerLista<T>(clave: string): Promise<T[]> {
    try {
        const guardado = await Storage.getItem(clave);
        return guardado ? (JSON.parse(guardado) as T[]) : [];
    } catch (error) {
        console.error("No se pudo leer del almacenamiento local", error);
        return [];
    }
}

const leerFavoritos = (usuarioId: string) =>
    leerLista<Favorito>(claveFavoritos(usuarioId));
const leerPendientes = (usuarioId: string) =>
    leerLista<Pendiente>(clavePendientes(usuarioId));

const guardarFavoritos = (usuarioId: string, lista: Favorito[]) =>
    Storage.setItem(claveFavoritos(usuarioId), JSON.stringify(lista));
const guardarPendientes = (usuarioId: string, lista: Pendiente[]) =>
    Storage.setItem(clavePendientes(usuarioId), JSON.stringify(lista));

// Como PUT y DELETE se pueden repetir sin problema, de cada lugar solo importa
// el último cambio pedido.
async function anotarPendiente(usuarioId: string, nuevo: Pendiente) {
    const resto = (await leerPendientes(usuarioId)).filter(
        (p) => p.lugarId !== nuevo.lugarId,
    );
    await guardarPendientes(usuarioId, [...resto, nuevo]);
}

// Las operaciones que tocan los datos locales se hacen de a una, para que dos
// toques seguidos en la estrella no se pisen entre sí.
let cola: Promise<unknown> = Promise.resolve();
function enSerie<T>(tarea: () => Promise<T>): Promise<T> {
    const resultado = cola.then(tarea, tarea);
    cola = resultado.catch(() => undefined);
    return resultado;
}

// Manda a la API los cambios hechos sin conexión. Devuelve true si no quedó ninguno.
async function enviarPendientes(usuarioId: string): Promise<boolean> {
    const pendientes = await leerPendientes(usuarioId);
    const sinEnviar: Pendiente[] = [];

    for (const p of pendientes) {
        const ruta = `/yo/favoritos/${encodeURIComponent(p.lugarId)}`;
        try {
            if (p.accion === "agregar") await api.put(ruta);
            else await api.delete(ruta);
        } catch (error) {
            // 404: el lugar ya no existe, no tiene sentido reintentar
            if (axios.isAxiosError(error) && error.response?.status === 404) continue;
            sinEnviar.push(p);
        }
    }

    await guardarPendientes(usuarioId, sinEnviar);
    return sinEnviar.length === 0;
}

const yaSincronizados = new Set<string>();

// Envía los pendientes y reemplaza la copia local por la lista de la API.
// Nunca lanza error: si algo falla, la copia local queda como estaba.
async function sincronizarAhora(usuarioId: string): Promise<boolean> {
    try {
        if (!(await hayConexionInternet())) return false;
        if (!(await enviarPendientes(usuarioId))) return false;

        const respuesta = await api.get("/yo/favoritos");
        await guardarFavoritos(usuarioId, respuesta.data.datos as Favorito[]);
        yaSincronizados.add(usuarioId.toLowerCase());
        return true;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.warn("Detalle del error 400:", error.response?.data);
        } else {
            console.warn("No se pudieron sincronizar los favoritos", error);
        }
        return false;
    }
}

export function sincronizarFavoritos(usuarioId: string): Promise<boolean> {
    return enSerie(() => sincronizarAhora(usuarioId));
}

// Sincroniza una sola vez por ejecución de la app (por usuario), por ejemplo
// al abrirla en un celular nuevo donde todavía no hay copia local.
async function asegurarSincronizado(usuarioId: string): Promise<void> {
    if (yaSincronizados.has(usuarioId.toLowerCase())) return;
    await enSerie(async () => {
        if (!yaSincronizados.has(usuarioId.toLowerCase())) {
            await sincronizarAhora(usuarioId);
        }
    });
}

export async function esFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    await asegurarSincronizado(usuarioId);
    const favoritos = await leerFavoritos(usuarioId);
    return favoritos.some((f) => f.lugarId === lugarId);
}

export async function cambiarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    await asegurarSincronizado(usuarioId);

    // 1. Cambio local inmediato: la estrella responde al instante, con o sin internet
    const quedaFavorito = await enSerie(async () => {
        const favoritos = await leerFavoritos(usuarioId);
        const yaExiste = favoritos.some((f) => f.lugarId === lugarId);

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

        await guardarFavoritos(usuarioId, nuevosFavoritos);
        await anotarPendiente(usuarioId, {
            lugarId,
            accion: yaExiste ? "quitar" : "agregar",
        });
        return !yaExiste;
    });

    // 2. Avisar a la API en segundo plano (si falla, el cambio queda pendiente)
    void sincronizarFavoritos(usuarioId);

    return quedaFavorito;
}

export async function obtenerLugaresFav(usuarioId: string): Promise<Lugar[]> {
    // Al abrir la pantalla de favoritos siempre se intenta refrescar desde la API
    await sincronizarFavoritos(usuarioId);

    const favoritos = await leerFavoritos(usuarioId);
    const idsFavoritos = new Set(favoritos.map((f) => f.lugarId));
    const respuestaLugares = await obtenerLugares();
    return respuestaLugares.datos.filter((lugar) => idsFavoritos.has(lugar.id));
}