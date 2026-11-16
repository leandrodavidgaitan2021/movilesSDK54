// src/servicios/usuario.ts
import { api } from "./api";

export interface PreferenciasUsuario {
  categoriasFavoritas: string[];
  avisarProximidad?: boolean;
  radioAvisoMetros?: number;
  tema?: string;
}

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre?: string;
  avatarUrl?: string | null;
  preferencias?: PreferenciasUsuario;
}

export function extraerCategoriasFavoritas(
  perfil: PerfilUsuario | null,
): string[] {
  return perfil?.preferencias?.categoriasFavoritas ?? [];
}

export async function obtenerMiPerfil(): Promise<PerfilUsuario> {
  const response = await api.get("/yo");
  return response.data.datos;
}

export async function actualizarCategoriasFavoritas(
  perfilActual: PerfilUsuario | null,
  categoriasIds: string[],
): Promise<PerfilUsuario> {
  const payload = {
    preferencias: {
      ...perfilActual?.preferencias,
      categoriasFavoritas: categoriasIds,
    },
  };

  const response = await api.patch("/yo", payload);
  return response.data.datos;
}