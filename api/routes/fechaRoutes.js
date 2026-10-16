const express = require('express');
const fechaController = require('../controllers/fechaController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Parte 1 (Pedro): CRUD Simple 2 - Días Laborales y Horarios (CUU6.1 / CUU6.2)
// Endpoints:
// GET    /api/fechas                 (público / clientes para consultar días de atención)
// PATCH  /api/fechas/:fecha/toggle   (ADMIN: habilitar o deshabilitar fecha)
// PUT    /api/fechas/:fecha/horario  (ADMIN: modificar horario de apertura y cierre)

router.get('/', fechaController.getAll);
router.patch('/:fecha/toggle', authenticateToken, requireRole('ADMIN'), fechaController.toggleFecha);
router.put('/:fecha/horario', authenticateToken, requireRole('ADMIN'), fechaController.updateHorario);

module.exports = router;
