const express = require('express');
const resenaController = require('../controllers/resenaController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/*Rutas de Reseñas 
 Endpoints:
 GET Consultar reseñas (CUU8.1)
 POST Dejar calificación de un turno completado/asistido*/

router.get('/', authenticateToken, resenaController.getAll);
router.post('/', authenticateToken, resenaController.create);

module.exports = router;
