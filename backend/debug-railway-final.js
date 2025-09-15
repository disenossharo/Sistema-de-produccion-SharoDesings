// Script para debuggear el problema final en Railway
const { pool } = require('./src/config/database');

async function debugRailwayFinal() {
  const client = await pool.connect();
  try {
    console.log('🔍 Debuggeando problema final en Railway...\n');
    
    // 1. Verificar la referencia REF:10813 M 3/4
    console.log('1️⃣ Buscando referencia REF:10813 M 3/4...');
    const ref = await client.query(`
      SELECT id, codigo, nombre 
      FROM referencias 
      WHERE codigo LIKE '%10813%' OR codigo LIKE '%REF:10813%'
    `);
    
    if (ref.rows.length === 0) {
      console.log('❌ Referencia REF:10813 M 3/4 no encontrada');
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
      return;
    }
    
    const opId = operacion.rows[0].id;
    console.log(`✅ Operación encontrada: ID=${opId}, Nombre=${operacion.rows[0].nombre}, Tiempo=${operacion.rows[0].tiempo_por_unidad} min`);
    
    // 3. Verificar la relación específica
    console.log('\n3️⃣ Verificando relación específica...');
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
      console.log('\n📋 Creando relación de prueba...');
      
      // Crear la relación con tiempo específico
      await client.query(`
        INSERT INTO referencia_operaciones (operacion_id, referencia_id, tiempo_por_referencia, activa, created_at, updated_at)
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (operacion_id, referencia_id) 
        DO UPDATE SET 
          tiempo_por_referencia = $3,
          activa = true,
          updated_at = CURRENT_TIMESTAMP
      `, [opId, refId, 2.0]);
      
      console.log('✅ Relación creada con tiempo_por_referencia = 2.0 min');
    } else {
      const rel = relacion.rows[0];
      console.log(`✅ Relación encontrada:`);
      console.log(`  - Operación: ${rel.operacion_nombre} (${rel.tiempo_por_unidad} min general)`);
      console.log(`  - Referencia: ${rel.referencia_codigo}`);
      console.log(`  - Tiempo específico: ${rel.tiempo_por_referencia} min`);
      console.log(`  - Activa: ${rel.activa}`);
      
      if (!rel.tiempo_por_referencia || rel.tiempo_por_referencia <= 0) {
        console.log('\n🔧 Actualizando tiempo_por_referencia...');
        await client.query(`
          UPDATE referencia_operaciones 
          SET tiempo_por_referencia = $1, updated_at = CURRENT_TIMESTAMP
          WHERE operacion_id = $2 AND referencia_id = $3
        `, [2.0, opId, refId]);
        console.log('✅ Tiempo_por_referencia actualizado a 2.0 min');
      }
    }
    
    // 4. Probar la query exacta que usa el backend
    console.log('\n4️⃣ Probando query del backend...');
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
      
      // 5. Simular el cálculo
      console.log('\n5️⃣ Simulando cálculo...');
      const cantidadAsignada = 12;
      let tiempoTotal = 0;
      
      for (const ref of op.referencias) {
        if (ref.codigo === 'REF:10813 M 3/4') {
          const tiempoEspecifico = ref.tiempo_por_referencia;
          if (tiempoEspecifico && tiempoEspecifico > 0) {
            tiempoTotal += tiempoEspecifico;
            console.log(`✅ Usando tiempo específico: ${tiempoEspecifico} min`);
          } else {
            tiempoTotal += op.tiempo_por_unidad;
            console.log(`⚠️ Usando tiempo por unidad: ${op.tiempo_por_unidad} min`);
          }
        }
      }
      
      const tiempoFinal = tiempoTotal * cantidadAsignada;
      console.log(`📊 Resultado: ${tiempoTotal} min/uni × ${cantidadAsignada} uni = ${tiempoFinal} min`);
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

debugRailwayFinal();
