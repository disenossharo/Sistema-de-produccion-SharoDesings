const { pool } = require('../../src/config/database');

async function allowDuplicateOperationNames() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Modificando restricción de unicidad en operaciones...');
    
    // Verificar si la columna referencia_id existe
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones' 
      AND column_name = 'referencia_id'
    `);
    
    if (columnExists.rows.length === 0) {
      console.log('📝 Agregando columna referencia_id a operaciones...');
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN referencia_id INTEGER REFERENCES referencias(id) ON DELETE SET NULL
      `);
      console.log('✅ Columna referencia_id agregada');
    } else {
      console.log('✅ Columna referencia_id ya existe');
    }
    
    // Eliminar la restricción UNIQUE del nombre
    console.log('🗑️ Eliminando restricción UNIQUE del nombre...');
    await client.query(`
      ALTER TABLE operaciones 
      DROP CONSTRAINT IF EXISTS operaciones_nombre_key
    `);
    console.log('✅ Restricción UNIQUE del nombre eliminada');
    
    // Crear nueva restricción UNIQUE para nombre + referencia_id
    console.log('🔗 Creando nueva restricción UNIQUE para (nombre, referencia_id)...');
    await client.query(`
      ALTER TABLE operaciones 
      ADD CONSTRAINT operaciones_nombre_referencia_unique 
      UNIQUE (nombre, referencia_id)
    `);
    console.log('✅ Nueva restricción UNIQUE creada');
    
    console.log('🎉 Migración completada exitosamente');
    console.log('📋 Ahora se pueden crear operaciones con el mismo nombre pero diferentes referencias');
    console.log('⚠️ No se pueden crear operaciones con el mismo nombre Y la misma referencia');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  allowDuplicateOperationNames()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = allowDuplicateOperationNames;
