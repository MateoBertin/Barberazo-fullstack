const express = require('express');
const empleadoController = require('../controllers/empleadoController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Fase 1 (Mateo): lectura. Fase 2: alta y edición solo ADMIN.
// Fase 3: baja lógica (DELETE pasa a INACTIVO, bloqueada si tiene turnos futuros).
router.get('/', authenticateToken, empleadoController.getAll);
router.get('/:id', authenticateToken, empleadoController.getById);
router.post('/', authenticateToken, requireRole('ADMIN'), empleadoController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), empleadoController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), empleadoController.remove);

module.exports = router;
