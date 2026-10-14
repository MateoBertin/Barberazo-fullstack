const express = require('express');
const router = express.Router();

// Esqueleto preparado para Pedro (Parte 1)
// Endpoints esperados:
// GET    /api/fechas
// PATCH  /api/fechas/:fecha/toggle
// PUT    /api/fechas/:fecha/horario

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de fechas/calendario activo', data: [] });
});

module.exports = router;
