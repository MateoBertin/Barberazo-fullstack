const express = require('express');
const clienteController = require('../controllers/clienteController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Fase 4 (Mateo): listado + bloqueo. Fase 5: perfil propio (CUU9.1/9.2).
// /perfil va ANTES de /:id para que Express no confunda "perfil" con un id.
// Endpoints:
// GET    /api/clientes (ADMIN, EMPLEADO)
// PATCH  /api/clientes/:id/bloqueo (ADMIN)
// PUT    /api/clientes/perfil (CLIENTE)
// DELETE /api/clientes/perfil (CLIENTE)

router.put('/perfil', authenticateToken, requireRole('CLIENTE'), clienteController.updateProfile);
router.delete('/perfil', authenticateToken, requireRole('CLIENTE'), clienteController.deleteAccount);
router.get('/', authenticateToken, requireRole('ADMIN', 'EMPLEADO'), clienteController.getAll);
router.patch('/:id/bloqueo', authenticateToken, requireRole('ADMIN'), clienteController.toggleBlock);

module.exports = router;
