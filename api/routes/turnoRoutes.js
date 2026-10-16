const express = require('express');
const turnoController = require('../controllers/turnoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/*Rutas de Turnos
Todas las rutas de turnos requieren autenticación previa con token y el servicio y controlador resuelven los permisos y restricciones según el rol del usuario.*/

// GET Listar turnos con filtros opcionales
router.get('/', authenticateToken, turnoController.getAll);

// GET Detalle de un turno
router.get('/:id', authenticateToken, turnoController.getById);

// POST Reservar un nuevo turno 
router.post('/', authenticateToken, turnoController.create);

// PATCH Actualizar estado (ASISTIDO, NO ASISTIDO, CANCELADO)
router.patch('/:id/estado', authenticateToken, turnoController.updateStatus);

module.exports = router;
