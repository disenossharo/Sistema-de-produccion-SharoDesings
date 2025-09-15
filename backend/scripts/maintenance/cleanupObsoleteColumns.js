const { pool } = require('../../src/config/database');

async function cleanupObsoleteColumns() {
  const client = await pool.connect();
  try {
    console.log('🧹 Limpiando columnas obsoletas...');

    // 1. Verificar si existe la columna referencia_id en operaciones
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones' AND column_name = 'referencia_id'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('📝 Eliminando columna obsoleta referencia_id de operaciones...');
      
      // Eliminar la columna referencia_id de operaciones
      await client.query(`
        ALTER TABLE operaciones 
        DROP COLUMN IF EXISTS referencia_id
      `);
      
      console.log('✅ Columna referencia_id eliminada de operaciones');
    } else {
      console.log('ℹ️ Columna referencia_id no existe en operaciones');
    }

    // 2. Verificar que la columna tiempo_por_referencia existe en referencia_operaciones
    const checkTiempoColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones' AND column_name = 'tiempo_por_referencia'
    `;
    
    const tiempoColumnExists = await client.query(checkTiempoColumnQuery);
    
    if (tiempoColumnExists.rows.length === 0) {
      console.log('📝 Agregando columna tiempo_por_referencia...');
      
      // Agregar la columna tiempo_por_referencia
      await client.query(`
        ALTER TABLE referencia_operaciones 
        ADD COLUMN tiempo_por_referencia DECIMAL(5,2) DEFAULT NULL
      `);
      
      console.log('✅ Columna tiempo_por_referencia agregada');
      
      // Migrar tiempos existentes
      console.log('📝 Migrando tiempos existentes...');
      const operacionesConTiempo = await client.query(`
        SELECT o.id, o.tiempo_por_unidad, ro.id as relacion_id
        FROM operaciones o
        JOIN referencia_operaciones ro ON o.id = ro.operacion_id
        WHERE o.tiempo_por_unidad IS NOT NULL
      `);

      let migradas = 0;
      for (const operacion of operacionesConTiempo.rows) {
        try {
          await client.query(`
            UPDATE referencia_operaciones 
            SET tiempo_por_referencia = $1
            WHERE id = $2
          `, [operacion.tiempo_por_unidad, operacion.relacion_id]);
          migradas++;
        } catch (error) {
          console.log(`⚠️ Error migrando operación ${operacion.id}:`, error.message);
        }
      }

      console.log(`✅ ${migradas} tiempos migrados exitosamente`);

      // Crear índice
      console.log('📝 Creando índice...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_referencia_operaciones_tiempo 
        ON referencia_operaciones(tiempo_por_referencia)
      `);
      
      console.log('✅ Índice creado');
    } else {
      console.log('ℹ️ Columna tiempo_por_referencia ya existe');
    }

    // 3. Verificar estructura final
    console.log('\n📋 Verificando estructura final...');
    
    const operacionesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones'
      ORDER BY ordinal_position
    `);
    console.log('Operaciones columns:', operacionesColumns.rows.map(c => c.column_name));
    
    const referenciaOperacionesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones'
      ORDER BY ordinal_position
    `);
    console.log('Referencia_operaciones columns:', referenciaOperacionesColumns.rows.map(c => c.column_name));

    console.log('🎉 Limpieza completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { cleanupObsoleteColumns };

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupObsoleteColumns()
    .then(() => {
      console.log('✅ Limpieza completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en limpieza:', error);
      process.exit(1);
    });
}
