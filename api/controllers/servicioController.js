const servicioService = require('../services/servicioService');

// Traduce un error del service a una respuesta HTTP.
// Si el error trae statusCode (400, 404, 409) lo usamos; si no, es un error inesperado -> 500.
function responderError(res, error, mensajePorDefecto) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? mensajePorDefecto : error.message,
  });
}

async function getAll(req, res) {
  try {
    // GET /api/servicios?habilitados=true -> solo los reservables (wizard de turnos)
    const soloHabilitados = req.query.habilitados === 'true';
    const servicios = await servicioService.getAll(soloHabilitados);
    return res.status(200).json({
      success: true,
      message: 'Servicios obtenidos correctamente',
      data: servicios,
    });
  } catch (error) {
    return responderError(res, error, 'Error al obtener servicios');
  }
}

async function create(req, res) {
  try {
    const servicio = await servicioService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Servicio creado correctamente',
      data: servicio,
    });
  } catch (error) {
    return responderError(res, error, 'Error al crear servicio');
  }
}

async function update(req, res) {
  try {
    const servicio = await servicioService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Servicio actualizado correctamente',
      data: servicio,
    });
  } catch (error) {
    return responderError(res, error, 'Error al actualizar servicio');
  }
}

async function toggleEstado(req, res) {
  try {
    const servicio = await servicioService.toggleEstado(req.params.id);
    const habilitado = servicio.estado === 'HABILITADO';
    return res.status(200).json({
      success: true,
      message: habilitado ? 'Servicio habilitado correctamente' : 'Servicio deshabilitado correctamente',
      data: servicio,
    });
  } catch (error) {
    return responderError(res, error, 'Error al cambiar estado del servicio');
  }
}

module.exports = { getAll, create, update, toggleEstado };
