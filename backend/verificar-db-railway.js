const { pool } = require('./src/config/database');

async function verificarDBRailway() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando configuración de base de datos...\n');
    
    // Mostrar configuración actual
    console.log('📋 Configuración de conexión:');
    console.log(`  - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  - Database: ${process.env.DB_NAME || 'produccion_sharo'}`);
    console.log(`  - User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`  - Port: ${process.env.DB_PORT || 5432}`);
    
    // Verificar si estamos conectados a Railway
    const isRailway = process.env.DB_HOST && process.env.DB_HOST.includes('railway');
    console.log(`\n🚂 ¿Conectado a Railway?: ${isRailway ? 'SÍ' : 'NO'}`);
    
    // Buscar la referencia REF:10813 M 3/4
    console.log('\n🔍 Buscando referencia REF:10813 M 3/4...');
    const ref = await client.query(`
      SELECT id, codigo, nombre 
      FROM referencias 
      WHERE codigo LIKE '%10813%' OR codigo LIKE '%REF:10813%'
    `);
    
    if (ref.rows.length > 0) {
      console.log('✅ Referencia encontrada:');
      ref.rows.forEach(r => {
        console.log(`  - ID: ${r.id}, Código: ${r.codigo}, Nombre: ${r.nombre}`);
      });
      
      // Buscar relaciones de esta referencia
      const refId = ref.rows[0].id;
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
      
      console.log(`\n🔗 Relaciones encontradas: ${relaciones.rows.length}`);
      relaciones.rows.forEach(rel => {
        console.log(`  - ${rel.operacion_nombre}: ${rel.tiempo_por_referencia} min (general: ${rel.tiempo_por_unidad} min)`);
      });
      
    } else {
      console.log('❌ Referencia REF:10813 M 3/4 no encontrada');
      console.log('\n📋 Todas las referencias disponibles:');
      const todasRefs = await client.query('SELECT id, codigo, nombre FROM referencias WHERE activa = true ORDER BY codigo LIMIT 10');
      todasRefs.rows.forEach(r => {
        console.log(`  - ${r.codigo}: ${r.nombre}`);
      });
    }
    
    // Buscar operación "ejemplo 1"
    console.log('\n🔍 Buscando operación "ejemplo 1"...');
    const operacion = await client.query(`
      SELECT id, nombre, tiempo_por_unidad 
      FROM operaciones 
      WHERE nombre LIKE '%ejemplo%' OR nombre LIKE '%1%'
    `);
    
    if (operacion.rows.length > 0) {
      console.log('✅ Operaciones encontradas:');
      operacion.rows.forEach(op => {
        console.log(`  - ID: ${op.id}, Nombre: ${op.nombre}, Tiempo: ${op.tiempo_por_unidad} min`);
      });
    } else {
      console.log('❌ Operación "ejemplo 1" no encontrada');
      console.log('\n📋 Todas las operaciones disponibles:');
      const todasOps = await client.query('SELECT id, nombre, tiempo_por_unidad FROM operaciones WHERE activa = true ORDER BY nombre LIMIT 10');
      todasOps.rows.forEach(op => {
        console.log(`  - ${op.nombre}: ${op.tiempo_por_unidad} min`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

verificarDBRailway();
