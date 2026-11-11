// src/servicios/sesion.ts
import * as SecureStore from "expo-secure-store";

// La SESIÓN sirve para reabrir la app sin pedir datos.
// La credencial de BIOMETRÍA es aparte: sobrevive al "Cerrar sesión" y solo
// se borra cuando el usuario desactiva la huella o cuando el token vence.
const CLAVE_SESION = "sesion_usuario";
const CLAVE_BIOMETRIA = "sesion_biometria";

export interface SesionGuardada {
    email: string;
    token: string;
}

async function guardarEn(clave: string, email: string, token: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(clave, JSON.stringify({ email, token }));
    } catch (error) {
        console.error("No se pudo guardar en el almacenamiento seguro", error);
    }
}

async function leerDe(clave: string): Promise<SesionGuardada | null> {
    try {
        const guardado = await SecureStore.getItemAsync(clave);
        return guardado ? (JSON.parse(guardado) as SesionGuardada) : null;
    } catch (error) {
        console.error("No se pudo leer del almacenamiento seguro", error);
        return null;
    }
}

async function borrarDe(clave: string): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(clave);
    } catch (error) {
        console.error("No se pudo borrar del almacenamiento seguro", error);
    }
}

// Sesión (la usa AuthContext, no cambia)
export const guardarSesion = (email: string, token: string) =>
    guardarEn(CLAVE_SESION, email, token);
export const leerSesion = () => leerDe(CLAVE_SESION);
export const borrarSesion = () => borrarDe(CLAVE_SESION);

// Credencial de biometría (la usa useLoginBiometrico)
export const guardarBiometria = (email: string, token: string) =>
    guardarEn(CLAVE_BIOMETRIA, email, token);
export const leerBiometria = () => leerDe(CLAVE_BIOMETRIA);
export const borrarBiometria = () => borrarDe(CLAVE_BIOMETRIA);