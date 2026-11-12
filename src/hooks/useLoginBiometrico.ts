// src/hooks/useLoginBiometrico.ts
import { useEffect, useState } from "react";
import { biometriaDisponible, pedirBiometria } from "../servicios/biometria";
import { leerSesion } from "../servicios/sesion";
import { useAuth } from "./useAuth";

export function useLoginBiometrico() {
    const { login } = useAuth();
    const [disponible, setDisponible] = useState<boolean>(false);

    useEffect(() => {
        async function verificar() {
            const sesion = await leerSesion();
            const hayBiometria = await biometriaDisponible();
            setDisponible(sesion !== null && hayBiometria);
        }
        verificar();
    }, []);

    async function entrar(): Promise<boolean> {
        const sesion = await leerSesion();
        if (!sesion) return false;

        const confirmado = await pedirBiometria();
        if (!confirmado) return false;

        await login(sesion.email, sesion.token);
        return true;
    }

    return { disponible, entrar };
}