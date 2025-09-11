const { pool } = require('../config/database');

// Obtener todas las referencias (activas e inactivas) - para admin - OPTIMIZADO
exports.getReferencias = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query optimizada con filtros opcionales
      const { activa, categoria, search } = req.query;
      let query = 'SELECT id, codigo, nombre, descripcion, categoria, activa FROM referencias';
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
        conditions.push(`(codigo ILIKE $${paramCount} OR nombre ILIKE $${paramCount} OR descripcion ILIKE $${paramCount} OR categoria ILIKE $${paramCount})`);
        params.push(`%${search.trim()}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY codigo';

      const result = await client.query(query, params);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener referencias:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener referencias' });
  }
};

// Obtener solo referencias activas - para empleados - OPTIMIZADO
exports.getReferenciasActivas = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query optimizada con solo campos necesarios para empleados
      const result = await client.query(
        'SELECT id, codigo, nombre, descripcion, categoria FROM referencias WHERE activa = true ORDER BY codigo'
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener referencias activas:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener referencias activas' });
  }
};

// Obtener referencias activas con sus operaciones vinculadas - para empleados
exports.getReferenciasConOperaciones = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Query para obtener referencias activas con conteo de operaciones
      const result = await client.query(`
        SELECT r.id, r.codigo, r.nombre, r.descripcion, r.categoria,
               COUNT(o.id) as operaciones_count
        FROM referencias r
        LEFT JOIN operaciones o ON r.id = o.referencia_id AND o.activa = true
        WHERE r.activa = true
        GROUP BY r.id, r.codigo, r.nombre, r.descripcion, r.categoria
        ORDER BY r.codigo
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener referencias con operaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener referencias con operaciones' });
  }
};

// Obtener una referencia por ID
exports.getReferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM referencias WHERE id = $1 AND activa = true',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Referencia no encontrada' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener referencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener referencia' });
  }
};

// Crear una nueva referencia
exports.createReferencia = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, categoria, activa } = req.body;
    
    // Validaciones
    if (!codigo || codigo.trim().length === 0) {
      return res.status(400).json({ error: 'El código de la referencia es requerido' });
    }
    
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la referencia es requerido' });
    }
    
    const client = await pool.connect();
    try {
      const activaValue = (typeof activa === 'boolean') ? activa : true;
      const result = await client.query(
        `INSERT INTO referencias (codigo, nombre, descripcion, categoria, activa)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [codigo.trim(), nombre.trim(), descripcion ? descripcion.trim() : '', categoria ? categoria.trim() : '', activaValue]
      );
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al crear referencia:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe una referencia con ese código' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear referencia' });
    }
  }
};

// Actualizar una referencia
exports.updateReferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, categoria, activa } = req.body;
    
    // Validaciones
    if (!codigo || codigo.trim().length === 0) {
      return res.status(400).json({ error: 'El código de la referencia es requerido' });
    }
    
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la referencia es requerido' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE referencias 
         SET codigo = $1, nombre = $2, descripcion = $3, categoria = $4, activa = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [codigo.trim(), nombre.trim(), descripcion ? descripcion.trim() : '', categoria ? categoria.trim() : '', activa, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Referencia no encontrada' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al actualizar referencia:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe una referencia con ese código' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al actualizar referencia' });
    }
  }
};

// Eliminar una referencia completamente
exports.deleteReferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Verificar si la referencia existe
      const referenciaCheck = await client.query(
        'SELECT id, codigo, nombre FROM referencias WHERE id = $1',
        [id]
      );
      
      if (referenciaCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Referencia no encontrada' });
      }
      
      const referencia = referenciaCheck.rows[0];
      console.log(`🗑️ Eliminando referencia: ${referencia.codigo} - ${referencia.nombre} (ID: ${referencia.id})`);
      
      // Verificar si hay tareas en progreso que usen esta referencia
      const tareasEnProgreso = await client.query(`
        SELECT COUNT(*) FROM produccion 
        WHERE referencia = $1 
        AND estado = 'en_progreso'
      `, [referencia.codigo]);
      
      if (parseInt(tareasEnProgreso.rows[0].count) > 0) {
        return res.status(409).json({ 
          error: 'No se puede eliminar la referencia porque hay tareas en progreso que la utilizan' 
        });
      }
      
      // Verificar si hay historial que use esta referencia
      const historialCount = await client.query(`
        SELECT COUNT(*) FROM produccion 
        WHERE referencia = $1
      `, [referencia.codigo]);
      
      if (parseInt(historialCount.rows[0].count) > 0) {
        console.log(`⚠️ Advertencia: La referencia ${referencia.codigo} tiene ${historialCount.rows[0].count} registros en el historial`);
        console.log('💡 Se eliminará la referencia pero se mantendrá el historial para auditoría');
      }
      
      // Eliminar la referencia completamente
      const result = await client.query(
        'DELETE FROM referencias WHERE id = $1 RETURNING id, codigo, nombre',
        [id]
      );
      
      console.log(`✅ Referencia eliminada completamente: ${result.rows[0].codigo} - ${result.rows[0].nombre}`);
      
      res.json({ 
        message: 'Referencia eliminada completamente',
        referencia: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar referencia:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar referencia' });
  }
};

// Obtener referencias por categoría
exports.getReferenciasPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM referencias WHERE categoria = $1 AND activa = true ORDER BY codigo',
        [categoria]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener referencias por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener referencias por categoría' });
  }
};
