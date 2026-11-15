// src/servicios/visitas.ts
import { type SQLiteDatabase } from 'expo-sqlite';
import { OrigenVisita, Visita } from '../tipos/visitas';
import { api } from './api';

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
 * Envía una visita al backend usando la instancia configurada de Axios.
 * Retorna true si el servidor respondió con éxito, false si está offline o el servidor falló.
 */
async function enviarVisitaAApi(
  lugarId: string,
  origen: OrigenVisita,
  fechaHora: string
): Promise<boolean> {
  try {
    await api.post('/yo/visitas', {
      lugarId,
      origen,
      fechaHora,
    });
    return true;
  } catch (error: any) {
    console.warn(
      "Fallo POST /yo/visitas:",
      error?.response?.status,
      error?.response?.data ?? error?.message
    );
    return false;
  }
}

/**
 * Descarga las visitas del usuario desde GET /yo/visitas y las guarda en SQLite
 * aisladas por usuarioId sin pisar fotos o notas locales.
 */
export async function hidratarVisitasDesdeApi(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<void> {
  const userLimpio = usuarioId.trim();
  if (!userLimpio) return;

  try {
    const res = await api.get('/yo/visitas');
    const lista = Array.isArray(res.data) ? res.data : res.data?.items ?? [];

    for (const item of lista) {
      const lugarId = (item.lugarId ?? item.lugar?.id ?? '').toString().trim();
      if (!lugarId) continue;

      const existente = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM visitas 
         WHERE TRIM(usuarioId) = ? AND TRIM(LOWER(lugarId)) = TRIM(LOWER(?)) 
         LIMIT 1`,
        [userLimpio, lugarId]
      );

      if (!existente) {
        const idVisita = item.id ? String(item.id) : `vis-api-${userLimpio}-${lugarId}-${Date.now()}`;
        const fechaHora = item.fechaHora ?? item.creadoEn ?? new Date().toISOString();
        const origen: OrigenVisita = item.origen ?? 'manual';
        const nota = item.nota ?? null;
        const fotoUri = item.fotoUrl ?? item.fotoUri ?? null;

        await db.runAsync(
          `INSERT OR IGNORE INTO visitas 
           (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [idVisita, userLimpio, lugarId, fechaHora, origen, fotoUri, nota]
        );
      } else {
        await db.runAsync(
          `UPDATE visitas SET sincronizada = 1 WHERE id = ? AND TRIM(usuarioId) = ?`,
          [existente.id, userLimpio]
        );
      }
    }
  } catch (error: any) {
    console.warn(
      "No se pudo hidratar GET /yo/visitas (modo offline):",
      error?.response?.status ?? error?.message
    );
  }
}

/**
 * Registra una nueva visita o actualiza la existente en SQLite para ESTE usuario
 * sin duplicar el lugar ni pisar visitas de otros usuarios.
 */
