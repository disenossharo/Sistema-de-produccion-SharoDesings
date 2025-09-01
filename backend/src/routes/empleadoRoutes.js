const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const empleadoController = require('../controllers/empleadoController');

// GET /api/empleados/perfil
router.get('/perfil', authenticateToken, empleadoController.getPerfil);

// GET /api/empleados (listar todos los empleados, solo admin)
router.get('/', authenticateToken, requireAdmin, empleadoController.getEmpleados);

// POST /api/empleados (crear empleado)
router.post('/', authenticateToken, empleadoController.createEmpleado);

// PUT /api/empleados (actualizar empleado)
router.put('/', authenticateToken, empleadoController.updateEmpleado);

module.exports = router; 