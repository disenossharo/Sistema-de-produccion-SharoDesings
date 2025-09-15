const { pool } = require('../../src/config/database');

async function syncRailwayStructure() {
  const client = await pool.connect();
  try {
    console.log('🔄 Sincronizando estructura con Railway...');

    // 1. Verificar estructura actual de operaciones
    console.log('\n📋 Verificando estructura actual de operaciones...');
    const operacionesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'operaciones'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas actuales en operaciones:');
    operacionesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Agregar columnas que faltan según Railway
    console.log('\n🔧 Agregando columnas faltantes...');
    
    // Verificar y agregar video_tutorial
    const hasVideoTutorial = operacionesColumns.rows.some(col => col.column_name === 'video_tutorial');
    if (!hasVideoTutorial) {
      console.log('📝 Agregando columna video_tutorial...');
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN video_tutorial TEXT DEFAULT NULL
      `);
      console.log('✅ Columna video_tutorial agregada');
    } else {
      console.log('ℹ️ Columna video_tutorial ya existe');
    }

    // Verificar y agregar cr (created_at)
    const hasCr = operacionesColumns.rows.some(col => col.column_name === 'cr');
    if (!hasCr) {
      console.log('📝 Agregando columna cr...');
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN cr TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna cr agregada');
    } else {
      console.log('ℹ️ Columna cr ya existe');
    }

    // 3. Verificar estructura de referencia_operaciones
    console.log('\n📋 Verificando estructura de referencia_operaciones...');
    const refOpColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones'
      ORDER BY ordinal_position
    `);
    
    console.log('Columnas actuales en referencia_operaciones:');
    refOpColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 4. Verificar que tiempo_por_referencia existe
    const hasTiempoPorReferencia = refOpColumns.rows.some(col => col.column_name === 'tiempo_por_referencia');
    if (!hasTiempoPorReferencia) {
      console.log('📝 Agregando columna tiempo_por_referencia...');
      await client.query(`
        ALTER TABLE referencia_operaciones 
        ADD COLUMN tiempo_por_referencia DECIMAL(5,2) DEFAULT NULL
      `);
      console.log('✅ Columna tiempo_por_referencia agregada');
    } else {
      console.log('ℹ️ Columna tiempo_por_referencia ya existe');
    }

    // 5. Verificar datos existentes
    console.log('\n📊 Verificando datos existentes...');
    const operacionesCount = await client.query('SELECT COUNT(*) FROM operaciones');
    const refOpCount = await client.query('SELECT COUNT(*) FROM referencia_operaciones');
    const referenciasCount = await client.query('SELECT COUNT(*) FROM referencias');
    
    console.log(`  - Operaciones: ${operacionesCount.rows[0].count}`);
    console.log(`  - Referencia_operaciones: ${refOpCount.rows[0].count}`);
    console.log(`  - Referencias: ${referenciasCount.rows[0].count}`);

    // 6. Probar consulta de operaciones
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
      console.log('📊 Resultados de prueba:');
      testQuery.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.nombre} (${row.tiempo_por_unidad} min) - Activa: ${row.activa}`);
      });
      
    } catch (error) {
      console.error('❌ Error en consulta de prueba:', error.message);
    }

    console.log('\n🎉 Sincronización completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { syncRailwayStructure };

// Ejecutar si se llama directamente
if (require.main === module) {
  syncRailwayStructure()
    .then(() => {
      console.log('✅ Sincronización completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en sincronización:', error);
      process.exit(1);
    });
}
