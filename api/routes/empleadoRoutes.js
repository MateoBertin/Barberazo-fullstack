const express = require('express');
const router = express.Router();

// Esqueleto preparado para Mateo (Parte 2)
// Endpoints esperados:
// GET    /api/empleados
// POST   /api/empleados
// PUT    /api/empleados/:id
// DELETE /api/empleados/:id

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Módulo de empleados activo', data: [] });
});

module.exports = router;
