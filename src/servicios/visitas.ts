
import { type SQLiteDatabase } from 'expo-sqlite';
import { type OrigenVisita, type Visita } from '../tipos';
import { api } from './api';
import {
  formatearFechaLocalApi,
  normalizarUrlApi,
} from '../utils/visitas-utils';

export interface VisitaConLugar extends Visita {
  lugar?: {
    nombre: string;
    imagenUrl?: string;
  };
}

export interface ResultadoRegistroVisita extends Visita {
  esNueva: boolean;
}

interface ResultadoEnvioApi {
  success: boolean;
  idRemoto?: string;
  fotoUriPublica?: string | null;
}

/**
 * Genera un ID compatible con el backend.
 * El mismo ID se conserva en SQLite para los reintentos.
 */
function generarIdVisita(): string {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let sufijo = '';

  for (let i = 0; i < 12; i++) {
    sufijo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }

  return `vis-${Date.now().toString(36)}${sufijo}`;
}

function esIdValidoVisita(
  id: string | null | undefined
): boolean {
  return Boolean(id && /^vis-[A-Za-z0-9_-]{1,36}$/.test(id));
}

function extraerDatos(respuesta: any): any {
  return respuesta?.datos ?? respuesta;
}

function extraerVisita(respuesta: any): any {
  const datos = extraerDatos(respuesta);
  return datos?.visita ?? datos;
}

/**
 * Sube una foto local a POST /archivos.
 * Si ya es una URL, no vuelve a subirla.
 */
async function subirFotoAApi(
  fotoUri: string
): Promise<string | null> {
  if (!fotoUri) return null;

  if (!fotoUri.startsWith('file://')) {
    return normalizarUrlApi(fotoUri);
  }

  const nombreArchivo =
    fotoUri.split('/').pop() || `visita-${Date.now()}.jpg`;

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
    const respuesta = await api.post('/archivos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = extraerDatos(respuesta.data);
    const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '');

    let url =
      payload?.url ??
      payload?.fotoUri ??
      null;

    if (!url && payload?.clave && baseUrl) {
      url = `${baseUrl}/archivos/${payload.clave}`;
    }

    if (!url) {
      console.warn('La API no devolvió una URL para la foto.');
      return null;
    }

    const urlNormalizada = normalizarUrlApi(String(url));

    if (
      urlNormalizada &&
      urlNormalizada.startsWith('/') &&
      baseUrl
    ) {
      return `${baseUrl}${urlNormalizada}`;
    }

    return urlNormalizada;
  } catch (error: any) {
    console.warn(
      'Error al subir la foto:',
      error?.response?.status,
      error?.response?.data ?? error?.message
    );

    return null;
  }
}

/**
 * Envía una visita al servidor.
 *
 * Intenta PATCH con el ID estable.
 * Si el servidor responde 404, intenta POST con ese mismo ID.
 */
