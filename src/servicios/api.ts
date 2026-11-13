import axios from 'axios';
import { leerSesion } from './sesion';
import { hayConexionInternet } from './red';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    try {
      const tieneRed = await hayConexionInternet();
      if (!tieneRed) {
        return Promise.reject(new Error("OFFLINE_MODE: Sin conexión a internet detectada."));
      }

      const sesion = await leerSesion();
      if (sesion && sesion.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${sesion.token}`;
      }
    } catch (error) {
      console.error("Error en el interceptor de solicitudes de Axios:", error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);