// src/servicios/lugares.ts
import { type SQLiteDatabase } from "expo-sqlite";
import { Categoria, Lugar } from "../tipos";
import { api } from "./api";
import { db as dbGlobal } from "./db";
import { hayConexionInternet } from "./red";

// Obtener listado de lugares (Network-First con caché local SQLite)
export async function obtenerLugares(
  dbParam?: SQLiteDatabase,
  filtroBusqueda?: string
): Promise<{
  datos: Lugar[];
  meta: { total: number; pagina: number; porPagina: number };
}> {
  const tieneRed = await hayConexionInternet();

  // Seleccionamos la base de datos a usar: dbParam (de useSQLiteContext) o dbGlobal como respaldo
  const baseDatos = dbParam ?? dbGlobal;

  if (tieneRed) {
    try {
      const response = await api.get("/lugares", {
        params: {
          porPagina: 500,
          ...(filtroBusqueda ? { busqueda: filtroBusqueda } : {}),
        },
      });

      const resultado = response.data;

      // Guardar/Actualizar la caché local en SQLite usando baseDatos
      for (const lugar of resultado.datos) {
        if (baseDatos && "runAsync" in baseDatos) {
          await baseDatos.runAsync(
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
              JSON.stringify(lugar),
            ]
          );
        } else if (baseDatos && "runSync" in baseDatos) {
          (baseDatos as any).runSync(
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
              JSON.stringify(lugar),
            ]
          );
        }
      }

      return resultado;
    } catch (error) {
      console.warn(
        "La red falló al obtener lugares, cargando desde SQLite local...",
        error
      );
    }
  } else {
    console.warn(
      "Sin señal detectada. Cargando catálogo de lugares desde SQLite local..."
    );
  }

  // Fallback / Modo Offline: Leemos de la base de datos local SQLite
  let query = `SELECT dataJson FROM lugares_cache`;
  let params: any[] = [];

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    query += ` WHERE nombre LIKE ? OR categoriaId LIKE ?`;
    params = [`%${filtroBusqueda}%`, `%${filtroBusqueda}%`];
  }

  let rows: { dataJson: string }[] = [];

  if (baseDatos && "getAllAsync" in baseDatos) {
    rows = await baseDatos.getAllAsync<{ dataJson: string }>(query, params);
  } else if (baseDatos && "getAllSync" in baseDatos) {
    rows = (baseDatos as any).getAllSync(query, params) as {
      dataJson: string;
    }[];
  }

  if (rows.length === 0) {
    throw new Error(
      "No hay conexión a internet y no se encontraron datos almacenados en el dispositivo."
    );
  }

  const lugaresLocales: Lugar[] = rows.map((row) => JSON.parse(row.dataJson));

  return {
    datos: lugaresLocales,
    meta: {
      total: lugaresLocales.length,
      pagina: 1,
      porPagina: lugaresLocales.length,
    },
  };
}

// Obtener un lugar específico por su ID (con respaldo local)
export async function obtenerLugarPorId(
  id: string,
  dbParam?: SQLiteDatabase
): Promise<Lugar | null> {
  const tieneRed = await hayConexionInternet();
  const baseDatos = dbParam ?? dbGlobal;

  if (tieneRed) {
    try {
      const response = await api.get(`/lugares/${id}`);
      const lugar = response.data.datos || response.data;

      if (lugar) {
        if (baseDatos && "runAsync" in baseDatos) {
          await baseDatos.runAsync(
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
              JSON.stringify(lugar),
            ]
          );
        } else if (baseDatos && "runSync" in baseDatos) {
          (baseDatos as any).runSync(
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
              JSON.stringify(lugar),
            ]
          );
        }
      }
      return lugar;
    } catch (error) {
      console.warn(
        `Error de red al buscar el lugar ${id}, buscando en SQLite...`,
        error
      );
    }
  }

  // Búsqueda offline en SQLite
  let row: { dataJson: string } | null = null;
  if (baseDatos && "getFirstAsync" in baseDatos) {
    row = await baseDatos.getFirstAsync<{ dataJson: string }>(
      `SELECT dataJson FROM lugares_cache WHERE id = ?`,
      [id]
    );
  } else if (baseDatos && "getFirstSync" in baseDatos) {
    row = (baseDatos as any).getFirstSync(
      `SELECT dataJson FROM lugares_cache WHERE id = ?`,
      [id]
    ) as { dataJson: string } | null;
  }

  if (row) {
    return JSON.parse(row.dataJson);
  }

  return null;
}

// Obtener categorías (con respaldo local)
export async function obtenerCategorias(
  dbParam?: SQLiteDatabase
): Promise<Categoria[]> {
  const tieneRed = await hayConexionInternet();
  const baseDatos = dbParam ?? dbGlobal;

  if (tieneRed) {
    try {
      const response = await api.get("/categorias");
      const categorias: Categoria[] = response.data.datos || response.data;

      for (const cat of categorias) {
        if (baseDatos && "runAsync" in baseDatos) {
          await baseDatos.runAsync(
            `INSERT OR REPLACE INTO categorias_cache (id, nombre, icono, color, orden, dataJson) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              cat.id,
              cat.nombre,
              cat.icono,
              cat.color,
              cat.orden,
              JSON.stringify(cat),
            ]
          );
        } else if (baseDatos && "runSync" in baseDatos) {
          (baseDatos as any).runSync(
            `INSERT OR REPLACE INTO categorias_cache (id, nombre, icono, color, orden, dataJson) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              cat.id,
              cat.nombre,
              cat.icono,
              cat.color,
              cat.orden,
              JSON.stringify(cat),
            ]
          );
        }
      }

      return categorias;
    } catch (error) {
      console.warn(
        "Error de red al obtener categorías, cargando desde SQLite...",
        error
      );
    }
  }

  // Ordenamos por la propiedad orden para mantener la consistencia visual
  let rows: { dataJson: string }[] = [];
  if (baseDatos && "getAllAsync" in baseDatos) {
    rows = await baseDatos.getAllAsync<{ dataJson: string }>(
      `SELECT dataJson FROM categorias_cache ORDER BY orden ASC`
    );
  } else if (baseDatos && "getAllSync" in baseDatos) {
    rows = (baseDatos as any).getAllSync(
      `SELECT dataJson FROM categorias_cache ORDER BY orden ASC`
    ) as { dataJson: string }[];
  }

  return rows.map((row) => JSON.parse(row.dataJson));
}