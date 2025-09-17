const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugReferenciasCompleto() {
  let client = null;
  try {
    console.log('🔍 DEBUG COMPLETO DE REFERENCIAS');
    console.log('=====================================');
    
    client = await pool.connect();
    
    // 1. Verificar tabla referencias
    console.log('\n1️⃣ TABLA REFERENCIAS:');
    const referencias = await client.query('SELECT * FROM referencias WHERE activa = true ORDER BY codigo');
    console.log(`Total referencias: ${referencias.rows.length}`);
    referencias.rows.forEach(ref => {
      console.log(`  - ID: ${ref.id}, Código: ${ref.codigo}, Nombre: ${ref.nombre}`);
    });
    
    // 2. Verificar tabla referencia_operaciones
    console.log('\n2️⃣ TABLA REFERENCIA_OPERACIONES:');
    const relaciones = await client.query(`
      SELECT 
        ro.id,
        ro.operacion_id,
        ro.referencia_id,
        ro.tiempo_por_referencia,
        ro.activa,
        o.nombre as operacion_nombre,
        r.codigo as referencia_codigo
      FROM referencia_operaciones ro
      JOIN operaciones o ON ro.operacion_id = o.id
      JOIN referencias r ON ro.referencia_id = r.id
      WHERE ro.activa = true
      ORDER BY ro.operacion_id, ro.referencia_id
    `);
    console.log(`Total relaciones: ${relaciones.rows.length}`);
    relaciones.rows.forEach(rel => {
      console.log(`  - Operación: ${rel.operacion_nombre} ↔ Referencia: ${rel.referencia_codigo} (${rel.tiempo_por_referencia} min)`);
    });
    
    // 3. Verificar tabla produccion (últimas 10 tareas)
    console.log('\n3️⃣ TABLA PRODUCCION (últimas 10 tareas):');
    const tareas = await client.query(`
      SELECT 
        id,
        empleado_email,
        tareas,
        referencia,
        cantidad_asignada,
        cantidad_hecha,
        efectividad,
        fecha,
        estado,
        created_at
      FROM produccion 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Total tareas encontradas: ${tareas.rows.length}`);
    tareas.rows.forEach(tarea => {
      console.log(`\n  📋 Tarea ID: ${tarea.id}`);
      console.log(`     Empleado: ${tarea.empleado_email}`);
      console.log(`     Tareas: ${JSON.stringify(tarea.tareas)}`);
      console.log(`     Referencia: "${tarea.referencia}"`);
      console.log(`     Cantidad: ${tarea.cantidad_asignada}/${tarea.cantidad_hecha}`);
      console.log(`     Efectividad: ${tarea.efectividad}%`);
      console.log(`     Estado: ${tarea.estado}`);
      console.log(`     Fecha: ${tarea.fecha}`);
      console.log(`     Creada: ${tarea.created_at}`);
    });
    
    // 4. Verificar operaciones
    console.log('\n4️⃣ TABLA OPERACIONES:');
    const operaciones = await client.query('SELECT * FROM operaciones WHERE activa = true ORDER BY nombre');
    console.log(`Total operaciones: ${operaciones.rows.length}`);
    operaciones.rows.forEach(op => {
      console.log(`  - ID: ${op.id}, Nombre: ${op.nombre}, Tiempo: ${op.tiempo_por_unidad} min`);
    });
    
  } catch (error) {
    console.error('💥 Error durante el debug:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugReferenciasCompleto();
}

module.exports = { debugReferenciasCompleto };
