const { pool } = require('./src/config/database');

async function verificarRef10813() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando referencia REF:10813 M 3/4...\n');
    
    // 1. Buscar la referencia específica
    const ref = await client.query(`
      SELECT id, codigo, nombre 
      FROM referencias 
      WHERE codigo LIKE '%10813%' OR codigo LIKE '%REF:10813%'
    `);
    
    console.log('📋 Referencias encontradas:');
    ref.rows.forEach(r => {
      console.log(`  - ID: ${r.id}, Código: ${r.codigo}, Nombre: ${r.nombre}`);
    });
    
    if (ref.rows.length === 0) {
      console.log('❌ No se encontró la referencia REF:10813 M 3/4');
      console.log('📋 Todas las referencias disponibles:');
      const todasRefs = await client.query('SELECT id, codigo, nombre FROM referencias WHERE activa = true ORDER BY codigo');
      todasRefs.rows.forEach(r => {
        console.log(`  - ${r.codigo}: ${r.nombre}`);
      });
      return;
    }
    
    const refId = ref.rows[0].id;
    console.log(`\n🔗 Buscando relaciones para referencia ID ${refId}...`);
    
    // 2. Buscar relaciones de esta referencia
    const relaciones = await client.query(`
      SELECT 
        ro.operacion_id,
        ro.tiempo_por_referencia,
        o.nombre as operacion_nombre,
        o.tiempo_por_unidad
      FROM referencia_operaciones ro
      JOIN operaciones o ON ro.operacion_id = o.id
      WHERE ro.referencia_id = $1 AND ro.activa = true
    `, [refId]);
    
    console.log(`\n📊 Relaciones encontradas: ${relaciones.rows.length}`);
    if (relaciones.rows.length === 0) {
      console.log('❌ No hay relaciones configuradas para esta referencia');
    } else {
      relaciones.rows.forEach(rel => {
        console.log(`  - ${rel.operacion_nombre}: ${rel.tiempo_por_referencia} min (general: ${rel.tiempo_por_unidad} min)`);
      });
    }
    
    // 3. Buscar operación "ejemplo 1"
    console.log('\n🔍 Buscando operación "ejemplo 1"...');
    const operacion = await client.query(`
      SELECT id, nombre, tiempo_por_unidad 
      FROM operaciones 
      WHERE nombre LIKE '%ejemplo%' OR nombre LIKE '%1%'
    `);
    
    console.log('📋 Operaciones encontradas:');
    operacion.rows.forEach(op => {
      console.log(`  - ID: ${op.id}, Nombre: ${op.nombre}, Tiempo: ${op.tiempo_por_unidad} min`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

verificarRef10813();
