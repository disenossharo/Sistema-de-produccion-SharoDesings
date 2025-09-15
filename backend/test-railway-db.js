// Script para probar la base de datos de Railway desde el backend
const { pool } = require('./src/config/database');

async function testRailwayDB() {
  const client = await pool.connect();
  try {
    console.log('🔍 Probando base de datos de Railway...\n');
    
    // Mostrar configuración
    console.log('📋 Configuración de conexión:');
    console.log(`  - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  - Database: ${process.env.DB_NAME || 'produccion_sharo'}`);
    console.log(`  - User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`  - Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? 'Presente' : 'Ausente'}`);
    
    // Verificar si estamos en Railway
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
    console.log(`\n🚂 ¿Ejecutándose en Railway?: ${isRailway ? 'SÍ' : 'NO'}`);
    
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
    }
    
    // Probar el endpoint de operaciones
    console.log('\n🧪 Probando endpoint de operaciones...');
    const operaciones = await client.query(`
      SELECT 
        o.id, o.nombre, o.tiempo_por_unidad,
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
      WHERE o.activa = true
      GROUP BY o.id, o.nombre, o.tiempo_por_unidad
      ORDER BY o.nombre
    `);
    
    console.log(`📊 Total operaciones: ${operaciones.rows.length}`);
    operaciones.rows.forEach(op => {
      console.log(`  - ${op.nombre}: ${op.tiempo_por_unidad} min (${op.referencias.length} referencias)`);
      if (op.referencias.length > 0) {
        op.referencias.forEach(ref => {
          console.log(`    └─ ${ref.codigo}: ${ref.tiempo_por_referencia} min`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testRailwayDB();
