const { pool } = require('../src/config/database');

async function addCategoriaColumn() {
  const client = await pool.connect();
  try {
    // Verificar si la columna ya existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'operaciones' AND column_name = 'categoria'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Agregar la columna categoria si no existe
      await client.query(`
        ALTER TABLE operaciones 
        ADD COLUMN categoria VARCHAR(100) DEFAULT ''
      `);
      console.log('✅ Columna "categoria" agregada a la tabla operaciones');
    } else {
      console.log('ℹ️ La columna "categoria" ya existe en la tabla operaciones');
    }
  } catch (error) {
    console.error('❌ Error al agregar columna categoria:', error);
    throw error; // Re-lanzar el error para que se maneje en el servidor
  } finally {
    client.release();
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  addCategoriaColumn()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = addCategoriaColumn;
