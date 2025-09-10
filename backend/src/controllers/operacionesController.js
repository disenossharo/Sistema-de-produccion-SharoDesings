const { pool } = require('../config/database');

// Obtener todas las operaciones (activas e inactivas) - para admin - OPTIMIZADO
exports.getOperaciones = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query optimizada con filtros opcionales
      const { activa, categoria, search } = req.query;
      let query = 'SELECT id, nombre, descripcion, tiempo_por_unidad, video_tutorial, categoria, activa FROM operaciones';
      const params = [];
      let paramCount = 0;
      const conditions = [];

      // Filtro por estado activa/inactiva
      if (activa !== undefined) {
        paramCount++;
        conditions.push(`activa = $${paramCount}`);
        params.push(activa === 'true');
      }

      // Filtro por categoría
      if (categoria && categoria.trim()) {
        paramCount++;
        conditions.push(`categoria = $${paramCount}`);
        params.push(categoria.trim());
      }

      // Filtro por búsqueda de texto
      if (search && search.trim()) {
        paramCount++;
        conditions.push(`(nombre ILIKE $${paramCount} OR descripcion ILIKE $${paramCount} OR categoria ILIKE $${paramCount})`);
        params.push(`%${search.trim()}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY nombre';

      const result = await client.query(query, params);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener operaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener operaciones' });
  }
};

// Obtener solo operaciones activas - para empleados - OPTIMIZADO
exports.getOperacionesActivas = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query optimizada con solo campos necesarios para empleados
      const result = await client.query(
        'SELECT id, nombre, descripcion, tiempo_por_unidad, video_tutorial, categoria FROM operaciones WHERE activa = true ORDER BY nombre'
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener operaciones activas:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener operaciones activas' });
  }
};

// Obtener una operación por ID
exports.getOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM operaciones WHERE id = $1 AND activa = true',
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
    const { nombre, descripcion, tiempo_por_unidad, video_tutorial, categoria, activa } = req.body;
    
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la operación es requerido' });
    }
    
    if (!tiempo_por_unidad || tiempo_por_unidad <= 0) {
      return res.status(400).json({ error: 'El tiempo por unidad debe ser mayor a 0' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO operaciones (nombre, descripcion, tiempo_por_unidad, video_tutorial, categoria, activa)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nombre.trim(), descripcion ? descripcion.trim() : '', tiempo_por_unidad, video_tutorial ? video_tutorial.trim() : '', categoria ? categoria.trim() : '', activa === undefined ? true : activa]
      );
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear operación:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe una operación con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear operación' });
    }
  }
};

// Actualizar una operación
exports.updateOperacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, tiempo_por_unidad, video_tutorial, categoria, activa } = req.body;
    
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la operación es requerido' });
    }
    
    if (tiempo_por_unidad && tiempo_por_unidad <= 0) {
      return res.status(400).json({ error: 'El tiempo por unidad debe ser mayor a 0' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE operaciones 
         SET nombre = $1, descripcion = $2, tiempo_por_unidad = $3, video_tutorial = $4, categoria = $5, activa = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [nombre.trim(), descripcion ? descripcion.trim() : '', tiempo_por_unidad, video_tutorial ? video_tutorial.trim() : '', categoria ? categoria.trim() : '', activa, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Operación no encontrada' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar operación:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe una operación con ese nombre' });
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
      // Verificar si la operación existe
      const operacionCheck = await client.query(
        'SELECT id, nombre FROM operaciones WHERE id = $1',
        [id]
      );
      
      if (operacionCheck.rows.length === 0) {
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
      
      // Eliminar la operación completamente
      const result = await client.query(
        'DELETE FROM operaciones WHERE id = $1 RETURNING id, nombre',
        [id]
      );
      
      console.log(`✅ Operación eliminada completamente: ${result.rows[0].nombre}`);
      
      res.json({ 
        message: 'Operación eliminada completamente',
        operacion: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar operación:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar operación' });
  }
};
