const express = require('express');
const router = express.Router();

// Esqueleto preparado para Lucas (Parte 3)
// Endpoints esperados:
// GET    /api/turnos (con query params: fecha, empleadoId, clienteId, estado)
// POST   /api/turnos (reserva de turno con validaciones RN05 y RN06)
// PATCH  /api/turnos/:id/estado (ASISTIDO, NO ASISTIDO con strike/multa, CANCELADO)

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de turnos activo', data: [] });
});

module.exports = router;
