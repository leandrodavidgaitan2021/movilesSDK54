// src/servicios/db.ts
import * as SQLite from 'expo-sqlite';

// Abre o crea la base de datos local del proyecto
const db = SQLite.openDatabaseSync('colon_turismo.db');

/**
 * Inicializa y crea las tablas locales reflejando fielmente
 * las interfaces Lugar y Categoria de TypeScript.
 */
export function inicializarBaseDeDatosLocal() {
  try {
    db.execSync(`
      -- 1. Caché de Lugares (Refleja la interfaz Lugar)
      CREATE TABLE IF NOT EXISTS lugares_cache (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        categoriaId TEXT NOT NULL,
        descripcionCorta TEXT,
        precioEntrada REAL,
        accesible INTEGER NOT NULL, -- 0 o 1 (booleano en SQLite)
        activo INTEGER NOT NULL,    -- 0 o 1
        actualizadoEn TEXT NOT NULL,
        dataJson TEXT NOT NULL      -- Guarda el objeto Lugar completo en formato JSON
      );

      -- 2. Caché de Categorías (Refleja la interfaz Categoria)
      CREATE TABLE IF NOT EXISTS categorias_cache (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        icono TEXT NOT NULL,
        color TEXT NOT NULL,
        orden INTEGER NOT NULL,
        dataJson TEXT NOT NULL      -- Guarda el objeto Categoria completo en formato JSON
      );
    `);
    console.log("Base de datos local SQLite inicializada y sincronizada con los tipos.");
  } catch (error) {
    console.error("Error al inicializar las tablas en SQLite:", error);
  }
}

// Ejecutamos la inicialización automáticamente al importar el módulo
inicializarBaseDeDatosLocal();

export { db };