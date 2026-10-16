const fechaService = require('../services/fechaService');

function responderError(res, error, mensajePorDefecto) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? mensajePorDefecto : error.message,
  });
}

async function getAll(req, res) {
  try {
    const { desde, hasta, estado } = req.query;
    const fechas = await fechaService.getAll({ desde, hasta, estado });
    return res.status(200).json({
      success: true,
      message: 'Fechas obtenidas correctamente',
      data: fechas,
    });
  } catch (error) {
    return responderError(res, error, 'Error al obtener fechas del calendario');
  }
}

async function toggleFecha(req, res) {
  try {
    const { fecha } = req.params;
    const { motivo } = req.body || {};
    const diaActualizado = await fechaService.toggleFecha(fecha, motivo);
    const habilitado = diaActualizado.estado === 'HABILITADO';
    return res.status(200).json({
      success: true,
      message: habilitado ? `Fecha ${fecha} habilitada correctamente` : `Fecha ${fecha} deshabilitada correctamente`,
      data: diaActualizado,
    });
  } catch (error) {
    return responderError(res, error, 'Error al cambiar estado de la fecha');
  }
}

async function updateHorario(req, res) {
  try {
    const { fecha } = req.params;
    const { startTime, endTime } = req.body || {};
    const diaActualizado = await fechaService.updateHorario(fecha, { startTime, endTime });
    return res.status(200).json({
      success: true,
      message: `Horario del ${fecha} actualizado correctamente a ${diaActualizado.hora_inicio} - ${diaActualizado.hora_fin}`,
      data: diaActualizado,
    });
  } catch (error) {
    return responderError(res, error, 'Error al actualizar horario de la fecha');
  }
}

module.exports = {
  getAll,
  toggleFecha,
  updateHorario,
};
