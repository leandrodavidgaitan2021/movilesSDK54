// src/servicios/auth.ts
import { api } from './api';

export interface IngresoDto {
  email: string;
  contrasena: string;
}

export interface RespuestaSesion {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    // Agrega más campos si tu contrato lo requiere
  };
}

export async function apiIngresar(dto: IngresoDto): Promise<RespuestaSesion> {
  const response = await api.post('/auth/ingreso', dto);
  // El backend responde con { datos: { token, usuario } } gracias a respuestaUno()
  return response.data.datos; 
}