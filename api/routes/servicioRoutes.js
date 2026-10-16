const express = require('express');
const servicioController = require('../controllers/servicioController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Parte 1 (Pedro): ABM de servicios (CUU7.1 / CUU7.2).
// Endpoints:
// GET    /api/servicios            (público: lo usa el wizard de reservas; ?habilitados=true filtra)
// POST   /api/servicios            (ADMIN)
// PUT    /api/servicios/:id        (ADMIN)
// PATCH  /api/servicios/:id/estado (ADMIN)

router.get('/', servicioController.getAll);
router.post('/', authenticateToken, requireRole('ADMIN'), servicioController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), servicioController.update);
router.patch('/:id/estado', authenticateToken, requireRole('ADMIN'), servicioController.toggleEstado);

module.exports = router;
