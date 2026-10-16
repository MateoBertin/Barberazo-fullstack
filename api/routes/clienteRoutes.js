const express = require('express');
const clienteController = require('../controllers/clienteController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// /perfil va ANTES de /:id para que Express no confunda "perfil" con un id.

router.put('/perfil', authenticateToken, requireRole('CLIENTE'), clienteController.updateProfile);
router.delete('/perfil', authenticateToken, requireRole('CLIENTE'), clienteController.deleteAccount);
router.get('/', authenticateToken, requireRole('ADMIN', 'EMPLEADO'), clienteController.getAll);
router.patch('/:id/bloqueo', authenticateToken, requireRole('ADMIN'), clienteController.toggleBlock);

module.exports = router;
