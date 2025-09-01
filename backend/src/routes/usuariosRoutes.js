const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas para usuarios del sistema (solo admin puede gestionar)
router.get('/', authenticateToken, requireAdmin, usuariosController.getUsuarios);
router.get('/:id', authenticateToken, requireAdmin, usuariosController.getUsuario);
router.post('/', authenticateToken, requireAdmin, usuariosController.createUsuario);
router.put('/:id', authenticateToken, requireAdmin, usuariosController.updateUsuario);
router.delete('/:id', authenticateToken, requireAdmin, usuariosController.deleteUsuario);
router.put('/:id/password', authenticateToken, requireAdmin, usuariosController.cambiarPassword);

module.exports = router;
