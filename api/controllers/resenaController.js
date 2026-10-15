const resenaService = require('../services/resenaService');

/**
 * Controlador de Reseñas (CUU1.4 y CUU8.1)
 * Parte 3 - Lucas (DSW)
 */

async function getAll(req, res) {
  try {
    const reviews = await resenaService.getAll(req.user);
    return res.status(200).json({
      success: true,
      message: 'Reseñas obtenidas correctamente',
      data: reviews,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener las reseñas',
    });
  }
}

async function create(req, res) {
  try {
    const review = await resenaService.create(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: '¡Gracias por calificar tu turno!',
      data: review,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al enviar la reseña',
    });
  }
}

module.exports = {
  getAll,
  create,
};
