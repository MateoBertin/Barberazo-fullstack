const express = require('express');
const router = express.Router();

// Esqueleto preparado para Mateo (Parte 2)
// Endpoints esperados:
// GET    /api/clientes
// PATCH  /api/clientes/:id/bloqueo
// PUT    /api/clientes/perfil

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de clientes activo', data: [] });
});

module.exports = router;
