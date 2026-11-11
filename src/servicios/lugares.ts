// src/servicios/lugares.ts
import { api } from "./api";
import { Lugar, Categoria } from "../tipos";
import { db } from "./db";
import { hayConexionInternet } from "./red";

export async function obtenerLugares(filtroBusqueda?: string): Promise<{
  datos: Lugar[];
  meta: { total: number; pagina: number; porPagina: number };
}> {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get("/lugares", {
        params: { 
          porPagina: 500,
          ...(filtroBusqueda ? { busqueda: filtroBusqueda } : {}) 
        },
      });
      
      const resultado = response.data;

      for (const lugar of resultado.datos) {
        db.runSync(
          `INSERT OR REPLACE INTO lugares_cache (id, nombre, categoriaId, descripcionCorta, precioEntrada, accesible, activo, actualizadoEn, dataJson) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lugar.id,
            lugar.nombre,
            lugar.categoriaId,
            lugar.descripcionCorta || null,
            lugar.precioEntrada ?? null,
            lugar.accesible ? 1 : 0,
            lugar.activo ? 1 : 0,
            lugar.actualizadoEn || new Date().toISOString(),
            JSON.stringify(lugar)
          ]
        );
      }

      return resultado;
    } catch (error) {
      console.warn("La red falló al obtener lugares, cargando desde SQLite local...", error);
    }
  } else {
    console.warn("Sin señal detectada. Cargando catálogo de lugares desde SQLite local...");
  }

  let query = `SELECT dataJson FROM lugares_cache`;
  let params: any[] = [];

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    query += ` WHERE nombre LIKE ? OR categoriaId LIKE ?`;
    params = [`%${filtroBusqueda}%`, `%${filtroBusqueda}%`];
  }

  const rows = db.getAllSync(query, params) as { dataJson: string }[];

  if (rows.length === 0) {
    throw new Error("No hay conexión a internet y no se encontraron datos almacenados en el dispositivo.");
  }

  const lugaresLocales: Lugar[] = rows.map(row => JSON.parse(row.dataJson));

  return {
    datos: lugaresLocales,
    meta: { total: lugaresLocales.length, pagina: 1, porPagina: lugaresLocales.length }
  };
}

export async function obtenerLugarPorId(id: string): Promise<Lugar | null> {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get(`/lugares/${id}`);
      const lugar = response.data.datos || response.data;
      
      if (lugar) {
        db.runSync(
          `INSERT OR REPLACE INTO lugares_cache (id, nombre, categoriaId, descripcionCorta, precioEntrada, accesible, activo, actualizadoEn, dataJson) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lugar.id,
            lugar.nombre,
            lugar.categoriaId,
            lugar.descripcionCorta || null,
            lugar.precioEntrada ?? null,
            lugar.accesible ? 1 : 0,
            lugar.activo ? 1 : 0,
            lugar.actualizadoEn || new Date().toISOString(),
            JSON.stringify(lugar)
          ]
        );
      }
      return lugar;
    } catch (error) {
      console.warn(`Error de red al buscar el lugar ${id}, buscando en SQLite...`, error);
    }
  }

  const row = db.getFirstSync(`SELECT dataJson FROM lugares_cache WHERE id = ?`, [id]) as { dataJson: string } | null;
  if (row) {
    return JSON.parse(row.dataJson);
  }
  
  return null;
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get("/categorias");
      const categorias: Categoria[] = response.data.datos || response.data;

      for (const cat of categorias) {
        db.runSync(
          `INSERT OR REPLACE INTO categorias_cache (id, nombre, icono, color, orden, dataJson) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            cat.id,
            cat.nombre,
            cat.icono,
            cat.color,
            cat.orden,
            JSON.stringify(cat)
          ]
        );
      }

      return categorias;
    } catch (error) {
      console.warn("Error de red al obtener categorías, cargando desde SQLite...", error);
    }
  }

  const rows = db.getAllSync(`SELECT dataJson FROM categorias_cache ORDER BY orden ASC`) as { dataJson: string }[];
  return rows.map(row => JSON.parse(row.dataJson));
}