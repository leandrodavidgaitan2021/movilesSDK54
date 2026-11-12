import { type SQLiteDatabase } from 'expo-sqlite';

export async function migrarBaseDatos(db: SQLiteDatabase) {
  const VERSION_OBJETIVO = 1;
  const resultado = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let versionActual = resultado?.user_version ?? 0;

  if (versionActual >= VERSION_OBJETIVO) return;

  if (versionActual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY NOT NULL,
        usuarioId TEXT NOT NULL,
        lugarId TEXT NOT NULL,
        fechaHora TEXT NOT NULL,
        origen TEXT NOT NULL,
        fotoUri TEXT,
        nota TEXT,
        sincronizada INTEGER NOT NULL DEFAULT 0
      );
    `);
    versionActual = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${VERSION_OBJETIVO}`);
}