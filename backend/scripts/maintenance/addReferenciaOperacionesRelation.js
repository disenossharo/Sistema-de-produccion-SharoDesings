const { pool } = require('../../src/config/database');

async function addReferenciaOperacionesRelation() {
  const client = await pool.connect();
  try {
    console.log('🔗 Creando relación entre referencias y operaciones...');

    // 1. Agregar columna referencia_id a operaciones si no existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones' AND column_name = 'referencia_id'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      console.log('📝 Agregando columna referencia_id a operaciones...');
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN referencia_id INTEGER REFERENCES referencias(id) ON DELETE SET NULL
      `);
      console.log('✅ Columna referencia_id agregada');
    } else {
      console.log('ℹ️ Columna referencia_id ya existe');
    }

    // 2. Crear tabla de relación many-to-many (opcional, para casos complejos)
    const checkJunctionTable = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'referencia_operaciones'
    `;
    
    const junctionExists = await client.query(checkJunctionTable);
    
    if (junctionExists.rows.length === 0) {
      console.log('📝 Creando tabla de relación referencia_operaciones...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS referencia_operaciones (
          id SERIAL PRIMARY KEY,
          referencia_id INTEGER NOT NULL REFERENCES referencias(id) ON DELETE CASCADE,
          operacion_id INTEGER NOT NULL REFERENCES operaciones(id) ON DELETE CASCADE,
          orden INTEGER DEFAULT 1,
          activa BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(referencia_id, operacion_id)
        )
      `);
      console.log('✅ Tabla referencia_operaciones creada');
    } else {
      console.log('ℹ️ Tabla referencia_operaciones ya existe');
    }

    // 3. Crear índices para mejor rendimiento
    console.log('📝 Creando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_operaciones_referencia_id 
      ON operaciones(referencia_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referencia_operaciones_referencia_id 
      ON referencia_operaciones(referencia_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referencia_operaciones_operacion_id 
      ON referencia_operaciones(operacion_id)
    `);
    
    console.log('✅ Índices creados');

    console.log('🎉 Relación entre referencias y operaciones configurada exitosamente');

  } catch (error) {
    console.error('❌ Error configurando relación referencias-operaciones:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { addReferenciaOperacionesRelation };

// Ejecutar si se llama directamente
if (require.main === module) {
  addReferenciaOperacionesRelation()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en migración:', error);
      process.exit(1);
    });
}
