// src/servicios/db.ts
import * as SQLite from 'expo-sqlite';

// Instancia global por defecto para servicios que corren fuera de componentes React
export const db = SQLite.openDatabaseSync('colon_turismo.db');

/**
 * Inicializa las tablas locales en SQLite de forma asíncrona
 * usando la instancia provista o la global por defecto.
 */
export async function inicializarBaseDeDatosLocal(database?: SQLite.SQLiteDatabase) {
  const dbTarget = database ?? db;
  
  try {
    await dbTarget.execAsync(`PRAGMA journal_mode = 'wal';`);

    await dbTarget.execAsync(`
      CREATE TABLE IF NOT EXISTS lugares_cache (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        categoriaId TEXT NOT NULL,
        descripcionCorta TEXT,
        precioEntrada REAL,
        accesible INTEGER NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1,
        actualizadoEn TEXT,
        dataJson TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categorias_cache (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icono TEXT NOT NULL,
        color TEXT NOT NULL,
        orden INTEGER NOT NULL,
        dataJson TEXT NOT NULL
      );

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

      -- Tabla para almacenar los eventos guardados localmente (Agenda Offline-First)
      CREATE TABLE IF NOT EXISTS agenda_local (
        eventoId TEXT PRIMARY KEY NOT NULL,
        creadoEn TEXT NOT NULL
      );
    `);

    // Migraciones seguras por si las columnas ya existían
    try { await dbTarget.execAsync(`ALTER TABLE visitas ADD COLUMN fotoUri TEXT;`); } catch {}
    try { await dbTarget.execAsync(`ALTER TABLE visitas ADD COLUMN nota TEXT;`); } catch {}
    try { await dbTarget.execAsync(`ALTER TABLE visitas ADD COLUMN sincronizada INTEGER NOT NULL DEFAULT 0;`); } catch {}

    console.log("SQLite inicializado correctamente con agenda local.");
  } catch (error) {
    console.error("Error al inicializar las tablas en SQLite:", error);
  }
}