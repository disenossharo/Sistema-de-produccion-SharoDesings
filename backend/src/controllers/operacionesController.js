const { pool } = require('../config/database');

// Obtener todas las operaciones (activas e inactivas) - para admin - OPTIMIZADO
exports.getOperaciones = async (req, res) => {
  try {
    console.log('🔍 Iniciando getOperaciones...');
    const client = await pool.connect();
    try {
      // Query optimizada con filtros opcionales y información de referencias múltiples
      const { activa, categoria, search, referencia_id } = req.query;
      console.log('📋 Parámetros recibidos:', { activa, categoria, search, referencia_id });
      
      let query = `
        SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, 
               o.categoria, o.activa,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'id', r.id,
                     'codigo', r.codigo,
                     'nombre', r.nombre,
                     'tiempo_por_referencia', ro.tiempo_por_referencia
                   )
                 ) FILTER (WHERE r.id IS NOT NULL),
                 '[]'::json
               ) as referencias
        FROM operaciones o
        LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
        LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
      `;
      const params = [];
      let paramCount = 0;
      const conditions = [];

      // Filtro por estado activa/inactiva
      if (activa !== undefined) {
        paramCount++;
        conditions.push(`o.activa = $${paramCount}`);
        params.push(activa === 'true');
      }

      // Filtro por categoría
      if (categoria && categoria.trim()) {
        paramCount++;
        conditions.push(`o.categoria = $${paramCount}`);
        params.push(categoria.trim());
      }

      // Filtro por referencia
      if (referencia_id && referencia_id.trim()) {
        paramCount++;
        conditions.push(`EXISTS (
          SELECT 1 FROM referencia_operaciones ro2 
          WHERE ro2.operacion_id = o.id 
          AND ro2.referencia_id = $${paramCount} 
          AND ro2.activa = true
        )`);
        params.push(parseInt(referencia_id));
      }

      // Filtro por búsqueda de texto
      if (search && search.trim()) {
        paramCount++;
        conditions.push(`(o.nombre ILIKE $${paramCount} OR o.descripcion ILIKE $${paramCount} OR o.categoria ILIKE $${paramCount} OR EXISTS (
          SELECT 1 FROM referencia_operaciones ro3 
          JOIN referencias r3 ON ro3.referencia_id = r3.id 
          WHERE ro3.operacion_id = o.id 
          AND ro3.activa = true 
          AND r3.nombre ILIKE $${paramCount}
        ))`);
        params.push(`%${search.trim()}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa ORDER BY o.nombre';

      console.log('🔍 Ejecutando consulta...');
      const result = await client.query(query, params);
      console.log('✅ Consulta ejecutada exitosamente, resultados:', result.rows.length);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error al obtener operaciones:', error);
    console.error('📝 Stack trace:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor al obtener operaciones' });
  }
};

// Obtener solo operaciones activas - para empleados - OPTIMIZADO
exports.getOperacionesActivas = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query optimizada con información de referencias múltiples
      const result = await client.query(`
        SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'id', r.id,
                     'codigo', r.codigo,
                     'nombre', r.nombre,
                     'tiempo_por_referencia', ro.tiempo_por_referencia
                   )
                 ) FILTER (WHERE r.id IS NOT NULL),
                 '[]'::json
               ) as referencias
        FROM operaciones o
        LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
        LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
        WHERE o.activa = true 
        GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria
        ORDER BY o.nombre
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener operaciones activas:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener operaciones activas' });
  }
};

