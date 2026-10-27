// src/servicios/api.ts
import axios from 'axios';
import { leerSesion } from './sesion';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.30:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes para adjuntar automáticamente el Bearer Token
api.interceptors.request.use(
  async (config) => {
    try {
      const sesion = await leerSesion();
      if (sesion && sesion.token) {
        config.headers.Authorization = `Bearer ${sesion.token}`;
      }
    } catch (error) {
      console.error("Error al inyectar el token en el interceptor de Axios", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);