const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createProductionTables() {
  const client = await pool.connect();
  try {
    console.log('🏗️ Creando tablas para el sistema de producción...');

    // Tabla de operaciones (reemplaza las tareas hardcodeadas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS operaciones (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        descripcion TEXT,
        tiempo_por_unidad DECIMAL(5,2) NOT NULL DEFAULT 1.0,
        video_tutorial VARCHAR(500),
        activa BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla operaciones creada');

    // Tabla de referencias/prendas (reemplaza las referencias hardcodeadas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS referencias (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(100),
        activa BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla referencias creada');

    // Insertar datos iniciales de operaciones
    const operacionesIniciales = [
      {
        nombre: 'Coser cuello',
        descripcion: 'Unir el cuello a la prenda de manera precisa y uniforme.',
        tiempo_por_unidad: 1.0,
        video_tutorial: 'https://www.youtube.com/watch?v=video1'
      },
      {
        nombre: 'Pegar botones',
        descripcion: 'Coser los botones en la prenda siguiendo el patrón establecido.',
        tiempo_por_unidad: 2.0,
        video_tutorial: 'https://www.youtube.com/watch?v=video2'
      },
      {
        nombre: 'Dobladillar manga',
        descripcion: 'Hacer el dobladillo en la manga con acabado profesional.',
        tiempo_por_unidad: 1.5,
        video_tutorial: 'https://www.youtube.com/watch?v=video3'
      },
      {
        nombre: 'Coser costuras',
        descripcion: 'Realizar costuras rectas y uniformes en las prendas.',
        tiempo_por_unidad: 0.8,
        video_tutorial: 'https://www.youtube.com/watch?v=video4'
      },
      {
        nombre: 'Planchar prenda',
        descripcion: 'Planchar la prenda para darle el acabado final.',
        tiempo_por_unidad: 1.2,
        video_tutorial: 'https://www.youtube.com/watch?v=video5'
      }
    ];

    for (const operacion of operacionesIniciales) {
      await client.query(`
        INSERT INTO operaciones (nombre, descripcion, tiempo_por_unidad, video_tutorial)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (nombre) DO NOTHING
      `, [operacion.nombre, operacion.descripcion, operacion.tiempo_por_unidad, operacion.video_tutorial]);
    }
    console.log('✅ Operaciones iniciales insertadas');

    // Insertar datos iniciales de referencias
    const referenciasIniciales = [
      {
        codigo: 'REF-101',
        nombre: 'Blusa Clásica',
        descripcion: 'Blusa de manga corta con cuello redondo, ideal para uso diario.',
        categoria: 'Blusas'
      },
      {
        codigo: 'REF-202',
        nombre: 'Pantalón Recto',
        descripcion: 'Pantalón de corte recto con cintura elástica.',
        categoria: 'Pantalones'
      },
      {
        codigo: 'REF-303',
        nombre: 'Vestido Casual',
        descripcion: 'Vestido de corte casual con estampado floral.',
        categoria: 'Vestidos'
      },
      {
        codigo: 'REF-404',
        nombre: 'Camisa Formal',
        descripcion: 'Camisa de manga larga con cuello formal.',
        categoria: 'Camisas'
      },
      {
        codigo: 'REF-505',
        nombre: 'Falda Plisada',
        descripcion: 'Falda plisada con cintura alta.',
        categoria: 'Faldas'
      }
    ];

    for (const referencia of referenciasIniciales) {
      await client.query(`
        INSERT INTO referencias (codigo, nombre, descripcion, categoria)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (codigo) DO NOTHING
      `, [referencia.codigo, referencia.nombre, referencia.descripcion, referencia.categoria]);
    }
    console.log('✅ Referencias iniciales insertadas');

    console.log('🎉 Tablas de producción creadas exitosamente');

  } catch (error) {
    console.error('❌ Error creando tablas de producción:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createProductionTables()
    .then(() => {
      console.log('🏁 Script completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { createProductionTables };
