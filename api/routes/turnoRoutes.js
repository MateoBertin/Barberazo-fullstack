const express = require('express');
const turnoController = require('../controllers/turnoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/*Todas las rutas de turnos requieren autenticación previa con token; el servicio
y el controlador resuelven los permisos y restricciones según el rol del usuario.*/

router.get('/', authenticateToken, turnoController.getAll);

router.get('/:id', authenticateToken, turnoController.getById);

router.post('/', authenticateToken, turnoController.create);

router.patch('/:id/estado', authenticateToken, turnoController.updateStatus);

module.exports = router;
