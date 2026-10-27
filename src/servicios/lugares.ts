// src/servicios/lugares.ts
import { api } from "./api"; // Importamos la instancia centralizada que ya creaste
import { Lugar, Categoria } from "../tipos";

// Obtiene todos los lugares desde la API real de NestJS
export async function obtenerLugares(): Promise<{
  datos: Lugar[];
  meta: { total: number; pagina: number; porPagina: number };
}> {
  try {
    // Solicitamos con porPagina: 500 para cargar el catálogo entero como requiere la app
    const response = await api.get("/lugares", {
      params: { porPagina: 500 },
    });
    
    return response.data; // Retorna { datos, meta } tal cual lo envía NestJS
  } catch (error) {
    console.error("Error al obtener lugares del servidor:", error);
    throw error;
  }
}

// Obtiene las categorías desde la API real de NestJS
export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    const response = await api.get("/categorias");
    return response.data.datos || response.data;
  } catch (error) {
    console.error("Error al obtener categorías del servidor:", error);
    throw error;
  }
}

// Obtiene un lugar específico por su ID desde la API
export async function obtenerLugarPorId(id: string): Promise<Lugar | null> {
  try {
    const response = await api.get(`/lugares/${id}`);
    return response.data.datos || response.data;
  } catch (error) {
    console.error(`Error al obtener el lugar con ID ${id}:`, error);
    return null;
  }
}