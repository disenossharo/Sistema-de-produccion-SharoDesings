const { authenticateUser, generateToken, registerUser } = require('../services/authService');
const { isAdminEmail } = require('../config/adminEmails');

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Autenticar usuario
    const user = await authenticateUser(email, password);
    
    // Generar token JWT
    const token = generateToken(user);
    
    console.log('✅ Login exitoso:', email);
    res.json({ 
      success: true, 
      message: 'Login exitoso', 
      token, 
      user: { 
        email: user.email, 
        nombre: user.nombre,
        isAdmin: user.is_admin 
      } 
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(401).json({ error: error.message });
  }
};

// Registrar nuevo usuario
exports.register = async (req, res) => {
  try {
    const { email, password, nombre, apellidos, cedula, cargoMaquina } = req.body;
    
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    // Registrar usuario
    const user = await registerUser(email, password, nombre, apellidos, cedula, cargoMaquina);
    
    // Generar token JWT
    const token = generateToken(user);
    
    console.log('✅ Usuario registrado:', email);
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente', 
      token, 
      user: { 
        email: user.email, 
        nombre: user.nombre,
        isAdmin: user.is_admin 
      } 
    });
  } catch (error) {
    console.error('❌ Error en registro:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Verificar token
exports.validateToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' });
    }

    const { verifyToken } = require('../services/authService');
    const decoded = verifyToken(token);
    
    res.json({ 
      valid: true, 
      user: {
        id: decoded.id,
        email: decoded.email, 
        isAdmin: decoded.isAdmin 
      } 
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
};

// Verificar si un usuario es admin (para compatibilidad)
exports.isAdmin = (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  const isAdmin = isAdminEmail(email);
  res.json({ isAdmin });
}; 