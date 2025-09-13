const { pool } = require('../../src/config/database');

async function allowDuplicateOperationNames() {
  const client = await pool.connect();
  try {
    console.log('🔄 Modificando tabla operaciones para permitir nombres duplicados con diferentes referencias...');

    // Primero, eliminar la restricción UNIQUE del nombre
    await client.query(`
      ALTER TABLE operaciones 
      DROP CONSTRAINT IF EXISTS operaciones_nombre_key
    `);
    console.log('✅ Restricción UNIQUE del nombre eliminada');

    // Agregar una restricción UNIQUE compuesta (nombre, referencia_id)
    // Esto permite el mismo nombre para diferentes referencias
    await client.query(`
      ALTER TABLE operaciones 
      ADD CONSTRAINT operaciones_nombre_referencia_unique 
      UNIQUE (nombre, referencia_id)
    `);
    console.log('✅ Restricción UNIQUE compuesta (nombre, referencia_id) agregada');

    // Verificar que la modificación fue exitosa
    const result = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'operaciones' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('📋 Restricciones UNIQUE actuales en operaciones:');
    result.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });

    console.log('✅ Modificación completada exitosamente');
    console.log('💡 Ahora puedes crear operaciones con el mismo nombre para diferentes referencias');
    
  } catch (error) {
    console.error('❌ Error al modificar tabla operaciones:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  allowDuplicateOperationNames()
    .then(() => {
      console.log('🎉 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = allowDuplicateOperationNames;