async function enviarVisitaAApi(
  id: string,
  lugarId: string,
  origen: OrigenVisita,
  fechaHora: string,
  fotoUri: string | null,
  nota: string | null
): Promise<ResultadoEnvioApi> {
  try {
    let fotoUriPublica: string | null = fotoUri;

    if (fotoUri?.startsWith('file://')) {
      fotoUriPublica = await subirFotoAApi(fotoUri);

      // No marcar como sincronizada si falló la subida.
      if (!fotoUriPublica) {
        return { success: false };
      }
    } else if (fotoUri) {
      fotoUriPublica = normalizarUrlApi(fotoUri);
    }

    const fechaFormateada =
      fechaHora.includes('Z') || !fechaHora.includes('-')
        ? formatearFechaLocalApi(new Date(fechaHora))
        : fechaHora;

    // PATCH admite fotoUri y nota.
    // Enviar null permite reflejar una eliminación.
    const cuerpoPatch = {
      fotoUri: fotoUriPublica,
      nota,
    };

    if (esIdValidoVisita(id)) {
      try {
        const respuesta = await api.patch(
          `/yo/visitas/${id}`,
          cuerpoPatch
        );

        const visita = extraerVisita(respuesta.data);

        return {
          success: true,
          idRemoto: String(visita?.id ?? id),
          fotoUriPublica,
        };
      } catch (error: any) {
        // Solo si no existe el ID, intentar crearlo.
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }

    // POST con ID estable: permite que el backend reconozca
    // los reintentos de una misma visita.
    const cuerpoPost = {
      id,
      lugarId,
      fechaHora: fechaFormateada,
      origen,
      fotoUri: fotoUriPublica,
      nota,
    };

    const respuesta = await api.post(
      '/yo/visitas',
      cuerpoPost
    );

    const visita = extraerVisita(respuesta.data);

    return {
      success: true,
      idRemoto: String(visita?.id ?? id),
      fotoUriPublica,
    };
  } catch (error: any) {
    console.warn(
      'Fallo sincronizando visita:',
      error?.response?.status,
      error?.response?.data ?? error?.message
    );

    return { success: false };
  }
}

/**
 * Descarga todas las páginas de visitas del usuario.
 * El backend devuelve { datos, meta }.
 */
async function obtenerTodasLasVisitasApi(): Promise<any[]> {
  const acumuladas: any[] = [];
  let pagina = 1;
  const porPagina = 100;

  while (pagina <= 100) {
    const respuesta = await api.get('/yo/visitas', {
      params: {
        pagina,
        porPagina,
      },
    });

    const contenido = respuesta.data;

    const datos = Array.isArray(contenido)
      ? contenido
      : contenido?.datos ?? contenido?.items ?? [];

    if (!Array.isArray(datos) || datos.length === 0) {
      break;
    }

    acumuladas.push(...datos);

    const meta = contenido?.meta;

    if (!meta) {
      break;
    }

    const total = Number(meta.total ?? 0);
    const paginaActual = Number(meta.pagina ?? pagina);
    const limite = Number(meta.porPagina ?? porPagina);

    if (total > 0 && paginaActual * limite >= total) {
      break;
    }

    if (datos.length < limite) {
      break;
    }

    pagina++;
  }

  return acumuladas;
}

/**
 * Descarga las visitas del servidor y actualiza SQLite.
 * No sobrescribe registros locales pendientes de sincronización.
 */
export async function hidratarVisitasDesdeApi(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<void> {
  const userLimpio = usuarioId.trim();

  if (!userLimpio) return;

  try {
    const lista = await obtenerTodasLasVisitasApi();

    for (const item of lista) {
      const lugarId = String(
        item.lugarId ?? item.lugar?.id ?? ''
      ).trim();

      const idRemoto = item.id
        ? String(item.id)
        : null;

      if (!lugarId || !idRemoto) continue;

      const fechaHora =
        item.fechaHora ??
        item.creadoEn ??
        formatearFechaLocalApi();

      const origen: OrigenVisita =
        item.origen ?? 'manual';

      const fotoUri = normalizarUrlApi(
        item.fotoUri ?? item.fotoUrl ?? null
      );

      const nota = item.nota ?? null;

      // Buscar primero por ID remoto.
      let existente = await db.getFirstAsync<{
        id: string;
        sincronizada: number;
      }>(
        `SELECT id, sincronizada
         FROM visitas
         WHERE TRIM(usuarioId) = ? AND id = ?
         LIMIT 1`,
        [userLimpio, idRemoto]
      );

      // Si no existe, buscar una visita local del mismo lugar.
      if (!existente) {
        existente = await db.getFirstAsync<{
          id: string;
          sincronizada: number;
        }>(
          `SELECT id, sincronizada
           FROM visitas
           WHERE TRIM(usuarioId) = ?
             AND LOWER(TRIM(lugarId)) = LOWER(TRIM(?))
           ORDER BY fechaHora DESC
           LIMIT 1`,
          [userLimpio, lugarId]
        );
      }

      if (!existente) {
        await db.runAsync(
          `INSERT OR IGNORE INTO visitas
           (id, usuarioId, lugarId, fechaHora, origen,
            fotoUri, nota, sincronizada)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            idRemoto,
            userLimpio,
            lugarId,
            fechaHora,
            origen,
            fotoUri,
            nota,
          ]
        );

        continue;
      }

      // Proteger cambios locales que todavía no llegaron al servidor.
      if (!Boolean(existente.sincronizada)) {
        continue;
      }

      // Reemplazar el ID temporal por el ID del servidor.
      if (existente.id !== idRemoto) {
        await db.runAsync(
          `UPDATE visitas
           SET id = ?
           WHERE id = ? AND TRIM(usuarioId) = ?`,
          [idRemoto, existente.id, userLimpio]
        );
      }

      // Actualizar también los valores null: pueden representar
      // una foto o nota eliminada desde el otro teléfono.
      await db.runAsync(
        `UPDATE visitas
         SET lugarId = ?,
             fechaHora = ?,
             origen = ?,
             fotoUri = ?,
             nota = ?,
             sincronizada = 1
         WHERE id = ? AND TRIM(usuarioId) = ?`,
        [
          lugarId,
          fechaHora,
          origen,
          fotoUri,
          nota,
          idRemoto,
          userLimpio,
        ]
      );
    }
  } catch (error: any) {
    console.warn(
      'No se pudieron descargar las visitas. Se conserva SQLite local:',
      error?.response?.status ?? error?.message
    );
  }
}

/**
 * Registra una visita en SQLite y luego intenta sincronizarla.
 * Si no hay internet, permanece guardada localmente.
 */
export async function registrarVisita(
  db: SQLiteDatabase,
  usuarioId: string,
  lugarId: string,
  origen: OrigenVisita,
  fotoUri: string | null = null,
  nota: string | null = null
): Promise<ResultadoRegistroVisita> {
  const userLimpio = usuarioId.trim();
  const lugarIdLimpio = lugarId.trim();

  if (!userLimpio) {
    throw new Error('No se identificó al usuario.');
  }

  if (!lugarIdLimpio) {
    throw new Error('No se identificó el lugar.');
  }

  const ahora = formatearFechaLocalApi();

  const existente = await db.getFirstAsync<{
    id: string;
    fotoUri: string | null;
    nota: string | null;
    sincronizada: number;
  }>(
    `SELECT id, fotoUri, nota, sincronizada
     FROM visitas
     WHERE TRIM(usuarioId) = ?
       AND LOWER(TRIM(lugarId)) = LOWER(TRIM(?))
     ORDER BY fechaHora DESC
     LIMIT 1`,
    [userLimpio, lugarIdLimpio]
  );

  const esNueva = !existente;
  const id = existente?.id ?? generarIdVisita();

  const fotoFinal = fotoUri ?? existente?.fotoUri ?? null;
  const notaFinal = nota ?? existente?.nota ?? null;

  // Guardar primero en SQLite para no perder datos offline.
  if (existente) {
    await db.runAsync(
      `UPDATE visitas
       SET fechaHora = ?,
           origen = ?,
           fotoUri = ?,
           nota = ?,
           sincronizada = 0
       WHERE id = ? AND TRIM(usuarioId) = ?`,
      [
        ahora,
        origen,
        fotoFinal,
        notaFinal,
        id,
        userLimpio,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO visitas
       (id, usuarioId, lugarId, fechaHora, origen,
        fotoUri, nota, sincronizada)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        userLimpio,
        lugarIdLimpio,
        ahora,
        origen,
        fotoFinal,
        notaFinal,
      ]
    );
  }

  const resultadoApi = await enviarVisitaAApi(
    id,
    lugarIdLimpio,
    origen,
    ahora,
    fotoFinal,
    notaFinal
  );

  const idFinal = resultadoApi.idRemoto ?? id;

  const fotoFinalGuardada =
    resultadoApi.success
      ? resultadoApi.fotoUriPublica ?? null
      : fotoFinal;

  if (idFinal !== id) {
    await db.runAsync(
      `UPDATE visitas
       SET id = ?
       WHERE id = ? AND TRIM(usuarioId) = ?`,
      [idFinal, id, userLimpio]
    );
  }

  await db.runAsync(
    `UPDATE visitas
     SET fotoUri = ?,
         sincronizada = ?
     WHERE id = ? AND TRIM(usuarioId) = ?`,
    [
      fotoFinalGuardada,
      resultadoApi.success ? 1 : 0,
      idFinal,
      userLimpio,
    ]
  );

  return {
    id: idFinal,
    usuarioId: userLimpio,
    lugarId: lugarIdLimpio,
    fechaHora: ahora,
    origen,
    fotoUri: fotoFinalGuardada,
    nota: notaFinal,
    sincronizada: resultadoApi.success,
    esNueva,
  };
}

/**
 * Obtiene las visitas locales del usuario.
 */
export async function obtenerVisitas(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<Visita[]> {
  const userLimpio = usuarioId.trim();

  const filas = await db.getAllAsync<any>(
    `SELECT *
     FROM visitas
     WHERE TRIM(usuarioId) = ?
     ORDER BY fechaHora DESC`,
    [userLimpio]
  );

  return filas.map((f) => ({
    ...f,
    sincronizada: Boolean(f.sincronizada),
  }));
}

/**
 * Obtiene las visitas junto con el nombre del lugar.
 */
export async function obtenerVisitasConLugar(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<VisitaConLugar[]> {
  const userLimpio = usuarioId.trim();

  try {
    const filas = await db.getAllAsync<any>(
      `SELECT v.*, l.nombre AS lugarNombre
       FROM visitas v
       LEFT JOIN lugares_cache l
         ON LOWER(TRIM(v.lugarId)) = LOWER(TRIM(l.id))
       WHERE TRIM(v.usuarioId) = ?
       ORDER BY v.fechaHora DESC`,
      [userLimpio]
    );

    const vistos = new Set<string>();
    const unicas: VisitaConLugar[] = [];

    for (const f of filas) {
      const clave = f.lugarId.trim().toLowerCase();

      if (vistos.has(clave)) continue;

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
        lugar: f.lugarNombre
          ? { nombre: f.lugarNombre }
          : undefined,
      });
    }

    return unicas;
  } catch (error) {
    console.warn('Error en JOIN de visitas:', error);

    const visitas = await obtenerVisitas(db, userLimpio);

    return visitas.map((v) => ({ ...v }));
  }
}

/**
 * Cuenta los lugares distintos visitados por el usuario.
 */
export async function cantidadLugaresVisitados(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<number> {
  const resultado = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(DISTINCT LOWER(TRIM(lugarId))) AS total
     FROM visitas
     WHERE TRIM(usuarioId) = ?`,
    [usuarioId.trim()]
  );

  return resultado?.total ?? 0;
}

/**
 * Actualiza la foto local y la deja pendiente de sincronización.
 */
export async function actualizarFotoVisita(
  db: SQLiteDatabase,
  id: string,
  fotoUri: string
): Promise<void> {
  await db.runAsync(
    `UPDATE visitas
     SET fotoUri = ?, sincronizada = 0
     WHERE id = ?`,
    [fotoUri, id]
  );
}

/**
 * Sincroniza todas las visitas pendientes del usuario.
 */
export async function sincronizarColaVisitas(
  db: SQLiteDatabase,
  usuarioId: string
): Promise<number> {
  const userLimpio = usuarioId.trim();

  if (!userLimpio) return 0;

  const pendientes = await db.getAllAsync<any>(
    `SELECT id, lugarId, origen, fechaHora,
            fotoUri, nota
     FROM visitas
     WHERE TRIM(usuarioId) = ?
       AND sincronizada = 0
     ORDER BY fechaHora ASC`,
    [userLimpio]
  );

  let marcadas = 0;

  for (const item of pendientes) {
    const resultado = await enviarVisitaAApi(
      item.id,
      item.lugarId,
      item.origen,
      item.fechaHora,
      item.fotoUri,
      item.nota
    );

    if (!resultado.success) {
      // Se conserva la visita y la foto local para reintentar.
      continue;
    }

    const idFinal = resultado.idRemoto ?? item.id;

    if (idFinal !== item.id) {
      await db.runAsync(
        `UPDATE visitas
         SET id = ?
         WHERE id = ? AND TRIM(usuarioId) = ?`,
        [idFinal, item.id, userLimpio]
      );
    }

    await db.runAsync(
      `UPDATE visitas
       SET fotoUri = ?,
           sincronizada = 1
       WHERE id = ? AND TRIM(usuarioId) = ?`,
      [
        resultado.fotoUriPublica ?? null,
        idFinal,
        userLimpio,
      ]
    );

    marcadas++;
  }

  return marcadas;
}
