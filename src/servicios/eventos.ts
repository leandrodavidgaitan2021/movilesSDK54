// src/servicios/eventos.ts
import { api } from "./api";
import { db } from "./db";
import { hayConexionInternet } from "./red";

export async function obtenerEventos(fechaInicio?: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      // Si nos pasan una fecha la usamos en "desde", sino la API por defecto ya arranca hoy
      const params: any = {};
      if (fechaInicio) {
        params.desde = fechaInicio;
      }

      const response = await api.get("/eventos", { params });
      const resultado = response.data;

      return resultado; // Devolvemos todo el objeto { datos, meta } para aprovechar la paginación
    } catch (error) {
      console.warn("La red falló al obtener eventos, cargando desde SQLite local...", error);
    }
  }

  // Si no hay red, busca de la base de datos local y simulamos la estructura de paginación
  const rows = db.getAllSync("SELECT dataJson FROM eventos_cache");
  const datosLocales = rows.map((row: any) => JSON.parse(row.dataJson));
  
  return {
    datos: datosLocales,
    meta: { total: datosLocales.length, pagina: 1, porPagina: datosLocales.length }
  };
}


export async function obtenerEventoPorId(id: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get(`/eventos/${id}`);
      const evento = response.data.datos || response.data;
      return evento;
    } catch (error) {
      console.warn(`Error de red al obtener el evento ${id}, buscando en SQLite...`, error);
    }
  }

  // Búsqueda en caché local (SQLite)
  const row = db.getFirstSync(`SELECT dataJson FROM eventos_cache WHERE id = ?`, [id]) as { dataJson: string } | null;
  if (row) {
    return JSON.parse(row.dataJson);
  }

  return null;
}