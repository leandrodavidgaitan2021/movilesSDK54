// src/servicios/eventos.ts
import { api } from "./api";
import { db } from "./db";
import { hayConexionInternet } from "./red";

export async function obtenerEventos(fechaInicio?: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const params: any = {};
      if (fechaInicio) {
        params.desde = fechaInicio;
      }

      const response = await api.get("/eventos", { params });
      return response.data;
    } catch (error) {
      console.warn("La red falló al obtener eventos, cargando desde SQLite local...", error);
    }
  }

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

  const row = db.getFirstSync(`SELECT dataJson FROM eventos_cache WHERE id = ?`, [id]) as { dataJson: string } | null;
  if (row) {
    return JSON.parse(row.dataJson);
  }

  return null;
}

// ==========================================
// ENDPOINTS OFICIALES DE EVENTOS GUARDADOS
// ==========================================

// GET /yo/eventos-guardados
export async function obtenerEventosGuardados(): Promise<string[]> {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get("/yo/eventos-guardados");
      const lista = response.data.datos || response.data;
      return lista.map((item: any) => item.eventoId || item.id);
    } catch (error) {
      console.warn("Error al obtener eventos guardados online, cargando local...", error);
    }
  }

  try {
    const rows = db.getAllSync(`SELECT eventoId FROM agenda_local`) as { eventoId: string }[];
    return rows.map(r => r.eventoId);
  } catch (err) {
    return [];
  }
}

// PUT /yo/eventos-guardados/{eventoId}
export async function guardarEvento(eventoId: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.put(`/yo/eventos-guardados/${eventoId}`);
      return response.data;
    } catch (error) {
      console.warn("Error de red al guardar evento, respaldando localmente...", error);
    }
  }

  try {
    db.runSync(
      `INSERT OR REPLACE INTO agenda_local (eventoId, creadoEn) VALUES (?, ?)`,
      [eventoId, new Date().toISOString()]
    );
    return { success: true, local: true };
  } catch (err) {
    console.error("Error guardando evento en SQLite local:", err);
    throw err;
  }
}

// DELETE /yo/eventos-guardados/{eventoId}
export async function eliminarEventoGuardado(eventoId: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.delete(`/yo/eventos-guardados/${eventoId}`);
      return response.data;
    } catch (error) {
      console.warn("Error de red al eliminar evento guardado, actualizando localmente...", error);
    }
  }

  try {
    db.runSync(`DELETE FROM agenda_local WHERE eventoId = ?`, [eventoId]);
    return { success: true, local: true };
  } catch (err) {
    console.error("Error eliminando evento de SQLite local:", err);
    throw err;
  }
}