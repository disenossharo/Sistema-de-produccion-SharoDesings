const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccionController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');



// GET /api/produccion/presencia (obtener presencia de empleados)
router.get('/presencia', authenticateToken, requireAdmin, produccionController.getPresencia);

// POST /api/produccion/heartbeat (marcar empleado como online)
router.post('/heartbeat', authenticateToken, produccionController.updateHeartbeat);

// POST /api/produccion/logout (marcar empleado como offline)
router.post('/logout', authenticateToken, produccionController.logout);

// GET /api/produccion/historial (empleado ve su historial)
router.get('/historial', authenticateToken, produccionController.getHistorial);

// GET /api/produccion/tarea-en-progreso (obtener tarea en progreso del usuario)
router.get('/tarea-en-progreso', authenticateToken, produccionController.getTareaEnProgreso);

// GET /api/produccion/activas (solo tareas en progreso para dashboard)
router.get('/activas', authenticateToken, produccionController.getTareasActivas);

// GET /api/produccion/todas (cualquier usuario autenticado ve todas las tareas)
router.get('/todas', authenticateToken, produccionController.getAllTareas);

// GET /api/produccion/dia/:email (tareas del día para un empleado específico)
router.get('/dia/:email', authenticateToken, produccionController.getTareasDelDia);

// GET /api/produccion/tareas-del-dia/:email (tareas del día para un empleado específico - endpoint alternativo)
router.get('/tareas-del-dia/:email', authenticateToken, produccionController.getTareasDelDia);

// GET /api/produccion/estadisticas (estadísticas para admin)
router.get('/estadisticas', authenticateToken, requireAdmin, produccionController.getEstadisticas);

// POST /api/produccion/en-progreso (crear tarea en progreso)
router.post('/en-progreso', authenticateToken, produccionController.crearTareaEnProgreso);

// PUT /api/produccion/finalizar/:tareaId (finalizar tarea)
router.put('/finalizar/:tareaId', authenticateToken, produccionController.actualizarTareaFinalizada);

// POST /api/produccion/exportar-excel (exportar datos a Excel)
router.post('/exportar-excel', authenticateToken, requireAdmin, produccionController.exportarAExcel);

// POST /api/produccion/finalizar-todas (finalizar todas las tareas en progreso - solo admin)
router.post('/finalizar-todas', authenticateToken, requireAdmin, produccionController.finalizarTodasLasTareas);

module.exports = router; 