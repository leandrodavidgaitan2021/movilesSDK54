// src/servicios/api.ts
import axios from 'axios';
import { leerSesion } from './sesion';
import { hayConexionInternet } from './red'; // <-- Importamos tu validador de red

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000, // Máximo 5 segundos de espera si el servidor no responde
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes para validar red, inyectar token y fallar rápido
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Verificamos si hay conexión antes de intentar pegarle a la API
      const tieneRed = await hayConexionInternet();
      if (!tieneRed) {
        // Cancelamos la petición inmediatamente lanzando un error customizado
        return Promise.reject(new Error("OFFLINE_MODE: Sin conexión a internet detectada."));
      }

      // 2. Adjuntamos automáticamente el Bearer Token si existe
      const sesion = await leerSesion();
      if (sesion && sesion.token) {
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