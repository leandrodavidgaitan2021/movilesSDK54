import { api } from "./api";
import { db } from "./db";
import { hayConexionInternet } from "./red";

export async function obtenerEventos(fechaInicio: string) {
  const tieneRed = await hayConexionInternet();

  if (tieneRed) {
    try {
      const response = await api.get("/eventos", {
        params: { fechaInicio }
      });
      const resultado = response.data;

      return resultado.datos || resultado;
    } catch (error) {
      console.warn("La red falló al obtener eventos, cargando desde SQLite local...", error);
    }
  }

  // Si no hay red, busca de la base de datos local
  const rows = db.getAllSync("SELECT dataJson FROM eventos_cache");
  return rows.map((row: any) => JSON.parse(row.dataJson));
}