const { pool } = require('../config/database');

async function fixPresenciaTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Verificando tabla de presencia...');
    
    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'presencia'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creando tabla de presencia...');
      await client.query(`
        CREATE TABLE presencia (
          id SERIAL PRIMARY KEY,
          empleado_email VARCHAR(255) UNIQUE REFERENCES empleados(email),
          online BOOLEAN DEFAULT FALSE,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla de presencia creada');
    } else {
      console.log('✅ Tabla de presencia ya existe');
      
      // Verificar si tiene la restricción UNIQUE
      const hasUniqueConstraint = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints 
        WHERE table_name = 'presencia' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%empleado_email%'
      `);
      
      if (parseInt(hasUniqueConstraint.rows[0].count) === 0) {
        console.log('🔧 Agregando restricción UNIQUE a empleado_email...');
        
        // Primero eliminar registros duplicados si existen
        await client.query(`
          DELETE FROM presencia 
          WHERE id NOT IN (
            SELECT MIN(id) 
            FROM presencia 
            GROUP BY empleado_email
          )
        `);
        
        // Agregar la restricción UNIQUE
        await client.query(`
          ALTER TABLE presencia 
          ADD CONSTRAINT presencia_empleado_email_unique 
          UNIQUE (empleado_email)
        `);
        
        console.log('✅ Restricción UNIQUE agregada');
      } else {
        console.log('✅ Restricción UNIQUE ya existe');
      }
    }
    
    // Verificar que hay registros de presencia para todos los empleados
    const empleadosSinPresencia = await client.query(`
      SELECT e.email, e.nombre
      FROM empleados e
      LEFT JOIN presencia p ON e.email = p.empleado_email
      WHERE p.empleado_email IS NULL
    `);
    
    if (empleadosSinPresencia.rows.length > 0) {
      console.log('📝 Creando registros de presencia para empleados faltantes...');
      
      for (const empleado of empleadosSinPresencia.rows) {
        await client.query(`
          INSERT INTO presencia (empleado_email, online, last_seen)
          VALUES ($1, false, CURRENT_TIMESTAMP)
        `, [empleado.email]);
        console.log(`✅ Registro de presencia creado para: ${empleado.nombre} (${empleado.email})`);
      }
    } else {
      console.log('✅ Todos los empleados tienen registros de presencia');
    }
    
    console.log('🎉 Verificación de tabla de presencia completada');
    
  } catch (error) {
    console.error('❌ Error verificando tabla de presencia:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPresenciaTable()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script:', error);
      process.exit(1);
    });
}

module.exports = { fixPresenciaTable };
