const express = require('express');
const router = express.Router();

// Esqueleto preparado para Lucas (Parte 3)
// Endpoints esperados:
// GET    /api/resenas
// POST   /api/resenas (solo si turno fue ASISTIDO)

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de reseñas activo', data: [] });
});

module.exports = router;
