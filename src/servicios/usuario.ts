// src/servicios/usuario.ts
import { api } from "./api";
import { Usuario } from "../tipos";

export function extraerCategoriasFavoritas(
  perfil: Usuario | null,
): string[] {
  return perfil?.preferencias?.categoriasFavoritas ?? [];
}

export async function obtenerMiPerfil(): Promise<Usuario> {
  const response = await api.get("/yo");
  return response.data.datos;
}

export async function actualizarCategoriasFavoritas(
  perfilActual: Usuario | null,
  categoriasIds: string[],
): Promise<Usuario> {
  const payload = {
    preferencias: {
      ...perfilActual?.preferencias,
      categoriasFavoritas: categoriasIds,
    },
  };

  const response = await api.patch("/yo", payload);
  return response.data.datos;
}