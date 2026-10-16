const express = require('express');
const servicioController = require('../controllers/servicioController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', servicioController.getAll);
router.post('/', authenticateToken, requireRole('ADMIN'), servicioController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), servicioController.update);
router.patch('/:id/estado', authenticateToken, requireRole('ADMIN'), servicioController.toggleEstado);

module.exports = router;
