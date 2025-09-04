const { pool } = require('../src/config/database');

/**
 * Script para poblar las tablas de referencias y operaciones con datos de ejemplo
 * Este script se ejecuta después de crear las tablas para tener datos iniciales
 */
async function populateReferencias() {
    const client = await pool.connect();
    try {
        console.log('📋 Poblando tabla de referencias...');
        
        const referencias = [
            {
                codigo: 'REF001',
                nombre: 'Camiseta Básica',
                descripcion: 'Camiseta de algodón 100% color blanco',
                categoria: 'Ropa'
            },
            {
                codigo: 'REF002',
                nombre: 'Pantalón Jean',
                descripcion: 'Pantalón de mezclilla azul clásico',
                categoria: 'Ropa'
            },
            {
                codigo: 'REF003',
                nombre: 'Vestido Casual',
                descripcion: 'Vestido de verano estampado',
                categoria: 'Ropa'
            },
            {
                codigo: 'REF004',
                nombre: 'Chaqueta Deportiva',
                descripcion: 'Chaqueta con capucha para deporte',
                categoria: 'Ropa Deportiva'
            },
            {
                codigo: 'REF005',
                nombre: 'Zapatos Deportivos',
                descripcion: 'Tenis para correr color negro',
                categoria: 'Calzado'
            }
        ];
        
        for (const ref of referencias) {
            // Verificar si ya existe
            const existing = await client.query(
                'SELECT id FROM referencias WHERE codigo = $1',
                [ref.codigo]
            );
            
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO referencias (codigo, nombre, descripcion, categoria)
                    VALUES ($1, $2, $3, $4)
                `, [ref.codigo, ref.nombre, ref.descripcion, ref.categoria]);
                
                console.log(`✅ Referencia creada: ${ref.codigo} - ${ref.nombre}`);
            } else {
                console.log(`⚠️ Referencia ya existe: ${ref.codigo}`);
            }
        }
        
        console.log('🎉 Referencias pobladas exitosamente');
    } catch (error) {
        console.error('❌ Error poblando referencias:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function populateOperaciones() {
    const client = await pool.connect();
    try {
        console.log('⚙️ Poblando tabla de operaciones...');
        
        const operaciones = [
            {
                nombre: 'Corte de Tela',
                descripcion: 'Corte de piezas según patrón',
                tiempo_por_unidad: 15.5,
                video_tutorial: 'https://youtube.com/watch?v=corte-tela'
            },
            {
                nombre: 'Coser Costuras',
                descripcion: 'Unión de piezas mediante costura',
                tiempo_por_unidad: 25.0,
                video_tutorial: 'https://youtube.com/watch?v=coser-costuras'
            },
            {
                nombre: 'Aplicar Botones',
                descripcion: 'Colocación de botones y ojales',
                tiempo_por_unidad: 8.0,
                video_tutorial: 'https://youtube.com/watch?v=aplicar-botones'
            },
            {
                nombre: 'Planchado',
                descripcion: 'Planchado final de la prenda',
                tiempo_por_unidad: 5.0,
                video_tutorial: 'https://youtube.com/watch?v=planchado'
            },
            {
                nombre: 'Embalaje',
                descripcion: 'Empaque y etiquetado del producto',
                tiempo_por_unidad: 3.0,
                video_tutorial: 'https://youtube.com/watch?v=embalaje'
            },
            {
                nombre: 'Control de Calidad',
                descripcion: 'Inspección final del producto',
                tiempo_por_unidad: 10.0,
                video_tutorial: 'https://youtube.com/watch?v=control-calidad'
            }
        ];
        
        for (const op of operaciones) {
            // Verificar si ya existe
            const existing = await client.query(
                'SELECT id FROM operaciones WHERE nombre = $1',
                [op.nombre]
            );
            
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO operaciones (nombre, descripcion, tiempo_por_unidad, video_tutorial)
                    VALUES ($1, $2, $3, $4)
                `, [op.nombre, op.descripcion, op.tiempo_por_unidad, op.video_tutorial]);
                
                console.log(`✅ Operación creada: ${op.nombre}`);
            } else {
                console.log(`⚠️ Operación ya existe: ${op.nombre}`);
            }
        }
        
        console.log('🎉 Operaciones pobladas exitosamente');
    } catch (error) {
        console.error('❌ Error poblando operaciones:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Función principal que ejecuta la población de datos
 */
async function populateProductionTables() {
    try {
        console.log('🚀 Iniciando población de tablas de producción...');
        
        // Poblar referencias
        await populateReferencias();
        
        // Poblar operaciones
        await populateOperaciones();
        
        console.log('✅ Población de tablas de producción completada');
        
    } catch (error) {
        console.error('❌ Error en la población de tablas:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    populateProductionTables();
}

module.exports = { 
    populateReferencias, 
    populateOperaciones, 
    populateProductionTables 
};
