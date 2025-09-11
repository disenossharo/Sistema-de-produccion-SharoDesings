const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios del sistema (para gestión de producción)
exports.getUsuarios = async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, nombre, apellidos, cedula, is_admin, activo, created_at, updated_at FROM empleados ORDER BY created_at DESC'
      );
      
      const usuarios = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        nombre: row.nombre || 'Sin nombre',
        apellidos: row.apellidos || '',
        cedula: row.cedula || '',
        is_admin: row.is_admin,
        activo: row.activo,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
      
      console.log(`✅ Usuarios del sistema obtenidos: ${usuarios.length}`);
      res.json(usuarios);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener usuarios' });
  }
};

// Obtener un usuario por ID
exports.getUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, email, nombre, apellidos, cedula, is_admin, activo, created_at, updated_at FROM empleados WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener usuario' });
  }
};

// Crear un nuevo usuario
exports.createUsuario = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de usuario...');
    console.log('📝 Datos recibidos:', req.body);
    
    const { email, password, nombre, apellidos = '', cedula = '', rol, is_admin = false } = req.body;
    
    // Mapear el rol del frontend al campo is_admin del backend
    const isAdmin = rol === 'admin' || is_admin;
    console.log('👑 Rol mapeado:', { rol, isAdmin });
    
    // Validaciones
    if (!email || email.trim().length === 0) {
      console.log('❌ Email requerido');
      return res.status(400).json({ error: 'El email es requerido' });
    }
    
    if (!password || password.length < 6) {
      console.log('❌ Contraseña inválida');
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // El nombre es opcional al crear usuarios - el admin lo asigna después
    // if (!nombre || nombre.trim().length === 0) {
    //   return res.status(400).json({ error: 'El nombre es requerido' });
    // }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Formato de email inválido');
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    console.log('✅ Validaciones pasadas, conectando a BD...');
    const client = await pool.connect();
    try {
      // Hash de la contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      console.log('🔐 Contraseña hasheada');
      
      const insertQuery = `INSERT INTO empleados (email, nombre, apellidos, cedula, is_admin, password_hash, activo)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, email, nombre, apellidos, cedula, is_admin, activo, created_at`;
      
      const insertValues = [email.trim().toLowerCase(), nombre ? nombre.trim() : null, apellidos.trim(), cedula.trim(), isAdmin, passwordHash];
      
      console.log('📝 Query de inserción:', insertQuery);
      console.log('📊 Valores a insertar:', insertValues);
      
      const result = await client.query(insertQuery, insertValues);
      console.log('✅ Usuario insertado en empleados:', result.rows[0]);
      
      // Crear registro de presencia
      await client.query(
        `INSERT INTO presencia (empleado_email, online, last_seen) 
         VALUES ($1, false, CURRENT_TIMESTAMP)`,
        [email.trim().toLowerCase()]
      );
      console.log('✅ Registro de presencia creado');
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint
    });
    
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear usuario' });
    }
  }
};

