// src/servicios/usuario.ts
import { api } from "./api";

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre?: string;
  foto?: string | null;
  preferencias?: any;
  categoriasFavoritas?: string[];
}

export function extraerCategoriasFavoritas(
  perfil: PerfilUsuario | null,
): string[] {
  if (!perfil) return [];
  if (Array.isArray(perfil.categoriasFavoritas))
    return perfil.categoriasFavoritas;
  if (Array.isArray(perfil.preferencias)) return perfil.preferencias;
  if (Array.isArray(perfil.preferencias?.categoriasFavoritas)) {
    return perfil.preferencias.categoriasFavoritas;
  }
  if (Array.isArray(perfil.preferencias?.categorias)) {
    return perfil.preferencias.categorias;
  }
  return [];
}

export async function obtenerMiPerfil(): Promise<PerfilUsuario> {
  const response = await api.get("/yo");
  return response.data?.datos || response.data?.usuario || response.data;
}

export async function actualizarCategoriasFavoritas(
  perfilActual: PerfilUsuario | null,
  categoriasIds: string[],
): Promise<PerfilUsuario> {
  const payload =
    perfilActual && Array.isArray(perfilActual.categoriasFavoritas)
      ? { categoriasFavoritas: categoriasIds }
      : perfilActual?.preferencias &&
          typeof perfilActual.preferencias === "object" &&
          !Array.isArray(perfilActual.preferencias)
        ? {
            preferencias: {
              ...perfilActual.preferencias,
              categoriasFavoritas: categoriasIds,
            },
          }
        : { preferencias: categoriasIds };

  const response = await api.patch("/yo", payload);
  return response.data?.datos || response.data?.usuario || response.data;
}
