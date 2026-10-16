const express = require('express');
const pagoController = require('../controllers/pagoController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Rutas de Pagos e Integración con Mercado Pago (CUU4.1 - Pagar Multa)
 * Módulo 3 - Lucas (DSW)
 * Todas las rutas están protegidas con el middleware de autenticación authenticateToken.
 */

// GET  /api/pagos/multas      -> Consulta historial de multas y estado del cliente
router.get('/multas', authenticateToken, pagoController.getMisMultas);

// POST /api/pagos/preferencia -> Crea preferencia de checkout en Mercado Pago
router.post('/preferencia', authenticateToken, pagoController.crearPreferencia);

// POST /api/pagos/confirmar   -> Confirma pago, resetea strikes a 0 y rehabilita cuenta a ACTIVO
router.post('/confirmar', authenticateToken, pagoController.confirmarPago);

module.exports = router;
