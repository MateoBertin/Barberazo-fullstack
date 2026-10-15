const express = require('express');
const resenaController = require('../controllers/resenaController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Rutas de Reseñas (Módulo 3 - Lucas)
 * Endpoints:
 * GET  /api/resenas -> Consultar reseñas (CUU8.1)
 * POST /api/resenas -> Dejar calificación de un turno completado/asistido (CUU1.4)
 */

router.get('/', authenticateToken, resenaController.getAll);
router.post('/', authenticateToken, resenaController.create);

module.exports = router;
