// src/servicios/lugares.ts
import { Lugar, Categoria } from "../tipos";
import { LUGARES_MOCK, CATEGORIAS_MOCK } from "../mocks/lugares";

// Simula un delay de red y estructuración de la respuesta de la API
export async function obtenerLugares(): Promise<{ datos: Lugar[]; meta: { total: number; pagina: number; porPagina: number } }> {
  // Simulamos latencia de red
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    datos: LUGARES_MOCK,
    meta: {
      total: LUGARES_MOCK.length,
      pagina: 1,
      porPagina: 20
    }
  };
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return CATEGORIAS_MOCK;
}

export async function obtenerLugarPorId(id: string): Promise<Lugar | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const lugar = LUGARES_MOCK.find((l) => l.id === id);
  return lugar || null;
}