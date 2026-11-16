// src/servicios/api.ts
import axios from 'axios';
import { leerSesion } from './sesion';
import { hayConexionInternet } from './red';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000, // Subimos a 10s para dar margen a la subida de fotos
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

      // Si lo que enviamos es FormData (fotos/audios/videos), quitamos el Content-Type
      // para que Axios/React Native genere automáticamente 'multipart/form-data; boundary=...'
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
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