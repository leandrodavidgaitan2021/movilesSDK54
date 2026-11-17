// src/servicios/api.ts
import axios from 'axios';
import { leerSesion } from './sesion';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const sesion = await leerSesion();
      if (sesion && sesion.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${sesion.token}`;
      }

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