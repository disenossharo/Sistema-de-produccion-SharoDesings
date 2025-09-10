const { pool } = require('../config/database');

async function fixProduccionTable() {
  const client = await pool.connect();
  try {
    console.log('🔧 Verificando y corrigiendo tabla produccion...');

    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'produccion'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ La tabla produccion no existe, creándola...');
      
      await client.query(`
        CREATE TABLE produccion (
          id SERIAL PRIMARY KEY,
          empleado_email VARCHAR(255) REFERENCES empleados(email),
          tareas TEXT[],
          referencia VARCHAR(255),
          cantidad_asignada INTEGER DEFAULT 0,
          cantidad_hecha INTEGER DEFAULT 0,
          hora_inicio TIMESTAMP,
          hora_fin TIMESTAMP,
          efectividad DECIMAL(5,2),
          observaciones TEXT,
          fecha VARCHAR(50),
          tiempo_estimado INTEGER DEFAULT 0,
          tiempo_transcurrido DECIMAL(10,2) DEFAULT 0,
          estado VARCHAR(50) DEFAULT 'en_progreso',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla produccion creada');
    } else {
      console.log('✅ La tabla produccion existe, verificando columnas...');
      
      // Verificar columnas existentes
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'produccion' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Columnas actuales en tabla produccion:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar si faltan columnas importantes
      const requiredColumns = [
        'id', 'empleado_email', 'tareas', 'referencia', 'cantidad_asignada', 
        'cantidad_hecha', 'hora_inicio', 'hora_fin', 'efectividad', 
        'observaciones', 'fecha', 'tiempo_estimado', 'tiempo_transcurrido', 
        'estado', 'created_at'
      ];
      
      const existingColumnNames = columns.rows.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Faltan columnas:', missingColumns);
        
        // Agregar columnas faltantes
        for (const column of missingColumns) {
          let alterQuery = '';
          switch (column) {
            case 'tareas':
              alterQuery = 'ALTER TABLE produccion ADD COLUMN tareas TEXT[]';
              break;
            case 'tiempo_estimado':
              alterQuery = 'ALTER TABLE produccion ADD COLUMN tiempo_estimado INTEGER DEFAULT 0';
              break;
            case 'tiempo_transcurrido':
              alterQuery = 'ALTER TABLE produccion ADD COLUMN tiempo_transcurrido DECIMAL(10,2) DEFAULT 0';
              break;
            case 'estado':
              alterQuery = 'ALTER TABLE produccion ADD COLUMN estado VARCHAR(50) DEFAULT \'en_progreso\'';
              break;
            case 'created_at':
              alterQuery = 'ALTER TABLE produccion ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
              break;
            default:
              console.log(`⚠️ No se puede agregar automáticamente la columna: ${column}`);
              continue;
          }
          
          if (alterQuery) {
            try {
              await client.query(alterQuery);
              console.log(`✅ Columna ${column} agregada`);
            } catch (error) {
              console.log(`❌ Error agregando columna ${column}:`, error.message);
            }
          }
        }
      } else {
        console.log('✅ Todas las columnas necesarias están presentes');
      }
    }
    
    console.log('✅ Verificación de tabla produccion completada');
  } catch (error) {
    console.error('❌ Error verificando tabla produccion:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = fixProduccionTable;
