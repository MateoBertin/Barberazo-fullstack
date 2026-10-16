const express = require('express');
const fechaController = require('../controllers/fechaController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', fechaController.getAll);
router.patch('/:fecha/toggle', authenticateToken, requireRole('ADMIN'), fechaController.toggleFecha);
router.put('/:fecha/horario', authenticateToken, requireRole('ADMIN'), fechaController.updateHorario);

module.exports = router;
