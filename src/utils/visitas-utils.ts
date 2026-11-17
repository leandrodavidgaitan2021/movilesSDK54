// src/utils/visitas-utils.ts
import { api } from '../servicios/api';

/**
 * Formatea una fecha al estándar requerido por la API: "2026-11-14T21:00:00-03:00"
 */
export function formatearFechaLocalApi(fecha: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const anio = fecha.getFullYear();
  const mes = pad(fecha.getMonth() + 1);
  const dia = pad(fecha.getDate());
  const horas = pad(fecha.getHours());
  const minutos = pad(fecha.getMinutes());
  const segundos = pad(fecha.getSeconds());

  const offsetMinutos = -fecha.getTimezoneOffset();
  const signo = offsetMinutos >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutos);
  const offsetHoras = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}${signo}${offsetHoras}:${offsetMins}`;
}

/**
 * Normaliza las URLs que devuelve la API o el entorno local
 */
export function normalizarUrlApi(url: string | null | undefined): string | null {
  if (!url) return null;
  const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '');
  if (baseUrl && url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', baseUrl);
  }
  return url;
}