// Obtener operaciones activas por referencia - para empleados
exports.getOperacionesActivasPorReferencia = async (req, res) => {
  try {
    const { referencia_id } = req.params;
    const client = await pool.connect();
    
    try {
      if (!referencia_id) {
        return res.status(400).json({ error: 'ID de referencia requerido' });
      }
      
      // Verificar que la referencia existe y está activa
      const referenciaCheck = await client.query(
        'SELECT id, codigo, nombre FROM referencias WHERE id = $1 AND activa = true',
        [referencia_id]
      );
      
      if (referenciaCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Referencia no encontrada o inactiva' });
      }
      
      // Obtener operaciones vinculadas a esta referencia Y operaciones sin referencia (generales)
      const result = await client.query(
        `        SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', r.id,
                      'codigo', r.codigo,
                      'nombre', r.nombre,
                      'tiempo_por_referencia', ro.tiempo_por_referencia
                    )
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'::json
                ) as referencias
         FROM operaciones o
         LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
         LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
         WHERE o.activa = true 
         AND (EXISTS (
           SELECT 1 FROM referencia_operaciones ro2 
           WHERE ro2.operacion_id = o.id 
           AND ro2.referencia_id = $1 
           AND ro2.activa = true
         ) OR NOT EXISTS (
           SELECT 1 FROM referencia_operaciones ro3 
           WHERE ro3.operacion_id = o.id 
           AND ro3.activa = true
         ))
         GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria
         ORDER BY CASE WHEN EXISTS (
           SELECT 1 FROM referencia_operaciones ro4 
           WHERE ro4.operacion_id = o.id 
           AND ro4.referencia_id = $1 
           AND ro4.activa = true
         ) THEN 0 ELSE 1 END, o.nombre`,
        [referencia_id]
      );
      
      res.json({
        referencia: referenciaCheck.rows[0],
        operaciones: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener operaciones por referencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener operaciones por referencia' });
  }
};

// Obtener una operación por ID
exports.getOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', r.id,
                      'codigo', r.codigo,
                      'nombre', r.nombre,
                      'tiempo_por_referencia', ro.tiempo_por_referencia
                    )
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'::json
                ) as referencias
         FROM operaciones o
         LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
         LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
         WHERE o.id = $1 AND o.activa = true
         GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener operación:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener operación' });
  }
};

// Crear una nueva operación
exports.createOperacion = async (req, res) => {
  try {
    const { nombre, descripcion, tiempo_por_unidad, categoria, activa, referencias } = req.body;
    
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la operación es requerido' });
    }
    
    if (!tiempo_por_unidad || tiempo_por_unidad <= 0) {
      return res.status(400).json({ error: 'El tiempo por unidad debe ser mayor a 0' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Crear la operación
      const result = await client.query(
        `INSERT INTO operaciones (nombre, descripcion, tiempo_por_unidad, categoria, activa)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          nombre.trim(), 
          descripcion ? descripcion.trim() : '', 
          tiempo_por_unidad, 
          categoria ? categoria.trim() : '', 
          activa === undefined ? true : activa
        ]
      );
      
      const operacion = result.rows[0];
      
      // Si se proporcionan referencias, crear las relaciones
      if (referencias && Array.isArray(referencias) && referencias.length > 0) {
        // Verificar que todas las referencias existen y están activas
        const referenciaIds = referencias.map(ref => ref.id || ref);
        const referenciaCheck = await client.query(
          'SELECT id FROM referencias WHERE id = ANY($1) AND activa = true',
          [referenciaIds]
        );
        
        if (referenciaCheck.rows.length !== referenciaIds.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Una o más referencias seleccionadas no existen o están inactivas' });
        }
        
        // Crear las relaciones en la tabla referencia_operaciones
        for (let i = 0; i < referencias.length; i++) {
          const ref = referencias[i];
          const referenciaId = ref.id || ref;
          const orden = ref.orden || i + 1;
          const tiempoPorReferencia = ref.tiempo_por_referencia || operacion.tiempo_por_unidad;
          
          await client.query(
            `INSERT INTO referencia_operaciones (referencia_id, operacion_id, orden, activa, tiempo_por_referencia)
             VALUES ($1, $2, $3, $4, $5)`,
            [referenciaId, operacion.id, orden, true, tiempoPorReferencia]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Obtener la operación con sus referencias para la respuesta
      const operacionCompleta = await client.query(
        `SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', r.id,
                      'codigo', r.codigo,
                      'nombre', r.nombre
                    )
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'::json
                ) as referencias
         FROM operaciones o
         LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
         LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
         WHERE o.id = $1
         GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa`,
        [operacion.id]
      );
      
      res.status(201).json(operacionCompleta.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear operación:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ 
        error: 'Ya existe una operación con ese nombre. Los nombres de operaciones deben ser únicos.' 
      });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear operación' });
    }
  }
};

// Actualizar una operación
exports.updateOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, tiempo_por_unidad, categoria, activa, referencias } = req.body;
    
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la operación es requerido' });
    }
    
    if (tiempo_por_unidad && tiempo_por_unidad <= 0) {
      return res.status(400).json({ error: 'El tiempo por unidad debe ser mayor a 0' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verificar que la operación existe
      const operacionCheck = await client.query(
        'SELECT id FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      // Actualizar la operación
      const result = await client.query(
        `UPDATE operaciones 
         SET nombre = $1, descripcion = $2, tiempo_por_unidad = $3, 
             categoria = $4, activa = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          nombre.trim(), 
          descripcion ? descripcion.trim() : '', 
          tiempo_por_unidad, 
          categoria ? categoria.trim() : '', 
          activa, 
          id
        ]
      );
      
      // Eliminar relaciones existentes
      await client.query(
        'DELETE FROM referencia_operaciones WHERE operacion_id = $1',
        [id]
      );
      
      // Si se proporcionan referencias, crear las nuevas relaciones
      if (referencias && Array.isArray(referencias) && referencias.length > 0) {
        // Verificar que todas las referencias existen y están activas
        const referenciaIds = referencias.map(ref => ref.id || ref);
        const referenciaCheck = await client.query(
          'SELECT id FROM referencias WHERE id = ANY($1) AND activa = true',
          [referenciaIds]
        );
        
        if (referenciaCheck.rows.length !== referenciaIds.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Una o más referencias seleccionadas no existen o están inactivas' });
        }
        
        // Crear las nuevas relaciones en la tabla referencia_operaciones
        for (let i = 0; i < referencias.length; i++) {
          const ref = referencias[i];
          const referenciaId = ref.id || ref;
          const orden = ref.orden || i + 1;
          const tiempoPorReferencia = ref.tiempo_por_referencia || result.rows[0].tiempo_por_unidad;
          
          await client.query(
            `INSERT INTO referencia_operaciones (referencia_id, operacion_id, orden, activa, tiempo_por_referencia)
             VALUES ($1, $2, $3, $4, $5)`,
            [referenciaId, id, orden, true, tiempoPorReferencia]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Obtener la operación actualizada con sus referencias para la respuesta
      const operacionCompleta = await client.query(
        `SELECT o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', r.id,
                      'codigo', r.codigo,
                      'nombre', r.nombre
                    )
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'::json
                ) as referencias
         FROM operaciones o
         LEFT JOIN referencia_operaciones ro ON o.id = ro.operacion_id AND ro.activa = true
         LEFT JOIN referencias r ON ro.referencia_id = r.id AND r.activa = true
         WHERE o.id = $1
         GROUP BY o.id, o.nombre, o.descripcion, o.tiempo_por_unidad, o.categoria, o.activa`,
        [id]
      );
      
      res.json(operacionCompleta.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar operación:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ 
        error: 'Ya existe una operación con ese nombre. Los nombres de operaciones deben ser únicos.' 
      });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al actualizar operación' });
    }
  }
};

