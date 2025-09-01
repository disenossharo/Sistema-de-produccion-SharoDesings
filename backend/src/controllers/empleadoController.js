const { pool } = require('../config/database');

// Obtener perfil del usuario autenticado
exports.getPerfil = async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) {
      return res.status(400).json({ error: 'Email no encontrado en el token' });
    }
    
    console.log('Buscando perfil para:', email);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM empleados WHERE email = $1',
        [email]
      );
      
      if (result.rows.length > 0) {
        const empleado = result.rows[0];
        return res.json({
          email: empleado.email,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos || '',
          cedula: empleado.cedula || '',
          cargoMaquina: empleado.cargo_maquina || '',
          isAdmin: empleado.is_admin
        });
      } else {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al obtener perfil:', e);
    res.status(500).json({ error: 'Error interno del servidor al obtener el perfil' });
  }
};

// Listar todos los empleados (solo admin) - Solo empleados, no administradores
exports.getEmpleados = async (req, res) => {
  try {
    console.log('🔍 getEmpleados llamado - Admin:', req.user.email);
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, nombre, apellidos, cedula, cargo_maquina, is_admin, activo, created_at FROM empleados WHERE is_admin = false ORDER BY nombre'
      );
      
      const empleados = result.rows.map(row => ({
        id: row.email, // Usar email como ID para consistencia con presencia
        email: row.email,
        nombre: row.nombre || 'Sin nombre',
        apellidos: row.apellidos || '',
        cedula: row.cedula || '',
        cargoMaquina: row.cargo_maquina || '',
        isAdmin: row.is_admin,
        activo: row.activo
      }));
      
      console.log(`✅ Empleados obtenidos: ${empleados.length} (solo empleados, no administradores)`);
      res.json(empleados);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al obtener empleados:', e);
    res.status(500).json({ error: 'Error interno del servidor al obtener empleados' });
  }
};

// Crear un nuevo empleado
exports.createEmpleado = async (req, res) => {
  try {
    const email = req.user.email;
    const { nombre, apellidos, cedula, cargoMaquina } = req.body;
    
    // Validaciones mejoradas
    if (!email) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    if (nombre.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }
    
    if (nombre.trim().length > 100) {
      return res.status(400).json({ error: 'El nombre no puede exceder 100 caracteres' });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE empleados 
         SET nombre = $1, apellidos = $2, cedula = $3, cargo_maquina = $4, updated_at = CURRENT_TIMESTAMP
         WHERE email = $5
         RETURNING *`,
        [nombre.trim(), apellidos ? apellidos.trim() : '', cedula ? cedula.trim() : '', 
         cargoMaquina && typeof cargoMaquina === 'string' ? cargoMaquina.trim() : '', email]
      );
      
      if (result.rows.length > 0) {
        const empleado = result.rows[0];
        console.log('✅ Perfil de empleado actualizado:', email);
        res.json({
          email: empleado.email,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos || '',
          cedula: empleado.cedula || '',
          cargoMaquina: empleado.cargo_maquina || ''
        });
      } else {
                 // Si no existe, crear nuevo empleado
         const insertResult = await client.query(
           `INSERT INTO empleados (email, nombre, apellidos, cedula, cargo_maquina, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
           [email, nombre.trim(), apellidos ? apellidos.trim() : '', 
            cedula ? cedula.trim() : '', cargoMaquina && typeof cargoMaquina === 'string' ? cargoMaquina.trim() : '', null]
         );
        
        const empleado = insertResult.rows[0];
        console.log('✅ Perfil de empleado creado:', email);
        res.status(201).json({
          email: empleado.email,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos || '',
          cedula: empleado.cedula || '',
          cargoMaquina: empleado.cargo_maquina || ''
        });
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error al crear empleado:', e);
    
    // Manejo específico de errores de base de datos
    if (e.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe un empleado con este email' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear empleado' });
    }
  }
};

// Actualizar un empleado existente
exports.updateEmpleado = async (req, res) => {
  try {
    
    const email = req.user.email;
    const { nombre, apellidos, cedula, cargoMaquina } = req.body;
    
    // Validaciones básicas
    if (!email) {
      console.error('❌ Email no encontrado en req.user');
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    
    if (!nombre || nombre.trim().length === 0) {
      console.error('❌ Nombre requerido');
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    

    
    const client = await pool.connect();
    try {
      // Primero verificar si el empleado existe
      const checkResult = await client.query(
        'SELECT * FROM empleados WHERE email = $1',
        [email]
      );
      
      
      
             if (checkResult.rows.length === 0) {

         // Si no existe, crear nuevo empleado (sin password_hash para perfiles creados desde el frontend)
         const insertResult = await client.query(
           `INSERT INTO empleados (email, nombre, apellidos, cedula, cargo_maquina, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
           [email, nombre.trim(), apellidos ? apellidos.trim() : '', 
            cedula ? cedula.trim() : '', cargoMaquina && typeof cargoMaquina === 'string' ? cargoMaquina.trim() : '', null]
         );
        
        const empleado = insertResult.rows[0];
        console.log('✅ Perfil de empleado creado:', email);
        res.status(201).json({
          email: empleado.email,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos || '',
          cedula: empleado.cedula || '',
          cargoMaquina: empleado.cargo_maquina || ''
        });
      } else {
        // Si existe, actualizar
        const result = await client.query(
          `UPDATE empleados 
           SET nombre = $1, apellidos = $2, cedula = $3, cargo_maquina = $4, updated_at = CURRENT_TIMESTAMP
           WHERE email = $5
           RETURNING *`,
          [nombre.trim(), apellidos ? apellidos.trim() : '', cedula ? cedula.trim() : '', 
           cargoMaquina && typeof cargoMaquina === 'string' ? cargoMaquina.trim() : '', email]
        );
        
        if (result.rows.length > 0) {
          const empleado = result.rows[0];
          console.log('✅ Perfil de empleado actualizado:', email);
          res.json({
            email: empleado.email,
            nombre: empleado.nombre,
            apellidos: empleado.apellidos || '',
            cedula: empleado.cedula || '',
            cargoMaquina: empleado.cargo_maquina || ''
          });
        } else {
          console.error('❌ Error: No se pudo actualizar el empleado');
          res.status(500).json({ error: 'Error al actualizar el empleado' });
        }
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('❌ Error al actualizar empleado:', e);
    console.error('❌ Stack trace:', e.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor al actualizar empleado',
      details: e.message 
    });
  }
};