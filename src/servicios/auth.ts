// src/servicios/auth.ts
import { api } from './api';

export interface IngresoDto {
  email: string;
  contrasena: string;
}

export interface RegistroDto {
  nombre: string;
  email: string;
  contrasena: string;
}

export interface RespuestaSesion {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

export async function apiIngresar(dto: IngresoDto): Promise<RespuestaSesion> {
  const response = await api.post('/auth/ingreso', dto);
  return response.data.datos; 
}

export async function apiRegistrar(dto: RegistroDto): Promise<RespuestaSesion> {
  const response = await api.post('/auth/registro', dto);
  return response.data.datos;
}