// Eliminar una operación completamente
exports.deleteOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar si la operación existe
      const operacionCheck = await client.query(
        'SELECT id, nombre FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      const operacion = operacionCheck.rows[0];
      console.log(`🗑️ Eliminando operación: ${operacion.nombre} (ID: ${operacion.id})`);
      
      // Verificar si hay tareas en progreso que usen esta operación
      const tareasEnProgreso = await client.query(`
        SELECT COUNT(*) FROM produccion 
        WHERE tareas @> ARRAY[$1] 
        AND estado = 'en_progreso'
      `, [operacion.nombre]);
      
      if (parseInt(tareasEnProgreso.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ 
          error: 'No se puede eliminar la operación porque hay tareas en progreso que la utilizan' 
        });
      }
      
      // Verificar si hay historial que use esta operación
      const historialCount = await client.query(`
        SELECT COUNT(*) FROM produccion 
        WHERE tareas @> ARRAY[$1]
      `, [operacion.nombre]);
      
      if (parseInt(historialCount.rows[0].count) > 0) {
        console.log(`⚠️ Advertencia: La operación ${operacion.nombre} tiene ${historialCount.rows[0].count} registros en el historial`);
        console.log('💡 Se eliminará la operación pero se mantendrá el historial para auditoría');
      }
      
      // Eliminar las relaciones en referencia_operaciones (se eliminarán automáticamente por CASCADE)
      await client.query(
        'DELETE FROM referencia_operaciones WHERE operacion_id = $1',
        [id]
      );
      
      // Eliminar la operación completamente
      const result = await client.query(
        'DELETE FROM operaciones WHERE id = $1 RETURNING id, nombre',
        [id]
      );
      
      await client.query('COMMIT');
      
      console.log(`✅ Operación eliminada completamente: ${result.rows[0].nombre}`);
      
      res.json({ 
        message: 'Operación eliminada completamente',
        operacion: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar operación:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar operación' });
  }
};

