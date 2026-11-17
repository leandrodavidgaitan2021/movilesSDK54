// src/servicios/visitas.ts
import { type SQLiteDatabase } from 'expo-sqlite';
import { OrigenVisita, Visita } from '../tipos';
import { api } from './api';

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
 * Formatea una fecha al estándar requerido por la API: "2026-11-14T21:00:00-03:00"
 */
function formatearFechaLocalApi(fecha: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const anio = fecha.getFullYear();
  const mes = pad(fecha.getMonth() + 1);
  const dia = pad(fecha.getDate());
  const horas = pad(fecha.getHours());
  const minutos = pad(fecha.getMinutes());
  const segundos = pad(fecha.getSeconds());

  const offsetMinutos = -fecha.getTimezoneOffset();
  const signo = offsetMinutos >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutos);
  const offsetHoras = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}${signo}${offsetHoras}:${offsetMins}`;
}

function normalizarUrlApi(url: string | null | undefined): string | null {
  if (!url) return null;
  const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '');
  if (baseUrl && url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', baseUrl);
  }
  return url;
}

/**
 * Sube una foto local (file://...) a POST /archivos usando Axios.
 */
async function subirFotoAApi(fotoUri: string): Promise<string | null> {
  if (!fotoUri.startsWith('file://')) return normalizarUrlApi(fotoUri);

  const nombreArchivo = fotoUri.split('/').pop() || `visita-${Date.now()}.jpg`;
  const extension = nombreArchivo.split('.').pop()?.toLowerCase();
  const mimeType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const formData = new FormData();
  formData.append('archivo', {
    uri: fotoUri,
    name: nombreArchivo,
    type: mimeType,
  } as any);

  try {
    const res = await api.post('/archivos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const payload = res.data?.datos ?? res.data;
    const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '');

    const uriDevuelta =
      payload?.url ??
      payload?.fotoUri ??
      (payload?.clave && baseUrl ? `${baseUrl}/archivos/${payload.clave}` : null);

    return normalizarUrlApi(uriDevuelta);
  } catch (error) {
    console.warn('Error al subir foto a la API:', error);
    return null;
  }
}

/**
 * Sube o actualiza la visita en la API de forma directa y robusta.
 */
async function enviarVisitaAApi(
  lugarId: string,
  origen: OrigenVisita,
  fechaHora: string,
  fotoUri: string | null = null,
  nota: string | null = null
): Promise<boolean> {
  try {
    // 1. Subir foto primero si es un archivo local
    let urlFotoPublica: string | null = null;
    if (fotoUri) {
      urlFotoPublica = await subirFotoAApi(fotoUri);
    }

    const fechaFormateada =
      fechaHora.includes('Z') || !fechaHora.includes('-')
        ? formatearFechaLocalApi(new Date(fechaHora))
        : fechaHora;

    // 2. Intentar registrar la visita directamente mediante POST
    try {
      const resVisita = await api.post('/yo/visitas', {
        lugarId,
        origen,
        fechaHora: fechaFormateada,
        ...(urlFotoPublica ? { fotoUri: urlFotoPublica } : {}),
        ...(nota ? { nota } : {}),
      });

      const visitaCreada = resVisita.data?.datos ?? resVisita.data;
      
      // Respaldo por si el servidor creó el registro pero omitió algún campo opcional
      if (visitaCreada?.id && (urlFotoPublica || nota)) {
        const faltaFoto = urlFotoPublica && !visitaCreada.fotoUri;
        const faltaNota = nota && !visitaCreada.nota;

        if (faltaFoto || faltaNota) {
          await api.patch(`/yo/visitas/${visitaCreada.id}`, {
            ...(faltaFoto ? { fotoUri: urlFotoPublica } : {}),
            ...(faltaNota ? { nota } : {}),
          });
        }
      }
      return true;
    } catch (errPost: any) {
      // Si el POST falla porque la visita ya existe en el servidor (ej. 400 o 409 Conflict),
      // buscamos su ID en el listado para actualizarla mediante PATCH.
      if (errPost?.response?.status === 400 || errPost?.response?.status === 409 || errPost?.response?.status === 422) {
        const resExistentes = await api.get('/yo/visitas', { params: { porPagina: 100 } });
        const lista = resExistentes.data?.datos ?? resExistentes.data ?? [];
        const yaExiste = lista.find(
          (v: any) =>
            (v.lugarId ?? v.lugar?.id ?? '').toString().trim().toLowerCase() ===
            lugarId.trim().toLowerCase()
        );

        if (yaExiste?.id) {
          await api.patch(`/yo/visitas/${yaExiste.id}`, {
            ...(urlFotoPublica ? { fotoUri: urlFotoPublica } : {}),
            ...(nota !== null ? { nota } : {}),
          });
          return true;
        }
      }
      throw errPost;
    }
  } catch (error: any) {
    console.warn(
      'Fallo sincronizando visita/foto con la API:',
      error?.response?.status,
      JSON.stringify(error?.response?.data ?? error?.message)
    );
    return false;
  }
}

/**
 * Descarga las visitas del usuario desde GET /yo/visitas y las guarda en SQLite
 */
export async function hidratarVisitasDesdeApi(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<void> {
  const userLimpio = usuarioId.trim();
  if (!userLimpio) return;

  try {
    const res = await api.get('/yo/visitas');
    const lista = Array.isArray(res.data)
      ? res.data
      : res.data?.datos ?? res.data?.items ?? [];

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
        const idVisita = item.id
          ? String(item.id)
          : `vis-api-${userLimpio}-${lugarId}-${Date.now()}`;
        const fechaHora =
          item.fechaHora ?? item.creadoEn ?? formatearFechaLocalApi();
        const origen: OrigenVisita = item.origen ?? 'manual';
        const nota = item.nota ?? null;
        const fotoUri = normalizarUrlApi(item.fotoUri ?? item.fotoUrl ?? null);

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
      'No se pudo hidratar GET /yo/visitas (modo offline):',
      error?.response?.status ?? error?.message
    );
  }
}

/**
 * Registra una nueva visita o actualiza la existente en SQLite para ESTE usuario,
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
  const ahora = formatearFechaLocalApi();
  const lugarIdLimpio = lugarId.trim();
  const userLimpio = usuarioId.trim();

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

  const fotoFinal = fotoUri ?? existente?.fotoUri ?? null;
  const notaFinal = nota ?? existente?.nota ?? null;

  const sincronizadaConApi = await enviarVisitaAApi(
    lugarIdLimpio,
    origen,
    ahora,
    fotoFinal,
    notaFinal
  );

  if (existente) {
    await db.runAsync(
      `UPDATE visitas 
       SET fechaHora = ?, origen = ?, fotoUri = ?, nota = ?, sincronizada = ? 
       WHERE id = ? AND TRIM(usuarioId) = ?`,
      [
        ahora,
        origen,
        fotoFinal,
        notaFinal,
        sincronizadaConApi ? 1 : 0,
        existente.id,
        userLimpio,
      ]
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

  // Si el lugar no estava en el recorrido de este usuario, creamos un registro nuevo
  const nuevaVisita: Visita = {
    id: `vis-${Date.now()}`,
    usuarioId: userLimpio,
    lugarId: lugarIdLimpio,
    fechaHora: ahora,
    origen,
    fotoUri: fotoFinal,
    nota: notaFinal,
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
 * Obtiene las visitas del usuario activo realizando un LEFT JOIN con `lugares_cache`.
 */
export async function obtenerVisitasConLugar(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<VisitaConLugar[]> {
  const userLimpio = usuarioId.trim();

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
    console.warn(
      'No se pudo realizar el LEFT JOIN con lugares_cache, usando fallback:',
      e
    );
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
    fotoUri: string | null;
    nota: string | null;
  }>(
    'SELECT id, lugarId, origen, fechaHora, fotoUri, nota FROM visitas WHERE TRIM(usuarioId) = ? AND sincronizada = 0',
    [userLimpio]
  );

  if (pendientes.length === 0) return 0;

  let marcadas = 0;
  for (const item of pendientes) {
    const ok = await enviarVisitaAApi(
      item.lugarId,
      item.origen,
      item.fechaHora,
      item.fotoUri,
      item.nota
    );
    if (ok) {
      await db.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', [
        item.id,
      ]);
      marcadas++;
    }
  }

  return marcadas;
}