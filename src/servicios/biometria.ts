import * as LocalAuthentication from "expo-local-authentication";

export async function biometriaDisponible(): Promise<boolean> {
    try {
        const tieneSensor = await LocalAuthentication.hasHardwareAsync();
        const tieneHuellaRegistrada = await LocalAuthentication.isEnrolledAsync();
        return tieneSensor && tieneHuellaRegistrada;
    } catch (error) {
        console.error("Error al consultar la biometría", error);
        return false;
    }   
}

export async function pedirBiometria(): Promise <boolean> {
    try {
        const resultado = await LocalAuthentication.authenticateAsync({
            promptMessage: "Confirmá tu identidad para ingresar",
            cancelLabel: "Cancelar",
        });
        return resultado.success;
    } catch (error) {
        console.error("Error al pedir la biometría", error);
        return false;
    }
}