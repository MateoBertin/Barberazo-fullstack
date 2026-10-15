const express = require('express');
const turnoController = require('../controllers/turnoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Rutas de Turnos (Módulo 3 - Lucas)
 * Todas las rutas de turnos requieren autenticación previa con token JWT.
 * El servicio y controlador resuelven los permisos y restricciones según el rol del usuario.
 */

// GET /api/turnos -> Listar turnos con filtros opcionales (?fecha=&empleadoId=&clienteId=&estado=)
router.get('/', authenticateToken, turnoController.getAll);

// GET /api/turnos/:id -> Detalle de un turno
router.get('/:id', authenticateToken, turnoController.getById);

// POST /api/turnos -> Reservar un nuevo turno (CUU1.2 con validación RN05 y RN06)
router.post('/', authenticateToken, turnoController.create);

// PATCH /api/turnos/:id/estado -> Actualizar estado (ASISTIDO, NO ASISTIDO con strike/multa, CANCELADO)
router.patch('/:id/estado', authenticateToken, turnoController.updateStatus);

module.exports = router;
