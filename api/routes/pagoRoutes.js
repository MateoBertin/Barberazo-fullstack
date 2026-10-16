const express = require('express');
const pagoController = require('../controllers/pagoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/* Rutas de Pagos e Integración con Mercado Pago*/

// Consulta historial de multas y estado del cliente
router.get('/multas', authenticateToken, pagoController.getMisMultas);

// Crea preferencia de checkout en Mercado Pago
router.post('/preferencia', authenticateToken, pagoController.crearPreferencia);

// Confirma pago, resetea strikes a 0 y rehabilita cuenta a ACTIVO
router.post('/confirmar', authenticateToken, pagoController.confirmarPago);

module.exports = router;
