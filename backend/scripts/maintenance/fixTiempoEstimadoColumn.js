const { pool } = require('../../src/config/database');

async function fixTiempoEstimadoColumn() {
  const client = await pool.connect();
  try {
    console.log('🔧 Verificando y corrigiendo columna tiempo_estimado...');

    // Verificar el tipo actual de la columna
    const columnInfo = await client.query(`
      SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'produccion' AND column_name = 'tiempo_estimado'
    `);

    if (columnInfo.rows.length === 0) {
      console.log('❌ Columna tiempo_estimado no encontrada');
      return;
    }

    const currentType = columnInfo.rows[0];
    console.log('📊 Tipo actual de tiempo_estimado:', currentType);

    // Si es INTEGER, cambiarlo a DECIMAL
    if (currentType.data_type === 'integer') {
      console.log('🔄 Cambiando tipo de INTEGER a DECIMAL(10,2)...');
      await client.query(`
        ALTER TABLE produccion 
        ALTER COLUMN tiempo_estimado TYPE DECIMAL(10,2)
      `);
      console.log('✅ Columna tiempo_estimado actualizada a DECIMAL(10,2)');
    } else {
      console.log('✅ Columna tiempo_estimado ya tiene el tipo correcto');
    }

  } catch (error) {
    console.error('❌ Error actualizando columna tiempo_estimado:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { fixTiempoEstimadoColumn };
