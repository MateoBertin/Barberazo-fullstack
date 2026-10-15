const clienteService = require('../services/clienteService');

async function getAll(req, res) {
  try {
    const clientes = await clienteService.getAll(req.query.estado);
    return res.status(200).json({
      success: true,
      message: 'Clientes obtenidos correctamente',
      data: clientes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
    });
  }
}

async function toggleBlock(req, res) {
  try {
    const cliente = await clienteService.toggleBlock(req.params.id);
    const bloqueado = cliente.estado === 'BLOQUEADO';
    return res.status(200).json({
      success: true,
      message: bloqueado ? 'Cliente bloqueado correctamente' : 'Cliente desbloqueado correctamente',
      data: cliente,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al cambiar bloqueo',
    });
  }
}

async function updateProfile(req, res) {
  try {
    const cliente = await clienteService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: cliente,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al actualizar perfil',
    });
  }
}

async function deleteAccount(req, res) {
  try {
    await clienteService.deleteAccount(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Cuenta eliminada correctamente',
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al eliminar cuenta',
    });
  }
}

module.exports = { getAll, toggleBlock, updateProfile, deleteAccount };
