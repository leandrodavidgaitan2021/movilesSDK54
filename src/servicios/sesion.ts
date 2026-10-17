import * as SecureStore from "expo-secure-store";

const CLAVE_SESION = "sesion_usuario";

export interface SesionGuardada {
    email: string;
    token: string;
}

export async function guardarSesion(email: string, token: string): Promise<void> {
    try {
        await SecureStore.setItemAsync (
            CLAVE_SESION,
            JSON.stringify({ email, token }),
        );
    } catch (error) {
        console.error("No se pudo guardar la sesión", error);
    }
}

export async function leerSesion(): Promise<SesionGuardada | null> {
    try {
        const guardado = await SecureStore.getItemAsync(CLAVE_SESION);
        return guardado ? (JSON.parse(guardado) as SesionGuardada) : null;
    } catch (error) {
        console.error("No se pudo leer la sesión", error);
        return null;
    }
}

export async function borrarSesion(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(CLAVE_SESION);
    } catch (error) {
        console.error("No se pudo borrar la sesión", error)
    }
}