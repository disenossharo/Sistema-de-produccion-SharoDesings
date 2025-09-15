// Script para debuggear el cálculo de tiempo en Railway
const { pool } = require('./src/config/database');

async function debugTiempoCalculo() {
  const client = await pool.connect();
  try {
    console.log('🔍 Debuggeando cálculo de tiempo en Railway...\n');
    
    // 1. Verificar la referencia REF:10813 M 3/4
    console.log('1️⃣ Buscando referencia REF:10813 M 3/4...');
    const ref = await client.query(`
      SELECT id, codigo, nombre 
      FROM referencias 
      WHERE codigo LIKE '%10813%' OR codigo LIKE '%REF:10813%'
    `);
    
    if (ref.rows.length === 0) {
      console.log('❌ Referencia REF:10813 M 3/4 no encontrada');
      console.log('\n📋 Todas las referencias disponibles:');
      const todasRefs = await client.query('SELECT id, codigo, nombre FROM referencias WHERE activa = true ORDER BY codigo LIMIT 10');
      todasRefs.rows.forEach(r => {
        console.log(`  - ${r.codigo}: ${r.nombre}`);
      });
      return;
    }
    
    const refId = ref.rows[0].id;
    console.log(`✅ Referencia encontrada: ID=${refId}, Código=${ref.rows[0].codigo}`);
    
    // 2. Verificar la operación "ejemplo 1"
    console.log('\n2️⃣ Buscando operación "ejemplo 1"...');
    const operacion = await client.query(`
      SELECT id, nombre, tiempo_por_unidad 
      FROM operaciones 
      WHERE nombre LIKE '%ejemplo%' OR nombre LIKE '%1%'
    `);
    
    if (operacion.rows.length === 0) {
      console.log('❌ Operación "ejemplo 1" no encontrada');
      console.log('\n📋 Todas las operaciones disponibles:');
      const todasOps = await client.query('SELECT id, nombre, tiempo_por_unidad FROM operaciones WHERE activa = true ORDER BY nombre LIMIT 10');
      todasOps.rows.forEach(op => {
        console.log(`  - ${op.nombre}: ${op.tiempo_por_unidad} min`);
      });
      return;
    }
    
    const opId = operacion.rows[0].id;
    console.log(`✅ Operación encontrada: ID=${opId}, Nombre=${operacion.rows[0].nombre}, Tiempo=${operacion.rows[0].tiempo_por_unidad} min`);
    
    // 3. Verificar la relación entre la referencia y la operación
    console.log('\n3️⃣ Verificando relación referencia-operación...');
    const relacion = await client.query(`
      SELECT 
        ro.operacion_id,
        ro.referencia_id,
        ro.tiempo_por_referencia,
        ro.activa,
        o.nombre as operacion_nombre,
        o.tiempo_por_unidad,
        r.codigo as referencia_codigo
      FROM referencia_operaciones ro
      JOIN operaciones o ON ro.operacion_id = o.id
      JOIN referencias r ON ro.referencia_id = r.id
      WHERE ro.operacion_id = $1 AND ro.referencia_id = $2
    `, [opId, refId]);
    
    if (relacion.rows.length === 0) {
      console.log('❌ No hay relación entre la operación y la referencia');
      console.log('\n📋 Relaciones disponibles para esta operación:');
      const relacionesOps = await client.query(`
        SELECT 
          ro.referencia_id,
          r.codigo,
          ro.tiempo_por_referencia
        FROM referencia_operaciones ro
        JOIN referencias r ON ro.referencia_id = r.id
        WHERE ro.operacion_id = $1 AND ro.activa = true
      `, [opId]);
      relacionesOps.rows.forEach(rel => {
        console.log(`  - ${rel.codigo}: ${rel.tiempo_por_referencia} min`);
      });
      return;
    }
    
    const rel = relacion.rows[0];
    console.log(`✅ Relación encontrada:`);
    console.log(`  - Operación: ${rel.operacion_nombre} (${rel.tiempo_por_unidad} min general)`);
    console.log(`  - Referencia: ${rel.referencia_codigo}`);
    console.log(`  - Tiempo específico: ${rel.tiempo_por_referencia} min`);
    console.log(`  - Activa: ${rel.activa}`);
    
    // 4. Simular el cálculo que hace el backend
    console.log('\n4️⃣ Simulando cálculo del backend...');
    const tiempoEspecifico = rel.tiempo_por_referencia || rel.tiempo_por_unidad;
    const cantidadAsignada = 12;
    const tiempoTotal = tiempoEspecifico * cantidadAsignada;
    
    console.log(`📊 Cálculo:`);
    console.log(`  - Tiempo específico: ${tiempoEspecifico} min/unidad`);
    console.log(`  - Cantidad asignada: ${cantidadAsignada} unidades`);
    console.log(`  - Tiempo total: ${tiempoTotal} min`);
    
    // 5. Probar la query exacta que usa el backend
    console.log('\n5️⃣ Probando query del backend...');
    const queryResult = await client.query(`
      SELECT o.id, o.nombre, o.tiempo_por_unidad,
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
      WHERE o.id = $1 AND o.activa = true
      GROUP BY o.id, o.nombre, o.tiempo_por_unidad
    `, [opId]);
    
    if (queryResult.rows.length > 0) {
      const op = queryResult.rows[0];
      console.log(`✅ Query del backend exitosa:`);
      console.log(`  - Operación: ${op.nombre}`);
      console.log(`  - Tiempo por unidad: ${op.tiempo_por_unidad} min`);
      console.log(`  - Referencias: ${op.referencias.length}`);
      op.referencias.forEach(ref => {
        console.log(`    └─ ${ref.codigo}: ${ref.tiempo_por_referencia} min`);
      });
    } else {
      console.log('❌ Query del backend falló');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

debugTiempoCalculo();