// Toggle de todas las operaciones (activar/desactivar todas)
exports.toggleAllOperaciones = async (req, res) => {
  try {
    const { activa } = req.body;
    
    // Validaciones
    if (typeof activa !== 'boolean') {
      return res.status(400).json({ error: 'El parámetro "activa" debe ser un booleano (true/false)' });
    }
    
    const client = await pool.connect();
    try {
      // Actualizar todas las operaciones
      const result = await client.query(
        `UPDATE operaciones 
         SET activa = $1, updated_at = CURRENT_TIMESTAMP
         RETURNING id, nombre, activa`,
        [activa]
      );
      
      const estado = activa ? 'activadas' : 'desactivadas';
      console.log(`🔄 ${estado} ${result.rows.length} operaciones`);
      
      res.json({ 
        message: `Todas las operaciones han sido ${estado}`,
        operaciones_afectadas: result.rows.length,
        operaciones: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al toggle de todas las operaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar operaciones' });
  }
};

// Agregar referencias a una operación
exports.addReferenciasToOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { referencias } = req.body;
    
    if (!referencias || !Array.isArray(referencias) || referencias.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una referencia' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verificar que la operación existe
      const operacionCheck = await client.query(
        'SELECT id, nombre FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      // Verificar que todas las referencias existen y están activas
      const referenciaIds = referencias.map(ref => ref.id || ref);
      const referenciaCheck = await client.query(
        'SELECT id FROM referencias WHERE id = ANY($1) AND activa = true',
        [referenciaIds]
      );
      
      if (referenciaCheck.rows.length !== referenciaIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Una o más referencias seleccionadas no existen o están inactivas' });
      }
      
      // Agregar las relaciones (ignorar duplicados)
      for (let i = 0; i < referencias.length; i++) {
        const ref = referencias[i];
        const referenciaId = ref.id || ref;
        const orden = ref.orden || i + 1;
        const tiempoPorReferencia = ref.tiempo_por_referencia || 1.0; // Tiempo por defecto
        
        await client.query(
          `INSERT INTO referencia_operaciones (referencia_id, operacion_id, orden, activa, tiempo_por_referencia)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (referencia_id, operacion_id) DO UPDATE SET
           activa = EXCLUDED.activa,
           orden = EXCLUDED.orden,
           tiempo_por_referencia = EXCLUDED.tiempo_por_referencia`,
          [referenciaId, id, orden, true, tiempoPorReferencia]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Referencias agregadas exitosamente a la operación',
        operacion_id: id,
        referencias_agregadas: referencias.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al agregar referencias a operación:', error);
    res.status(500).json({ error: 'Error interno del servidor al agregar referencias' });
  }
};

// Remover referencias de una operación
exports.removeReferenciasFromOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { referencias } = req.body;
    
    if (!referencias || !Array.isArray(referencias) || referencias.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una referencia' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verificar que la operación existe
      const operacionCheck = await client.query(
        'SELECT id, nombre FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      // Remover las relaciones
      const referenciaIds = referencias.map(ref => ref.id || ref);
      const result = await client.query(
        'DELETE FROM referencia_operaciones WHERE operacion_id = $1 AND referencia_id = ANY($2)',
        [id, referenciaIds]
      );
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Referencias removidas exitosamente de la operación',
        operacion_id: id,
        referencias_removidas: result.rowCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al remover referencias de operación:', error);
    res.status(500).json({ error: 'Error interno del servidor al remover referencias' });
  }
};

// Actualizar tiempo de operación para una referencia específica
exports.updateTiempoPorReferencia = async (req, res) => {
  try {
    const { id } = req.params; // ID de la operación
    const { referencia_id, tiempo_por_referencia } = req.body;
    
    if (!referencia_id || !tiempo_por_referencia) {
      return res.status(400).json({ error: 'ID de referencia y tiempo son requeridos' });
    }
    
    if (tiempo_por_referencia <= 0) {
      return res.status(400).json({ error: 'El tiempo debe ser mayor a 0' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verificar que la operación existe
      const operacionCheck = await client.query(
        'SELECT id, nombre FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      // Verificar que la referencia existe
      const referenciaCheck = await client.query(
        'SELECT id, codigo, nombre FROM referencias WHERE id = $1 AND activa = true',
        [referencia_id]
      );
      
      if (referenciaCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Referencia no encontrada' });
      }
      
      // Actualizar el tiempo específico para esta referencia
      const result = await client.query(
        `UPDATE referencia_operaciones 
         SET tiempo_por_referencia = $1, updated_at = CURRENT_TIMESTAMP
         WHERE operacion_id = $2 AND referencia_id = $3
         RETURNING *`,
        [tiempo_por_referencia, id, referencia_id]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'La operación no está vinculada a esta referencia' });
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Tiempo actualizado exitosamente',
        operacion: operacionCheck.rows[0],
        referencia: referenciaCheck.rows[0],
        tiempo_por_referencia: tiempo_por_referencia
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar tiempo por referencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar tiempo' });
  }
};