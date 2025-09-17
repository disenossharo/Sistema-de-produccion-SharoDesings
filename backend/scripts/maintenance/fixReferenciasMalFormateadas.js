const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixReferenciasMalFormateadas() {
  let client = null;
  try {
    console.log('🔧 Iniciando corrección de referencias mal formateadas...');
    client = await pool.connect();
    
    // Buscar todas las tareas con referencias mal formateadas
    const result = await client.query(`
      SELECT id, empleado_email, referencia, created_at 
      FROM produccion 
      WHERE referencia LIKE '%object Object%'
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Encontradas ${result.rows.length} tareas con referencias mal formateadas:`);
    
    for (const row of result.rows) {
      console.log(`\n🔍 Tarea ID: ${row.id}`);
      console.log(`📧 Empleado: ${row.empleado_email}`);
      console.log(`📅 Creada: ${row.created_at}`);
      console.log(`❌ Referencia actual: "${row.referencia}"`);
      
      // Limpiar la referencia mal formateada
      // Si es '[object Object]', la cambiamos a vacío
      const nuevaReferencia = row.referencia === '[object Object]' ? '' : row.referencia;
      
      if (nuevaReferencia !== row.referencia) {
        await client.query(
          'UPDATE produccion SET referencia = $1 WHERE id = $2',
          [nuevaReferencia, row.id]
        );
        console.log(`✅ Referencia corregida a: "${nuevaReferencia}"`);
      }
    }
    
    console.log('\n🎉 Corrección completada!');
    
  } catch (error) {
    console.error('💥 Error durante la corrección:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixReferenciasMalFormateadas();
}

module.exports = { fixReferenciasMalFormateadas };
