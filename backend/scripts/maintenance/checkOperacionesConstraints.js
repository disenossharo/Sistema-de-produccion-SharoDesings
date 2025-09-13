const { pool } = require('../../src/config/database');

async function checkOperacionesConstraints() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando restricciones actuales de la tabla operaciones...');

    // Verificar restricciones UNIQUE
    const constraints = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'operaciones' 
      AND tc.constraint_type = 'UNIQUE'
      ORDER BY tc.constraint_name, kcu.ordinal_position
    `);
    
    console.log('📋 Restricciones UNIQUE actuales:');
    if (constraints.rows.length === 0) {
      console.log('  - No hay restricciones UNIQUE');
    } else {
      constraints.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.column_name}`);
      });
    }

    // Verificar estructura de la tabla
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'operaciones'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estructura de la tabla operaciones:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verificar si hay datos
    const count = await client.query('SELECT COUNT(*) FROM operaciones');
    console.log(`\n📈 Total de operaciones: ${count.rows[0].count}`);

    // Verificar si hay operaciones con el mismo nombre
    const duplicates = await client.query(`
      SELECT nombre, COUNT(*) as count
      FROM operaciones
      GROUP BY nombre
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n⚠️ Operaciones con nombres duplicados:');
      duplicates.rows.forEach(row => {
        console.log(`  - ${row.nombre}: ${row.count} veces`);
      });
    } else {
      console.log('\n✅ No hay operaciones con nombres duplicados');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar restricciones:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkOperacionesConstraints()
    .then(() => {
      console.log('🎉 Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = checkOperacionesConstraints;
