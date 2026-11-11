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
  };
}

export async function apiIngresar(dto: IngresoDto): Promise<RespuestaSesion> {
  const response = await api.post('/auth/ingreso', dto);
  return response.data.datos; 
}