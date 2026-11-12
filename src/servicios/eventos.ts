import { api } from "./api";
import { db } from "./db";
import { hayConexionInternet } from "./red";

export async function obtenerEventos() {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get("/evento");
      const resultado = response.data;
      
      // Opcional: si guardan caché local como en lugares
      // for (const evento of resultado.datos || resultado) {
      //   db.runSync("INSERT OR REPLACE INTO eventos_cache ...", [...]);
      // }

      return resultado.datos || resultado;
    } catch (error) {
      console.warn("La red falló al obtener eventos, cargando desde SQLite local...", error);
    }
  }

  // Si no hay red, busca de la base de datos local
  const rows = db.getAllSync("SELECT dataJson FROM eventos_cache");
  return rows.map((row: any) => JSON.parse(row.dataJson));
}