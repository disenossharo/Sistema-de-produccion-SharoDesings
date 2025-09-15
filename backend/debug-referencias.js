const { pool } = require('./src/config/database');

async function debugReferencias() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando datos de referencias y operaciones...\n');
    
    // 1. Verificar operaciones
    console.log('📋 OPERACIONES:');
    const operaciones = await client.query('SELECT id, nombre, tiempo_por_unidad FROM operaciones WHERE activa = true ORDER BY id');
    console.log(`Total operaciones activas: ${operaciones.rows.length}`);
    operaciones.rows.forEach(op => {
      console.log(`  - ${op.id}: ${op.nombre} (${op.tiempo_por_unidad} min/unidad)`);
    });
    
    // 2. Verificar referencias
    console.log('\n📋 REFERENCIAS:');
    const referencias = await client.query('SELECT id, codigo, nombre FROM referencias WHERE activa = true ORDER BY id');
    console.log(`Total referencias activas: ${referencias.rows.length}`);
    referencias.rows.forEach(ref => {
      console.log(`  - ${ref.id}: ${ref.codigo} - ${ref.nombre}`);
    });
    
    // 3. Verificar relaciones referencia_operaciones
    console.log('\n🔗 RELACIONES REFERENCIA-OPERACIONES:');
    const relaciones = await client.query(`
      SELECT 
        ro.operacion_id,
        ro.referencia_id,
        ro.tiempo_por_referencia,
        o.nombre as operacion_nombre,
        r.codigo as referencia_codigo,
        r.nombre as referencia_nombre
      FROM referencia_operaciones ro
      JOIN operaciones o ON ro.operacion_id = o.id
      JOIN referencias r ON ro.referencia_id = r.id
      WHERE ro.activa = true
      ORDER BY ro.operacion_id, ro.referencia_id
    `);
    
    console.log(`Total relaciones activas: ${relaciones.rows.length}`);
    if (relaciones.rows.length === 0) {
      console.log('❌ NO HAY RELACIONES CONFIGURADAS!');
      console.log('   Esto explica por qué no funciona el cálculo por referencia.');
    } else {
      relaciones.rows.forEach(rel => {
        console.log(`  - ${rel.operacion_nombre} ↔ ${rel.referencia_codigo} (${rel.tiempo_por_referencia || 'NULL'} min)`);
      });
    }
    
    // 4. Verificar estructura de la tabla referencia_operaciones
    console.log('\n🏗️ ESTRUCTURA TABLA referencia_operaciones:');
    const estructura = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'referencia_operaciones'
      ORDER BY ordinal_position
    `);
    estructura.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

debugReferencias();
