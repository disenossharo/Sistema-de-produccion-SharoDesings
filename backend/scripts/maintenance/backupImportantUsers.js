const { pool } = require('../config/database');

async function backupImportantUsers() {
  const client = await pool.connect();
  try {
    console.log('💾 CREANDO RESPALDO DE EMPLEADOS IMPORTANTES...');
    
    // Obtener todos los empleados
    const empleados = await client.query(`
      SELECT id, email, nombre, apellidos, cedula, is_admin, activo, created_at, updated_at 
      FROM empleados 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total de empleados encontrados: ${empleados.rows.length}`);
    
    // Identificar empleados importantes (con nombres reales o que no sean claramente de prueba)
    const empleadosImportantes = empleados.rows.filter(emp => 
      emp.nombre && 
      emp.nombre.trim() !== '' && 
      emp.nombre !== 'Test User' && 
      emp.nombre !== 'Demo User' && 
      emp.nombre !== 'Admin Test' &&
      !emp.email.includes('test') &&
      !emp.email.includes('demo')
    );
    
    console.log(`👥 Empleados importantes identificados: ${empleadosImportantes.length}`);
    
    // Mostrar empleados importantes
    empleadosImportantes.forEach(emp => {
      console.log(`  ✅ ${emp.email} - ${emp.nombre} ${emp.apellidos || ''} - Admin: ${emp.is_admin} - Activo: ${emp.activo}`);
    });
    
    // Crear tabla de respaldo si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS empleados_backup (
        id INTEGER,
        email VARCHAR(255),
        nombre VARCHAR(255),
        apellidos VARCHAR(255),
        cedula VARCHAR(50),
        is_admin BOOLEAN,
        activo BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Limpiar respaldos anteriores
    await client.query('DELETE FROM empleados_backup');
    console.log('🗑️ Respaldos anteriores limpiados');
    
    // Crear respaldo de empleados importantes
    if (empleadosImportantes.length > 0) {
      for (const emp of empleadosImportantes) {
        await client.query(`
          INSERT INTO empleados_backup (id, email, nombre, apellidos, cedula, is_admin, activo, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [emp.id, emp.email, emp.nombre, emp.apellidos, emp.cedula, emp.is_admin, emp.activo, emp.created_at, emp.updated_at]);
      }
      console.log(`💾 Respaldo creado para ${empleadosImportantes.length} empleados importantes`);
    }
    
    // Verificar respaldo
    const respaldoCount = await client.query('SELECT COUNT(*) FROM empleados_backup');
    console.log(`📊 Total de empleados en respaldo: ${respaldoCount.rows[0].count}`);
    
    console.log('\n🎯 RESPALDO COMPLETADO:');
    console.log('Los empleados importantes están respaldados en la tabla empleados_backup');
    console.log('Si algo sale mal, puedes restaurarlos desde ahí');
    
  } catch (error) {
    console.error('❌ Error durante el respaldo:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Exportar la función
module.exports = { backupImportantUsers };

// Ejecutar si se llama directamente
if (require.main === module) {
  backupImportantUsers()
    .then(() => {
      console.log('\n🏁 Respaldo completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error en el respaldo:', error);
      process.exit(1);
    });
}
