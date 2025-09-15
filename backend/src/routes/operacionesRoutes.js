const express = require('express');
const router = express.Router();
const operacionesController = require('../controllers/operacionesController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas para operaciones
router.get('/', authenticateToken, operacionesController.getOperaciones); // Admin ve todas
router.get('/activas', authenticateToken, operacionesController.getOperacionesActivas); // Empleados ven solo activas
router.get('/por-referencia/:referencia_id', authenticateToken, operacionesController.getOperacionesActivasPorReferencia); // Operaciones por referencia
router.get('/:id', authenticateToken, operacionesController.getOperacion);
router.post('/', authenticateToken, requireAdmin, operacionesController.createOperacion);
router.put('/toggle-all', authenticateToken, requireAdmin, operacionesController.toggleAllOperaciones); // Toggle todas las operaciones - DEBE IR ANTES DE /:id
router.put('/:id', authenticateToken, requireAdmin, operacionesController.updateOperacion);
router.delete('/:id', authenticateToken, requireAdmin, operacionesController.deleteOperacion);

// Rutas para gestión de referencias en operaciones
router.post('/:id/referencias', authenticateToken, requireAdmin, operacionesController.addReferenciasToOperacion);
router.delete('/:id/referencias', authenticateToken, requireAdmin, operacionesController.removeReferenciasFromOperacion);

module.exports = router;
