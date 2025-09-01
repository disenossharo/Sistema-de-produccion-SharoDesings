const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Registrar un nuevo usuario
async function registerUser(email, password, nombre, apellidos = '', cedula = '', cargoMaquina = '') {
  const client = await pool.connect();
  try {
    // Verificar si el usuario ya existe
    const existingUser = await client.query(
      'SELECT * FROM empleados WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('El usuario ya existe');
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario en empleados
    const result = await client.query(
      `INSERT INTO empleados (email, nombre, apellidos, cedula, cargo_maquina, password_hash, is_admin) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [email, nombre, apellidos, cedula, cargoMaquina, passwordHash, false]
    );

    // Crear registro de presencia
    await client.query(
      `INSERT INTO presencia (empleado_email, online, last_seen) 
       VALUES ($1, false, CURRENT_TIMESTAMP)`,
      [email]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

// Autenticar usuario
async function authenticateUser(email, password) {
  const client = await pool.connect();
  try {
    // Buscar usuario por email en empleados
    const result = await client.query(
      'SELECT * FROM empleados WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Contraseña incorrecta');
    }

    return user;
  } finally {
    client.release();
  }
}

// Generar token JWT
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      isAdmin: user.is_admin 
    },
    process.env.JWT_SECRET || 'secreto',
    { expiresIn: '7d' }
  );
}

// Verificar token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secreto');
  } catch (error) {
    throw new Error('Token inválido');
  }
}

// Obtener usuario por email
async function getUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM empleados WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

module.exports = {
  registerUser,
  authenticateUser,
  generateToken,
  verifyToken,
  getUserByEmail
}; 