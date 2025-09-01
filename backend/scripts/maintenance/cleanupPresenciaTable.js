const { pool } = require('../config/database');

/**
 * Script para limpiar registros de presencia obsoletos
 * Este script elimina registros de empleados que no han estado activos por más de 5 minutos
 * y marca como offline a empleados que no han enviado heartbeat recientemente
 */

async function cleanupPresenciaTable() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpieza de tabla de presencia...');
    
          // 1. Marcar como offline a empleados que no han enviado heartbeat en los últimos 3 minutos
      const updateResult = await client.query(`
        UPDATE presencia 
        SET online = false 
        WHERE last_seen < NOW() - INTERVAL '3 minutes' 
        AND online = true
      `);
      
      console.log(`✅ ${updateResult.rowCount} empleados marcados como offline por inactividad`);
      
      // 2. Limpiar registros de empleados que ya no existen
      const cleanupResult = await client.query(`
        DELETE FROM presencia 
        WHERE empleado_email NOT IN (SELECT email FROM empleados)
      `);
      
      if (cleanupResult.rowCount > 0) {
        console.log(`🧹 ${cleanupResult.rowCount} registros de empleados inexistentes eliminados`);
      }
      
      // 3. Eliminar registros completamente obsoletos (más de 15 minutos)
      const deleteResult = await client.query(`
        DELETE FROM presencia 
        WHERE last_seen < NOW() - INTERVAL '15 minutes'
      `);
      
      console.log(`🗑️ ${deleteResult.rowCount} registros obsoletos eliminados`);
    
    // 3. Verificar estado actual
    const statusResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN online = true THEN 1 END) as online,
        COUNT(CASE WHEN online = false THEN 1 END) as offline
      FROM presencia
    `);
    
    const status = statusResult.rows[0];
    console.log('📊 Estado actual de la tabla presencia:');
    console.log(`   Total: ${status.total}`);
    console.log(`   Online: ${status.online}`);
    console.log(`   Offline: ${status.offline}`);
    
    console.log('✅ Limpieza de presencia completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de presencia:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupPresenciaTable()
    .then(() => {
      console.log('🎉 Script de limpieza ejecutado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script de limpieza:', error);
      process.exit(1);
    });
}

module.exports = { cleanupPresenciaTable };
