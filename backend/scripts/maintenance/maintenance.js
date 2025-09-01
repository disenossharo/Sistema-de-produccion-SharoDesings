const { createProductionTables } = require('./createProductionTables');
const { fixPresenciaTable } = require('./fixPresenciaTable');
const { cleanupPresenciaTable } = require('./cleanupPresenciaTable');
const { backupImportantUsers } = require('./backupImportantUsers');

/**
 * Script principal de mantenimiento del sistema
 * Ejecuta todas las tareas de mantenimiento necesarias
 */

/**
 * Verificar la salud general de la base de datos
 */
async function checkDatabaseHealth() {
  try {
    const { pool } = require('../../src/config/database');
    
    // Verificar conexión
    const client = await pool.connect();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Verificar tablas principales
    const tables = ['empleados', 'produccion', 'presencia'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ Tabla ${table}: ${result.rows[0].count} registros`);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error verificando salud de la BD:', error.message);
    return false;
  }
}

/**
 * Función principal de mantenimiento
 */
async function main() {
  try {
    console.log('🚀 Iniciando tareas de mantenimiento...\n');
    
    // Crear tablas de producción
    console.log('📊 Creando tablas de producción...');
    await createProductionTables();
    console.log('✅ Tablas de producción creadas/verificadas\n');
    
    // Verificar y arreglar tabla de presencia
    console.log('🔧 Verificando tabla de presencia...');
    await fixPresenciaTable();
    console.log('✅ Tabla de presencia verificada/arreglada\n');
    
    // Limpiar registros antiguos de presencia
    console.log('🧹 Limpiando registros antiguos de presencia...');
    await cleanupPresenciaTable();
    console.log('✅ Limpieza de presencia completada\n');
    
    // Respaldar usuarios importantes
    console.log('💾 Respaldando usuarios importantes...');
    await backupImportantUsers();
    console.log('✅ Respaldo de usuarios completado\n');
    
    // Verificar salud de la base de datos
    console.log('🏥 Verificando salud de la base de datos...');
    await checkDatabaseHealth();
    console.log('✅ Verificación de salud completada\n');
    
    console.log('🎉 ¡Todas las tareas de mantenimiento completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante el mantenimiento:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkDatabaseHealth
};
