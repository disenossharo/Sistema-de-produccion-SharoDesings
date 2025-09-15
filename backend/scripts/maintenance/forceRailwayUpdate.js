const { pool } = require('../../src/config/database');

async function forceRailwayUpdate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Forzando actualización de Railway...');

    // 1. Eliminar columna referencia_id si existe
    console.log('\n🧹 Limpiando columnas obsoletas...');
    try {
      await client.query(`
        ALTER TABLE operaciones 
        DROP COLUMN IF EXISTS referencia_id
      `);
      console.log('✅ Columna referencia_id eliminada (si existía)');
    } catch (error) {
      console.log('ℹ️ Columna referencia_id no existe o ya fue eliminada');
    }

    // 2. Agregar columnas faltantes
    console.log('\n📝 Agregando columnas faltantes...');
    
    // Agregar video_tutorial
    try {
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN video_tutorial TEXT DEFAULT NULL
      `);
      console.log('✅ Columna video_tutorial agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Columna video_tutorial ya existe');
      } else {
        throw error;
      }
    }

    // Agregar cr
    try {
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN cr TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna cr agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Columna cr ya existe');
      } else {
        throw error;
      }
    }

    // 3. Verificar y agregar tiempo_por_referencia
    console.log('\n⏱️ Verificando columna tiempo_por_referencia...');
    try {
      await client.query(`
        ALTER TABLE referencia_operaciones 
        ADD COLUMN tiempo_por_referencia DECIMAL(5,2) DEFAULT NULL
      `);
      console.log('✅ Columna tiempo_por_referencia agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Columna tiempo_por_referencia ya existe');
      } else {
        throw error;
      }
    }

    // 4. Migrar tiempos existentes
    console.log('\n📊 Migrando tiempos existentes...');
    const operacionesConTiempo = await client.query(`
      SELECT o.id, o.tiempo_por_unidad, ro.id as relacion_id
      FROM operaciones o
      JOIN referencia_operaciones ro ON o.id = ro.operacion_id
      WHERE o.tiempo_por_unidad IS NOT NULL AND ro.tiempo_por_referencia IS NULL
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

    // 5. Crear índices
    console.log('\n📝 Creando índices...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_referencia_operaciones_tiempo 
        ON referencia_operaciones(tiempo_por_referencia)
      `);
      console.log('✅ Índice de tiempo_por_referencia creado');
    } catch (error) {
      console.log('ℹ️ Índice ya existe o error:', error.message);
    }

    // 6. Verificar estructura final
    console.log('\n📋 Verificando estructura final...');
    
    const operacionesColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas en operaciones:');
    operacionesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const refOpColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas en referencia_operaciones:');
    refOpColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 7. Probar consulta de operaciones
    console.log('\n🧪 Probando consulta de operaciones...');
    try {
      const testQuery = await client.query(`
        SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, 
               o.categoria, o.activa, o.video_tutorial, o.cr,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'id', r.id,
                     'codigo', r.codigo,
                     'nombre', r.nombre,
                     'tiempo_por_referencia', COALESCE(ro.tiempo_por_referencia, o.tiempo_por_unidad)
                   )
                 ) FILTER (WHERE r.id IS NOT NULL),
                 '[]'::json
               ) as referencias
        FROM operaciones o
        LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
        LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
        GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa, o.video_tutorial, o.cr
        ORDER BY o.nombre
        LIMIT 3
      `);
      
      console.log('✅ Consulta de operaciones exitosa');
      console.log(`📊 Operaciones encontradas: ${testQuery.rows.length}`);
      
      if (testQuery.rows.length > 0) {
        console.log('🔍 Primera operación:');
        const first = testQuery.rows[0];
        console.log(`  - ID: ${first.id}`);
        console.log(`  - Nombre: ${first.nombre}`);
        console.log(`  - Tiempo: ${first.tiempo_por_unidad} min`);
        console.log(`  - Activa: ${first.activa}`);
        console.log(`  - Video: ${first.video_tutorial || 'Sin video'}`);
        console.log(`  - CR: ${first.cr || 'Sin fecha'}`);
        console.log(`  - Referencias: ${JSON.stringify(first.referencias)}`);
      }
      
    } catch (error) {
      console.error('❌ Error en consulta de prueba:', error.message);
      throw error;
    }

    console.log('\n🎉 ¡Actualización de Railway completada exitosamente!');
    console.log('✅ La base de datos está sincronizada y lista para usar');

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { forceRailwayUpdate };

// Ejecutar si se llama directamente
if (require.main === module) {
  forceRailwayUpdate()
    .then(() => {
      console.log('✅ Actualización forzada completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en actualización forzada:', error);
      process.exit(1);
    });
}