export async function registrarVisita(
  db: SQLiteDatabase,
  usuarioId: string,
  lugarId: string,
  origen: OrigenVisita,
  fotoUri: string | null = null,
  nota: string | null = null
): Promise<ResultadoRegistroVisita> {
  const ahora = new Date().toISOString();
  const lugarIdLimpio = lugarId.trim();
  const userLimpio = usuarioId.trim();

  const sincronizadaConApi = await enviarVisitaAApi(lugarIdLimpio, origen, ahora);

  // 1. Verificar si ESTE usuario ya tiene este lugar en su recorrido
  const existente = await db.getFirstAsync<{
    id: string;
    fotoUri: string | null;
    nota: string | null;
  }>(
    `SELECT id, fotoUri, nota 
     FROM visitas 
     WHERE TRIM(usuarioId) = ? AND TRIM(LOWER(lugarId)) = TRIM(LOWER(?)) 
     ORDER BY fechaHora DESC LIMIT 1`,
    [userLimpio, lugarIdLimpio]
  );

  if (existente) {
    const fotoFinal = fotoUri ?? existente.fotoUri;
    const notaFinal = nota ?? existente.nota;

    await db.runAsync(
      `UPDATE visitas 
       SET fechaHora = ?, origen = ?, fotoUri = ?, nota = ?, sincronizada = ? 
       WHERE id = ? AND TRIM(usuarioId) = ?`,
      [ahora, origen, fotoFinal, notaFinal, sincronizadaConApi ? 1 : 0, existente.id, userLimpio]
    );

    return {
      id: existente.id,
      usuarioId: userLimpio,
      lugarId: lugarIdLimpio,
      fechaHora: ahora,
      origen,
      fotoUri: fotoFinal,
      nota: notaFinal,
      sincronizada: sincronizadaConApi,
      esNueva: false,
    };
  }

  // 2. Si el lugar no estaba en el recorrido de este usuario, creamos un registro nuevo
  const nuevaVisita: Visita = {
    id: `vis-${Date.now()}`,
    usuarioId: userLimpio,
    lugarId: lugarIdLimpio,
    fechaHora: ahora,
    origen,
    fotoUri,
    nota,
    sincronizada: sincronizadaConApi,
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
 * Obtiene únicamente las visitas del usuario activo en orden descendente.
 */
export async function obtenerVisitas(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<Visita[]> {
  const userLimpio = usuarioId.trim();
  const filas = await db.getAllAsync<{
    id: string;
    usuarioId: string;
    lugarId: string;
    fechaHora: string;
    origen: OrigenVisita;
    fotoUri: string | null;
    nota: string | null;
    sincronizada: number;
  }>(
    'SELECT * FROM visitas WHERE TRIM(usuarioId) = ? ORDER BY fechaHora DESC',
    [userLimpio]
  );

  return filas.map((f) => ({
    ...f,
    sincronizada: Boolean(f.sincronizada),
  }));
}

/**
 * Obtiene las visitas del usuario activo realizando un LEFT JOIN con `lugares_cache`,
 * asegurando que no se muestren lugares duplicados ni de otros usuarios.
 */
export async function obtenerVisitasConLugar(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<VisitaConLugar[]> {
  const userLimpio = usuarioId.trim();

  try {
    await db.runAsync(`
      DELETE FROM visitas
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY TRIM(usuarioId), TRIM(LOWER(lugarId))
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
       WHERE TRIM(v.usuarioId) = ?
       ORDER BY v.fechaHora DESC`,
      [userLimpio]
    );

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
    const visitas = await obtenerVisitas(db, userLimpio);
    return visitas.map((v) => ({ ...v }));
  }
}

/**
 * Retorna la cantidad de lugares ÚNICOS/DISTINTOS visitados por ESE usuario.
 */
export async function cantidadLugaresVisitados(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<number> {
  const userLimpio = usuarioId.trim();
  const resultado = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(DISTINCT TRIM(LOWER(lugarId))) as total FROM visitas WHERE TRIM(usuarioId) = ?',
    [userLimpio]
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
  await db.runAsync(
    'UPDATE visitas SET fotoUri = ?, sincronizada = 0 WHERE id = ?',
    [fotoUri, id]
  );
}

/**
 * Sincroniza las visitas pendientes del usuario activo con el servidor cuando hay red disponible.
 */
export async function sincronizarColaVisitas(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<number> {
  const userLimpio = usuarioId.trim();
  const pendientes = await db.getAllAsync<{
    id: string;
    lugarId: string;
    origen: OrigenVisita;
    fechaHora: string;
  }>(
    'SELECT id, lugarId, origen, fechaHora FROM visitas WHERE TRIM(usuarioId) = ? AND sincronizada = 0',
    [userLimpio]
  );

  if (pendientes.length === 0) return 0;

  let marcadas = 0;
  for (const item of pendientes) {
    const ok = await enviarVisitaAApi(item.lugarId, item.origen, item.fechaHora);
    if (ok) {
      await db.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', [item.id]);
      marcadas++;
    }
  }

  return marcadas;
}