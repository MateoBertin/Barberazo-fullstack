const clienteRepository = require('../repositories/clienteRepository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getAll(estado) {
  const clientes = await clienteRepository.findAll();
  if (!estado) return clientes;
  const clean = String(estado).toUpperCase();
  return clientes.filter((c) => c.estado === clean);
}

// Solo alterna ACTIVO <-> BLOQUEADO: el estado MULTADO lo gestiona el
// módulo de turnos y no se pisa; REGISTRADO aún no confirmó su registro.
async function toggleBlock(id) {
  const cliente = await clienteRepository.findById(id);
  if (!cliente) {
    throw createError('Cliente no encontrado', 404);
  }
  if (cliente.estado === 'MULTADO') {
    throw createError('El cliente está multado: regularizá la multa antes de cambiar el bloqueo', 409);
  }
  if (cliente.estado === 'REGISTRADO') {
    throw createError('El cliente aún no confirmó su registro', 409);
  }
  const next = cliente.estado === 'BLOQUEADO' ? 'ACTIVO' : 'BLOQUEADO';
  await clienteRepository.updateEstado(id, next);
  return clienteRepository.findById(id);
}

async function updateProfile(idUsuario, { nombre, apellido, telefono }) {
  const cliente = await clienteRepository.findByUserId(idUsuario);
  if (!cliente) {
    throw createError('Perfil de cliente no encontrado', 404);
  }
  const nextNombre = nombre !== undefined ? String(nombre).trim() : cliente.nombre;
  const nextApellido = apellido !== undefined ? String(apellido).trim() : cliente.apellido;
  const nextTelefono = telefono !== undefined ? String(telefono).trim() : cliente.telefono;
  if (!nextNombre) {
    throw createError('El nombre es obligatorio', 400);
  }
  await clienteRepository.updateProfile(idUsuario, {
    nombre: nextNombre,
    apellido: nextApellido || null,
    telefono: nextTelefono || null,
  });
  return clienteRepository.findByUserId(idUsuario);
}

// Se bloquea si tiene turnos (pasados o futuros) para no romper el historial.
async function deleteAccount(idUsuario) {
  const cliente = await clienteRepository.findByUserId(idUsuario);
  if (!cliente) {
    throw createError('Perfil de cliente no encontrado', 404);
  }
  const total = await clienteRepository.countTurnos(cliente.id_cliente);
  if (total > 0) {
    throw createError('No se puede eliminar la cuenta: tenés turnos registrados en el historial', 409);
  }
  await clienteRepository.deleteUsuario(idUsuario);
}

module.exports = { getAll, toggleBlock, updateProfile, deleteAccount };
