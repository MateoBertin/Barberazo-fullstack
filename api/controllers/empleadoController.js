const empleadoService = require('../services/empleadoService');

async function getAll(req, res) {
  try {
    const empleados = await empleadoService.getAll(req.query.estado);
    return res.status(200).json({
      success: true,
      message: 'Empleados obtenidos correctamente',
      data: empleados,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener empleados',
    });
  }
}

async function getById(req, res) {
  try {
    const empleado = await empleadoService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Empleado obtenido correctamente',
      data: empleado,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener empleado',
    });
  }
}

async function create(req, res) {
  try {
    const empleado = await empleadoService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Empleado creado correctamente',
      data: empleado,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al crear empleado',
    });
  }
}

async function update(req, res) {
  try {
    const empleado = await empleadoService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Empleado actualizado correctamente',
      data: empleado,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al actualizar empleado',
    });
  }
}

async function remove(req, res) {
  try {
    const empleado = await empleadoService.remove(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Empleado dado de baja correctamente',
      data: empleado,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const body = {
      success: false,
      message: error.message || 'Error al dar de baja empleado',
    };
    if (error.details) body.details = error.details;
    return res.status(statusCode).json(body);
  }
}

module.exports = { getAll, getById, create, update, remove };
