const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'produccion_sharo',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
}

// Función para crear las tablas si no existen
async function createTables() {
  const client = await pool.connect();
  try {
    // Tabla de empleados
    await client.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255),
        apellidos VARCHAR(255),
        cedula VARCHAR(50),
        cargo_maquina VARCHAR(255),
        password_hash VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de producción
    await client.query(`
      CREATE TABLE IF NOT EXISTS produccion (
        id SERIAL PRIMARY KEY,
        empleado_email VARCHAR(255) REFERENCES empleados(email),
        tareas TEXT[],
        referencia VARCHAR(255),
        cantidad_asignada INTEGER DEFAULT 0,
        cantidad_hecha INTEGER DEFAULT 0,
        hora_inicio TIMESTAMP,
        hora_fin TIMESTAMP,
        efectividad DECIMAL(5,2),
        observaciones TEXT,
        fecha VARCHAR(50),
        tiempo_estimado INTEGER DEFAULT 0,
        tiempo_transcurrido DECIMAL(10,2) DEFAULT 0,
        estado VARCHAR(50) DEFAULT 'en_progreso',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de presencia (para tracking de empleados online)
    await client.query(`
      CREATE TABLE IF NOT EXISTS presencia (
        id SERIAL PRIMARY KEY,
        empleado_email VARCHAR(255) UNIQUE REFERENCES empleados(email),
        online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testConnection,
  createTables
}; 