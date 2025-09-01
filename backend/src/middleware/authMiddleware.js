const { verifyToken } = require('../services/authService');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar si es admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    return res.status(403).json({ error: 'Error verificando permisos' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin
}; 