// Actualizar un usuario
exports.updateUsuario = async (req, res) => {
  try {
    console.log('🚀 Iniciando actualización de usuario...');
    console.log('📝 Datos recibidos:', req.body);
    console.log('🆔 ID del usuario:', req.params.id);
    
    const { id } = req.params;
    const { email, password, rol, activo, nombre, apellidos, cedula } = req.body;
    
    // Validaciones
    if (email && email.trim().length === 0) {
      console.log('❌ Email vacío');
      return res.status(400).json({ error: 'El email no puede estar vacío' });
    }
    
    if (password && password.length < 6) {
      console.log('❌ Contraseña muy corta');
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    if (rol && !['admin', 'empleado'].includes(rol)) {
      console.log('❌ Rol inválido:', rol);
      return res.status(400).json({ error: 'El rol debe ser admin o empleado' });
    }
    
    // Validar formato de email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('❌ Formato de email inválido:', email);
        return res.status(400).json({ error: 'Formato de email inválido' });
      }
    }
    
    console.log('✅ Validaciones pasadas, conectando a BD...');
    const client = await pool.connect();
    try {
      let query = 'UPDATE empleados SET updated_at = CURRENT_TIMESTAMP';
      let values = [];
      let paramCount = 0;
      
      if (email) {
        paramCount++;
        query += `, email = $${paramCount}`;
        values.push(email.trim().toLowerCase());
        console.log(`📧 Email a actualizar: ${email.trim().toLowerCase()}`);
      }
      
      if (password) {
        paramCount++;
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        query += `, password_hash = $${paramCount}`;
        values.push(passwordHash);
        console.log('🔐 Contraseña hasheada');
      }
      
      if (rol) {
        paramCount++;
        const isAdmin = rol === 'admin';
        query += `, is_admin = $${paramCount}`;
        values.push(isAdmin);
        console.log(`👑 Rol actualizado: ${rol} -> is_admin: ${isAdmin}`);
      }
      
      if (activo !== undefined) {
        paramCount++;
        query += `, activo = $${paramCount}`;
        values.push(activo);
        console.log(`✅ Estado activo: ${activo}`);
      }
      
      if (nombre !== undefined) {
        paramCount++;
        query += `, nombre = $${paramCount}`;
        values.push(nombre ? nombre.trim() : null);
        console.log(`👤 Nombre: ${nombre ? nombre.trim() : 'null'}`);
      }
      
      if (apellidos !== undefined) {
        paramCount++;
        query += `, apellidos = $${paramCount}`;
        values.push(apellidos ? apellidos.trim() : null);
        console.log(`👤 Apellidos: ${apellidos ? apellidos.trim() : 'null'}`);
      }
      
      if (cedula !== undefined) {
        paramCount++;
        query += `, cedula = $${paramCount}`;
        values.push(cedula ? cedula.trim() : null);
        console.log(`🆔 Cédula: ${cedula ? cedula.trim() : 'null'}`);
      }
      
      paramCount++;
      query += ` WHERE id = $${paramCount} RETURNING id, email, nombre, apellidos, cedula, is_admin, activo, created_at, updated_at`;
      values.push(id);
      
      console.log('📝 Query final:', query);
      console.log('📊 Valores:', values);
      
      const result = await client.query(query, values);
      console.log('✅ Query ejecutado exitosamente');
      console.log('📋 Resultado:', result.rows);
      
      if (result.rows.length === 0) {
        console.log('❌ Usuario no encontrado con ID:', id);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      console.log('✅ Usuario actualizado exitosamente');
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    
    if (error.code === '23505') { // Unique violation
      console.log('❌ Violación de unicidad - email duplicado');
      res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    } else {
      console.log('❌ Error interno del servidor');
      res.status(500).json({ error: 'Error interno del servidor al actualizar usuario' });
    }
  }
};

// Eliminar un usuario completamente de la base de datos
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Primero obtener el email del usuario para eliminar registros relacionados
      const userResult = await client.query(
        'SELECT email FROM empleados WHERE id = $1',
        [id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const userEmail = userResult.rows[0].email;
      
      // Iniciar transacción para eliminar en orden correcto
      await client.query('BEGIN');
      
      try {
        // 1. Eliminar registros de producción (si existen)
        await client.query(
          'DELETE FROM produccion WHERE empleado_email = $1',
          [userEmail]
        );
        console.log(`🗑️ Registros de producción eliminados para: ${userEmail}`);
        
        // 2. Eliminar registros de presencia (si existen)
        await client.query(
          'DELETE FROM presencia WHERE empleado_email = $1',
          [userEmail]
        );
        console.log(`🗑️ Registros de presencia eliminados para: ${userEmail}`);
        
        // 3. Finalmente eliminar el usuario de empleados
        const deleteResult = await client.query(
          'DELETE FROM empleados WHERE id = $1 RETURNING id, email',
          [id]
        );
        
        if (deleteResult.rows.length === 0) {
          throw new Error('No se pudo eliminar el usuario');
        }
        
        // Confirmar transacción
        await client.query('COMMIT');
        
        console.log(`✅ Usuario eliminado completamente: ${userEmail}`);
        res.json({ message: 'Usuario eliminado exitosamente de la base de datos' });
        
      } catch (deleteError) {
        // Revertir transacción en caso de error
        await client.query('ROLLBACK');
        throw deleteError;
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      res.status(400).json({ 
        error: 'No se puede eliminar el usuario porque tiene registros relacionados en otras tablas. Contacta al administrador del sistema.' 
      });
    } else {
      res.status(500).json({ error: 'Error interno del servidor al eliminar usuario' });
    }
  }
};

// Cambiar contraseña de usuario
exports.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Validaciones
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const client = await pool.connect();
    try {
      // Hash de la nueva contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const result = await client.query(
        `UPDATE empleados 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, is_admin`,
        [passwordHash, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor al cambiar contraseña' });
  }
};
