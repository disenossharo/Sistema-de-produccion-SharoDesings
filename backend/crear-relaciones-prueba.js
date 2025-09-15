const { pool } = require('./src/config/database');

async function crearRelacionesPrueba() {
  const client = await pool.connect();
  try {
    console.log('🔗 Creando relaciones de prueba entre operaciones y referencias...\n');
    
    // Obtener operaciones y referencias
    const operaciones = await client.query('SELECT id, nombre FROM operaciones WHERE activa = true ORDER BY id');
    const referencias = await client.query('SELECT id, codigo, nombre FROM referencias WHERE activa = true ORDER BY id');
    
    console.log(`📋 Operaciones disponibles: ${operaciones.rows.length}`);
    console.log(`📋 Referencias disponibles: ${referencias.rows.length}\n`);
    
    // Crear relaciones de prueba con tiempos específicos
    const relacionesPrueba = [
      // Coser cuello (id: 1) con diferentes referencias
      { operacion_id: 1, referencia_id: 1, tiempo: 1.5 }, // REF-101: 1.5 min
      { operacion_id: 1, referencia_id: 2, tiempo: 2.0 }, // REF-202: 2.0 min
      { operacion_id: 1, referencia_id: 3, tiempo: 1.2 }, // REF-303: 1.2 min
      
      // Pegar botones (id: 2) con diferentes referencias
      { operacion_id: 2, referencia_id: 1, tiempo: 3.0 }, // REF-101: 3.0 min
      { operacion_id: 2, referencia_id: 2, tiempo: 2.5 }, // REF-202: 2.5 min
      { operacion_id: 2, referencia_id: 4, tiempo: 4.0 }, // REF-404: 4.0 min
      
      // Dobladillar manga (id: 3) con diferentes referencias
      { operacion_id: 3, referencia_id: 1, tiempo: 2.0 }, // REF-101: 2.0 min
      { operacion_id: 3, referencia_id: 3, tiempo: 1.8 }, // REF-303: 1.8 min
      { operacion_id: 3, referencia_id: 5, tiempo: 1.5 }, // REF-505: 1.5 min
      
      // Coser costuras (id: 141) con diferentes referencias
      { operacion_id: 141, referencia_id: 1, tiempo: 1.2 }, // REF-101: 1.2 min
      { operacion_id: 141, referencia_id: 2, tiempo: 1.5 }, // REF-202: 1.5 min
      { operacion_id: 141, referencia_id: 3, tiempo: 1.0 }, // REF-303: 1.0 min
      { operacion_id: 141, referencia_id: 4, tiempo: 1.3 }, // REF-404: 1.3 min
      { operacion_id: 141, referencia_id: 5, tiempo: 1.1 }, // REF-505: 1.1 min
    ];
    
    console.log('📝 Creando relaciones...');
    let creadas = 0;
    let actualizadas = 0;
    
    for (const rel of relacionesPrueba) {
      try {
        // Verificar si ya existe la relación
        const existe = await client.query(
          'SELECT id FROM referencia_operaciones WHERE operacion_id = $1 AND referencia_id = $2',
          [rel.operacion_id, rel.referencia_id]
        );
        
        if (existe.rows.length > 0) {
          // Actualizar tiempo si ya existe
          await client.query(
            'UPDATE referencia_operaciones SET tiempo_por_referencia = $1, activa = true WHERE operacion_id = $2 AND referencia_id = $3',
            [rel.tiempo, rel.operacion_id, rel.referencia_id]
          );
          actualizadas++;
          console.log(`  ✅ Actualizada: Operación ${rel.operacion_id} ↔ Referencia ${rel.referencia_id} (${rel.tiempo} min)`);
        } else {
          // Crear nueva relación
          await client.query(
            'INSERT INTO referencia_operaciones (operacion_id, referencia_id, tiempo_por_referencia, activa, created_at) VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)',
            [rel.operacion_id, rel.referencia_id, rel.tiempo]
          );
          creadas++;
          console.log(`  ➕ Creada: Operación ${rel.operacion_id} ↔ Referencia ${rel.referencia_id} (${rel.tiempo} min)`);
        }
      } catch (error) {
        console.error(`  ❌ Error con relación ${rel.operacion_id} ↔ ${rel.referencia_id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`  - Relaciones creadas: ${creadas}`);
    console.log(`  - Relaciones actualizadas: ${actualizadas}`);
    console.log(`  - Total procesadas: ${creadas + actualizadas}`);
    
    // Verificar el resultado final
    console.log('\n🔍 Verificando relaciones finales...');
    const relacionesFinales = await client.query(`
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
    
    console.log(`Total relaciones activas: ${relacionesFinales.rows.length}`);
    relacionesFinales.rows.forEach(rel => {
      console.log(`  - ${rel.operacion_nombre} ↔ ${rel.referencia_codigo} (${rel.tiempo_por_referencia} min)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

crearRelacionesPrueba();
