const mercadoPagoService = require('../services/mercadoPagoService');

async function getMisMultas(req, res) {
  try {
    const data = await mercadoPagoService.getMisMultas(req.user);
    return res.status(200).json({
      success: true,
      message: 'Multas obtenidas correctamente',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener las multas',
    });
  }
}

async function crearPreferencia(req, res) {
  try {
    const idMulta = req.body.id_multa || req.body.idMulta || req.body.fineId;
    if (!idMulta) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la multa es obligatorio',
      });
    }

    const data = await mercadoPagoService.crearPreferencia(idMulta, req.user);
    return res.status(200).json({
      success: true,
      message: 'Preferencia de Mercado Pago generada correctamente',
      data,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al crear la preferencia de pago',
    });
  }
}

async function confirmarPago(req, res) {
  try {
    const idMulta = req.body.id_multa || req.body.idMulta || req.body.fineId;
    const paymentMethod = req.body.paymentMethod || req.body.metodoPago || 'Mercado Pago';

    if (!idMulta) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la multa es obligatorio',
      });
    }

    const result = await mercadoPagoService.confirmarPago(
      idMulta,
      { paymentMethod },
      req.user
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al procesar el pago de la multa',
    });
  }
}

module.exports = {
  getMisMultas,
  crearPreferencia,
  confirmarPago,
};
