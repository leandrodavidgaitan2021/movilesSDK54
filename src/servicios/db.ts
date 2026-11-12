// src/servicios/db.ts
import * as SQLite from 'expo-sqlite';

// Abre o crea la base de datos local del proyecto
export const db = SQLite.openDatabaseSync('colon_turismo.db');

/**
 * Inicializa las tablas locales en SQLite de forma asíncrona.
 * Es compatible para pasarlo en `onInit` de <SQLiteProvider> o ejecutarlo al iniciar la app.
 */
export async function inicializarBaseDeDatosLocal(database?: SQLite.SQLiteDatabase) {
  const dbInstancia = database ?? db;

  try {
    // Modo WAL recomendado para optimizar lecturas/escrituras locales
    await dbInstancia.execAsync(`PRAGMA journal_mode = 'wal';`);

    await dbInstancia.execAsync(`
      -- 1. Caché de Lugares (Refleja la interfaz Lugar)
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

      -- 2. Caché de Categorías (Refleja la interfaz Categoria)
      CREATE TABLE IF NOT EXISTS categorias_cache (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icono TEXT NOT NULL,
        color TEXT NOT NULL,
        orden INTEGER NOT NULL,
        dataJson TEXT NOT NULL
      );

      -- 3. Bitácora de Visitas (Faltaba esta tabla para la pantalla Recorrido)
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

    console.log("Base de datos SQLite local inicializada correctamente con la tabla 'visitas'.");
  } catch (error) {
    console.error("Error al inicializar las tablas en SQLite:", error);
  }
}

// Ejecutamos la creación síncrona al importar por compatibilidad inmediata
try {
  db.execSync(`
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
} catch (e) {
  console.warn("Advertencia en inicialización inicial síncrona:", e);
}