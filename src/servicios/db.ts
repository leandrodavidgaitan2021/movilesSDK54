// src/servicios/db.ts
import * as SQLite from 'expo-sqlite';

/**
 * Inicializa las tablas locales en SQLite de forma asíncrona
 * usando la instancia única provista por <SQLiteProvider onInit={...}>.
 */
export async function inicializarBaseDeDatosLocal(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`PRAGMA journal_mode = 'wal';`);

    await db.execAsync(`
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
    `);

    // Migraciones seguras por si la tabla visitas ya existía de una versión anterior sin estas columnas
    try { await db.execAsync(`ALTER TABLE visitas ADD COLUMN fotoUri TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE visitas ADD COLUMN nota TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE visitas ADD COLUMN sincronizada INTEGER NOT NULL DEFAULT 0;`); } catch {}

    console.log("SQLite inicializado correctamente.");
  } catch (error) {
    console.error("Error al inicializar las tablas en SQLite:", error);
  }
}