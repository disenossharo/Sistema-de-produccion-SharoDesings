const { pool } = require('../../src/config/database');

async function removeVideoTutorialField() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Eliminando campo video_tutorial de operaciones...');
    
    // Verificar si la columna video_tutorial existe
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones' 
      AND column_name = 'video_tutorial'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log('📝 Eliminando columna video_tutorial de operaciones...');
      await client.query(`
        ALTER TABLE operaciones 
        DROP COLUMN video_tutorial
      `);
      console.log('✅ Columna video_tutorial eliminada');
    } else {
      console.log('✅ Columna video_tutorial ya no existe');
    }
    
    console.log('🎉 Migración completada exitosamente');
    console.log('📋 El campo de tutorial ha sido eliminado de las operaciones');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  removeVideoTutorialField()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = removeVideoTutorialField;
