const express = require('express');
const router = express.Router();

// Esqueleto preparado para Pedro (Parte 1)
// Endpoints esperados:
// GET    /api/servicios
// POST   /api/servicios
// PUT    /api/servicios/:id
// PATCH  /api/servicios/:id/estado

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de servicios activo', data: [] });
});

module.exports = router;
