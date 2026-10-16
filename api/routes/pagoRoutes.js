const express = require('express');
const pagoController = require('../controllers/pagoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/* Rutas de Pagos e Integración con Mercado Pago*/

router.get('/multas', authenticateToken, pagoController.getMisMultas);

router.post('/preferencia', authenticateToken, pagoController.crearPreferencia);

router.post('/confirmar', authenticateToken, pagoController.confirmarPago);

module.exports = router;
