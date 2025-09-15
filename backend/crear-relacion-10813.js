// Script para crear la relación REF:10813 M 3/4 con ejemplo 1
const { pool } = require('./src/config/database');

async function crearRelacion10813() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creando relación REF:10813 M 3/4 con ejemplo 1...\n');
    
    // 1. Buscar la referencia REF:10813 M 3/4
    console.log('1️⃣ Buscando referencia REF:10813 M 3/4...');
    const ref = await client.query(`
      SELECT id, codigo, nombre 
      FROM referencias 
      WHERE codigo LIKE '%10813%' OR codigo LIKE '%REF:10813%'
    `);
    
    if (ref.rows.length === 0) {
      console.log('❌ Referencia REF:10813 M 3/4 no encontrada');
      console.log('📋 Creando referencia...');
      
      await client.query(`
        INSERT INTO referencias (codigo, nombre, descripcion, activa, created_at, updated_at)
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, ['REF:10813 M 3/4', 'BLUSON TENCEL ESCALERILLA', 'Referencia de prueba', true]);
      
      const nuevaRef = await client.query(`
        SELECT id, codigo, nombre FROM referencias WHERE codigo = 'REF:10813 M 3/4'
      `);
      ref.rows = nuevaRef.rows;
      console.log('✅ Referencia creada');
    }
    
    const refId = ref.rows[0].id;
    console.log(`✅ Referencia: ID=${refId}, Código=${ref.rows[0].codigo}`);
    
    // 2. Buscar la operación "ejemplo 1"
    console.log('\n2️⃣ Buscando operación "ejemplo 1"...');
    const operacion = await client.query(`
      SELECT id, nombre, tiempo_por_unidad 
      FROM operaciones 
      WHERE nombre LIKE '%ejemplo%' OR nombre LIKE '%1%'
    `);
    
    if (operacion.rows.length === 0) {
      console.log('❌ Operación "ejemplo 1" no encontrada');
      console.log('📋 Creando operación...');
      
      await client.query(`
        INSERT INTO operaciones (nombre, descripcion, tiempo_por_unidad, activa, created_at, updated_at)
        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, ['ejemplo 1', 'Operación de prueba', 1.0, true]);
      
      const nuevaOp = await client.query(`
        SELECT id, nombre, tiempo_por_unidad FROM operaciones WHERE nombre = 'ejemplo 1'
      `);
      operacion.rows = nuevaOp.rows;
      console.log('✅ Operación creada');
    }
    
    const opId = operacion.rows[0].id;
    console.log(`✅ Operación: ID=${opId}, Nombre=${operacion.rows[0].nombre}, Tiempo=${operacion.rows[0].tiempo_por_unidad} min`);
    
    // 3. Crear/actualizar la relación
    console.log('\n3️⃣ Creando/actualizando relación...');
    await client.query(`
      INSERT INTO referencia_operaciones (operacion_id, referencia_id, tiempo_por_referencia, activa, created_at, updated_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (operacion_id, referencia_id) 
      DO UPDATE SET 
        tiempo_por_referencia = $3,
        activa = true,
        updated_at = CURRENT_TIMESTAMP
    `, [opId, refId, 2.0]);
    
    console.log('✅ Relación creada/actualizada con tiempo_por_referencia = 2.0 min');
    
    // 4. Verificar la relación
    console.log('\n4️⃣ Verificando relación...');
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
    
    if (relacion.rows.length > 0) {
      const rel = relacion.rows[0];
      console.log(`✅ Relación verificada:`);
      console.log(`  - Operación: ${rel.operacion_nombre} (${rel.tiempo_por_unidad} min general)`);
      console.log(`  - Referencia: ${rel.referencia_codigo}`);
      console.log(`  - Tiempo específico: ${rel.tiempo_por_referencia} min`);
      console.log(`  - Activa: ${rel.activa}`);
      
      // 5. Probar el cálculo
      console.log('\n5️⃣ Probando cálculo...');
      const cantidadAsignada = 12;
      const tiempoEspecifico = rel.tiempo_por_referencia;
      const tiempoFinal = tiempoEspecifico * cantidadAsignada;
      
      console.log(`📊 Cálculo: ${tiempoEspecifico} min/uni × ${cantidadAsignada} uni = ${tiempoFinal} min`);
      console.log(`✅ ¡Ahora debería calcular 24 minutos!`);
    } else {
      console.log('❌ Error: No se pudo verificar la relación');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

crearRelacion10813();
