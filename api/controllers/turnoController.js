const turnoService = require('../services/turnoService');

/**
 * Controlador de Turnos (Manejo de HTTP req, res y códigos de estado)
 * Parte 3 - Lucas (DSW)
 */

/**
 * GET /api/turnos
 * Obtiene lista de turnos con filtros opcionales (fecha, id_empleado, id_cliente, estado)
 */
async function getAll(req, res) {
  try {
    const filters = {
      fecha: req.query.fecha,
      id_empleado: req.query.id_empleado || req.query.empleadoId,
      id_cliente: req.query.id_cliente || req.query.clienteId,
      estado: req.query.estado,
    };

    const turnos = await turnoService.getAll(filters, req.user);

    return res.status(200).json({
      success: true,
      message: 'Turnos obtenidos correctamente',
      data: turnos,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener los turnos',
    });
  }
}

/**
 * GET /api/turnos/:id
 * Obtiene un turno por su ID
 */
async function getById(req, res) {
  try {
    const turno = await turnoService.getById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Turno obtenido correctamente',
      data: turno,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener el turno',
    });
  }
}

/**
 * POST /api/turnos
 * CUU1.2 - Reserva de un nuevo turno
 */
async function create(req, res) {
  try {
    const turnoData = {
      id_cliente: req.body.id_cliente || req.body.clienteId,
      id_empleado: req.body.id_empleado || req.body.empleadoId,
      id_servicio: req.body.id_servicio || req.body.servicioId,
      fecha_hora: req.body.fecha_hora || (req.body.fecha && req.body.hora ? `${req.body.fecha} ${req.body.hora}:00` : null),
    };

    const nuevoTurno = await turnoService.create(turnoData, req.user);

    return res.status(201).json({
      success: true,
      message: 'Turno reservado exitosamente',
      data: nuevoTurno,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al reservar el turno',
    });
  }
}

/**
 * PATCH /api/turnos/:id/estado
 * CUU1.3, CUU1.5, CUU1.6 - Cambio de estado de un turno
 * Estados: ASISTIDO | NO ASISTIDO | CANCELADO
 */
async function updateStatus(req, res) {
  try {
    const estado = req.body.estado || req.body.status;
    const motivo = req.body.motivo || req.body.reason;

    const result = await turnoService.updateStatus(
      req.params.id,
      { estado, motivo },
      req.user
    );

    let message = `Turno marcado como ${estado} correctamente`;
    if (result.multaGenerada) {
      message = 'Inasistencia/Cancelación tardía registrada. El cliente acumuló 3 strikes y se ha generado una multa de $3.000.';
    } else if (result.strikeSumado) {
      message = 'Inasistencia/Cancelación tardía registrada. Se ha computado +1 strike al cliente.';
    }

    return res.status(200).json({
      success: true,
      message,
      data: result.turno,
      strikeSumado: result.strikeSumado,
      multaGenerada: result.multaGenerada,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al actualizar el estado del turno',
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
};
