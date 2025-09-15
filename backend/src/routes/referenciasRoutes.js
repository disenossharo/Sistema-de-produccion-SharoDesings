const express = require('express');
const router = express.Router();
const referenciasController = require('../controllers/referenciasController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas para referencias
router.get('/', authenticateToken, referenciasController.getReferencias); // Admin ve todas
router.get('/activas', authenticateToken, referenciasController.getReferenciasActivas); // Empleados ven solo activas
router.get('/con-operaciones', authenticateToken, referenciasController.getReferenciasConOperaciones); // Referencias con conteo de operaciones
router.get('/:id', authenticateToken, referenciasController.getReferencia);
router.get('/:id/operaciones', authenticateToken, referenciasController.getReferenciaConOperaciones); // Referencia con operaciones vinculadas
router.get('/categoria/:categoria', authenticateToken, referenciasController.getReferenciasPorCategoria);
router.post('/', authenticateToken, requireAdmin, referenciasController.createReferencia);
router.put('/:id', authenticateToken, requireAdmin, referenciasController.updateReferencia);
router.delete('/:id', authenticateToken, requireAdmin, referenciasController.deleteReferencia);

module.exports = router;
