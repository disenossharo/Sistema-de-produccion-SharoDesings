const { pool } = require('../../src/config/database');

async function addTiempoPorReferencia() {
  const client = await pool.connect();
  try {
    console.log('🔄 Agregando campo tiempo_por_referencia...');

    // 1. Agregar columna tiempo_por_referencia a referencia_operaciones
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones' AND column_name = 'tiempo_por_referencia'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      console.log('📝 Agregando columna tiempo_por_referencia...');
      await client.query(`
        ALTER TABLE referencia_operaciones 
        ADD COLUMN tiempo_por_referencia DECIMAL(5,2) DEFAULT NULL
      `);
      console.log('✅ Columna tiempo_por_referencia agregada');
    } else {
      console.log('ℹ️ Columna tiempo_por_referencia ya existe');
    }

    // 2. Migrar tiempos existentes desde operaciones
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

    // 3. Crear índice para mejor rendimiento
    console.log('📝 Creando índice...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referencia_operaciones_tiempo 
      ON referencia_operaciones(tiempo_por_referencia)
    `);
    
    console.log('✅ Índice creado');

    // 4. Verificar migración
    const totalRelaciones = await client.query('SELECT COUNT(*) FROM referencia_operaciones');
    const conTiempo = await client.query('SELECT COUNT(*) FROM referencia_operaciones WHERE tiempo_por_referencia IS NOT NULL');
    
    console.log(`📊 Estadísticas de migración:`);
    console.log(`   - Total relaciones: ${totalRelaciones.rows[0].count}`);
    console.log(`   - Con tiempo específico: ${conTiempo.rows[0].count}`);

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { addTiempoPorReferencia };

// Ejecutar si se llama directamente
if (require.main === module) {
  addTiempoPorReferencia()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en migración:', error);
      process.exit(1);
    });
}
