const { pool } = require('../../src/config/database');

async function checkAndAddTiempoColumn() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando columna tiempo_por_referencia en producción...');

    // 1. Verificar si la columna existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones' AND column_name = 'tiempo_por_referencia'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      console.log('📝 Columna tiempo_por_referencia no existe, agregándola...');
      
      // Agregar la columna
      await client.query(`
        ALTER TABLE referencia_operaciones 
        ADD COLUMN tiempo_por_referencia DECIMAL(5,2) DEFAULT NULL
      `);
      
      console.log('✅ Columna tiempo_por_referencia agregada');
      
      // Migrar tiempos existentes desde operaciones
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

    // Verificar migración
    const totalRelaciones = await client.query('SELECT COUNT(*) FROM referencia_operaciones');
    const conTiempo = await client.query('SELECT COUNT(*) FROM referencia_operaciones WHERE tiempo_por_referencia IS NOT NULL');
    
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total relaciones: ${totalRelaciones.rows[0].count}`);
    console.log(`   - Con tiempo específico: ${conTiempo.rows[0].count}`);

    console.log('🎉 Verificación completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { checkAndAddTiempoColumn };

// Ejecutar si se llama directamente
if (require.main === module) {
  checkAndAddTiempoColumn()
    .then(() => {
      console.log('✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en verificación:', error);
      process.exit(1);
    });
}
