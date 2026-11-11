// src/hooks/useLoginBiometrico.ts
import axios from "axios";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { api } from "../servicios/api";
import { biometriaDisponible, pedirBiometria } from "../servicios/biometria";
import {
    borrarBiometria,
    guardarBiometria,
    leerBiometria,
} from "../servicios/sesion";
import { useAuth } from "./useAuth";

export function useLoginBiometrico() {
    const { login } = useAuth();
    const [sensor, setSensor] = useState<boolean>(false); // el celular tiene huella/rostro registrado
    const [activa, setActiva] = useState<boolean>(false); // el usuario la activó en la app

    useEffect(() => {
        async function verificar() {
            setSensor(await biometriaDisponible());
            setActiva((await leerBiometria()) !== null);
        }
        verificar();
    }, []);

    // Activar: confirma con la huella y guarda el token cifrado
    async function activar(email: string, token: string): Promise<boolean> {
        const confirmado = await pedirBiometria("Confirmá con tu huella para activarla");
        if (!confirmado) return false;
        await guardarBiometria(email, token);
        setActiva(true);
        return true;
    }

    async function desactivar(): Promise<void> {
        await borrarBiometria();
        setActiva(false);
    }

    // Tras un ingreso normal: renueva el token guardado, pero solo si es la misma cuenta
    async function actualizar(email: string, token: string): Promise<void> {
        const guardado = await leerBiometria();
        if (guardado && guardado.email === email) {
            await guardarBiometria(email, token);
        }
    }

    // Ingreso con huella: huella -> token guardado -> GET /yo para comprobar que sigue vigente
    async function entrar(): Promise<boolean> {
        const guardado = await leerBiometria();
        if (!guardado) return false;

        const confirmado = await pedirBiometria();
        if (!confirmado) return false;

        try {
            await api.get("/yo", {
                headers: { Authorization: `Bearer ${guardado.token}` },
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await desactivar();
                Alert.alert(
                    "Sesión vencida",
                    "Ingresá con tu email y contraseña para volver a activar la huella.",
                );
            } else {
                Alert.alert(
                    "Sin conexión",
                    "No se pudo conectar con el servidor. Verificá tu conexión.",
                );
            }
            return false;
        }

        await login(guardado.email, guardado.token);
        return true;
    }

    return {
        disponible: sensor && activa, // lo que ya usa login.tsx para mostrar el botón
        sensor,
        activa,
        entrar,
        activar,
        desactivar,
        actualizar,
    };
}