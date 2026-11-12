// src/servicios/visitas.ts
import * as Network from 'expo-network';
import { type SQLiteDatabase } from 'expo-sqlite';
import { OrigenVisita, Visita } from '../tipos/visitas';

// Interface extendida que incluye los datos del lugar
export interface VisitaConLugar extends Visita {
  lugar?: {
    nombre: string;
    imagenUrl?: string;
  };
}

export interface ResultadoRegistroVisita extends Visita {
  esNueva: boolean;
}

/**
 * Registra una nueva visita o actualiza la existente en SQLite sin duplicar el lugar.
 */
export async function registrarVisita(
  db: SQLiteDatabase,
  usuarioId: string,
  lugarId: string,
  origen: OrigenVisita,
  fotoUri: string | null = null,
  nota: string | null = null
): Promise<ResultadoRegistroVisita> {
  const estadoRed = await Network.getNetworkStateAsync();
  const hayConexion = (estadoRed.isConnected && estadoRed.isInternetReachable) ?? false;
  const ahora = new Date().toISOString();
  const lugarIdLimpio = lugarId.trim();

  // 1. Verificar si este lugar ya existe en el recorrido (sin importar mayúsculas, espacios o origen)
  const existente = await db.getFirstAsync<{
    id: string;
    fotoUri: string | null;
    nota: string | null;
  }>(
    'SELECT id, fotoUri, nota FROM visitas WHERE TRIM(LOWER(lugarId)) = TRIM(LOWER(?)) ORDER BY fechaHora DESC LIMIT 1',
    [lugarIdLimpio]
  );

  if (existente) {
    // Si ya existe, NO insertamos fila nueva. Conservamos foto y nota previas si vienen en null.
    const fotoFinal = fotoUri ?? existente.fotoUri;
    const notaFinal = nota ?? existente.nota;

    await db.runAsync(
      `UPDATE visitas 
       SET usuarioId = ?, fechaHora = ?, origen = ?, fotoUri = ?, nota = ?, sincronizada = ? 
       WHERE id = ?`,
      [usuarioId, ahora, origen, fotoFinal, notaFinal, hayConexion ? 1 : 0, existente.id]
    );

    return {
      id: existente.id,
      usuarioId,
      lugarId: lugarIdLimpio,
      fechaHora: ahora,
      origen,
      fotoUri: fotoFinal,
      nota: notaFinal,
      sincronizada: hayConexion,
      esNueva: false,
    };
  }

  // 2. Si el lugar no estaba en el recorrido, creamos un registro nuevo
  const nuevaVisita: Visita = {
    id: `vis-${Date.now()}`,
    usuarioId,
    lugarId: lugarIdLimpio,
    fechaHora: ahora,
    origen,
    fotoUri,
    nota,
    sincronizada: hayConexion,
  };

  await db.runAsync(
    `INSERT INTO visitas (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nuevaVisita.id,
      nuevaVisita.usuarioId,
      nuevaVisita.lugarId,
      nuevaVisita.fechaHora,
      nuevaVisita.origen,
      nuevaVisita.fotoUri,
      nuevaVisita.nota,
      nuevaVisita.sincronizada ? 1 : 0,
    ]
  );

  return {
    ...nuevaVisita,
    esNueva: true,
  };
}

/**
 * Obtiene todas las visitas registradas en SQLite en orden descendente.
 */
export async function obtenerVisitas(db: SQLiteDatabase): Promise<Visita[]> {
  const filas = await db.getAllAsync<{
    id: string;
    usuarioId: string;
    lugarId: string;
    fechaHora: string;
    origen: OrigenVisita;
    fotoUri: string | null;
    nota: string | null;
    sincronizada: number;
  }>('SELECT * FROM visitas ORDER BY fechaHora DESC');

  return filas.map((f) => ({
    ...f,
    sincronizada: Boolean(f.sincronizada),
  }));
}

/**
 * Obtiene las visitas realizando un LEFT JOIN con la tabla `lugares_cache` en SQLite,
 * asegurando que no se muestren lugares duplicados.
 */
export async function obtenerVisitasConLugar(db: SQLiteDatabase): Promise<VisitaConLugar[]> {
  try {
    // Limpieza automática de duplicados viejos que hayan quedado de pruebas anteriores
    // (prioriza conservar el registro que tiene foto o nota)
    await db.runAsync(`
      DELETE FROM visitas
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY TRIM(LOWER(lugarId))
                   ORDER BY (CASE WHEN fotoUri IS NOT NULL THEN 1 ELSE 0 END) DESC,
                            (CASE WHEN nota IS NOT NULL THEN 1 ELSE 0 END) DESC,
                            fechaHora DESC
                 ) as rn
          FROM visitas
        ) WHERE rn = 1
      )
    `);
  } catch {
    // Fallback si la versión de SQLite no soporta ROW_NUMBER
  }

  try {
    const filas = await db.getAllAsync<{
      id: string;
      usuarioId: string;
      lugarId: string;
      fechaHora: string;
      origen: OrigenVisita;
      fotoUri: string | null;
      nota: string | null;
      sincronizada: number;
      lugarNombre?: string;
    }>(
      `SELECT v.*, l.nombre AS lugarNombre 
       FROM visitas v 
       LEFT JOIN lugares_cache l ON TRIM(LOWER(v.lugarId)) = TRIM(LOWER(l.id)) 
       ORDER BY v.fechaHora DESC`
    );

    // Filtro extra en memoria para garantizar 1 sola tarjeta por lugar
    const vistos = new Set<string>();
    const unicas: VisitaConLugar[] = [];

    for (const f of filas) {
      const clave = f.lugarId.trim().toLowerCase();
      if (!vistos.has(clave)) {
        vistos.add(clave);
        unicas.push({
          id: f.id,
          usuarioId: f.usuarioId,
          lugarId: f.lugarId,
          fechaHora: f.fechaHora,
          origen: f.origen,
          fotoUri: f.fotoUri,
          nota: f.nota,
          sincronizada: Boolean(f.sincronizada),
          lugar: f.lugarNombre ? { nombre: f.lugarNombre } : undefined,
        });
      }
    }

    return unicas;
  } catch (e) {
    console.warn("No se pudo realizar el LEFT JOIN con lugares_cache, usando fallback:", e);
    const visitas = await obtenerVisitas(db);
    return visitas.map((v) => ({ ...v }));
  }
}

/**
 * Retorna la cantidad de lugares ÚNICOS/DISTINTOS que se han visitado.
 */
export async function cantidadLugaresVisitados(db: SQLiteDatabase): Promise<number> {
  const resultado = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(DISTINCT TRIM(LOWER(lugarId))) as total FROM visitas'
  );
  return resultado?.total ?? 0;
}

/**
 * Actualiza la foto asociada a una visita registrada y la deja lista para sincronizar.
 */
export async function actualizarFotoVisita(
  db: SQLiteDatabase,
  id: string,
  fotoUri: string
): Promise<void> {
  const estadoRed = await Network.getNetworkStateAsync();
  const hayConexion = (estadoRed.isConnected && estadoRed.isInternetReachable) ?? false;

  await db.runAsync(
    'UPDATE visitas SET fotoUri = ?, sincronizada = ? WHERE id = ?',
    [fotoUri, hayConexion ? 1 : 0, id]
  );
}

/**
 * Sincroniza las visitas pendientes con el servidor cuando hay red disponible.
 */
export async function sincronizarColaVisitas(db: SQLiteDatabase): Promise<number> {
  const estadoRed = await Network.getNetworkStateAsync();
  if (!estadoRed.isInternetReachable) return 0;

  const pendientes = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM visitas WHERE sincronizada = 0'
  );

  if (pendientes.length === 0) return 0;

  let marcadas = 0;
  for (const item of pendientes) {
    try {
      await db.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', [item.id]);
      marcadas++;
    } catch (e) {
      console.warn(`Error al sincronizar la visita con ID ${item.id}:`, e);
    }
  }

  return marcadas;
}