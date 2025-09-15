const { pool } = require('../../src/config/database');

async function migrateToMultipleReferences() {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando migración a múltiples referencias...');

    // 1. Verificar que la tabla referencia_operaciones existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'referencia_operaciones'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('📝 Creando tabla referencia_operaciones...');
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
    }

    // 2. Migrar datos existentes de operaciones con referencia_id
    console.log('📝 Migrando operaciones existentes...');
    const operacionesConReferencia = await client.query(`
      SELECT id, referencia_id 
      FROM operaciones 
      WHERE referencia_id IS NOT NULL
    `);

    let migradas = 0;
    for (const operacion of operacionesConReferencia.rows) {
      try {
        await client.query(`
          INSERT INTO referencia_operaciones (referencia_id, operacion_id, orden, activa)
          VALUES ($1, $2, 1, true)
          ON CONFLICT (referencia_id, operacion_id) DO NOTHING
        `, [operacion.referencia_id, operacion.id]);
        migradas++;
      } catch (error) {
        console.log(`⚠️ Error migrando operación ${operacion.id}:`, error.message);
      }
    }

    console.log(`✅ ${migradas} operaciones migradas exitosamente`);

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

    // 4. Verificar migración
    const totalOperaciones = await client.query('SELECT COUNT(*) FROM operaciones');
    const totalRelaciones = await client.query('SELECT COUNT(*) FROM referencia_operaciones');
    
    console.log(`📊 Estadísticas de migración:`);
    console.log(`   - Total operaciones: ${totalOperaciones.rows[0].count}`);
    console.log(`   - Total relaciones: ${totalRelaciones.rows[0].count}`);

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { migrateToMultipleReferences };

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateToMultipleReferences()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en migración:', error);
      process.exit(1);
    });
}
