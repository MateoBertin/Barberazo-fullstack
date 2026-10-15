const servicioRepository = require('../repositories/servicioRepository');

// Regla de negocio: todos los servicios duran 60 minutos (un turno = una hora).
const DURACION_FIJA_MINUTOS = 60;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Limpia y valida los datos que llegan del formulario.
// Se reutiliza en create y update para no repetir las mismas reglas.
function validarDatos({ nombre, descripcion, precio }) {
  const nombreLimpio = nombre !== undefined ? String(nombre).trim() : '';
  if (!nombreLimpio) {
    throw createError('El nombre es obligatorio', 400);
  }

  const precioNum = Number(precio);
  if (precio === undefined || precio === null || precio === '' || Number.isNaN(precioNum) || precioNum <= 0) {
    throw createError('El precio debe ser un número mayor a 0', 400);
  }

  const descripcionLimpia = descripcion !== undefined && descripcion !== null
    ? String(descripcion).trim()
    : '';

  return {
    nombre: nombreLimpio,
    descripcion: descripcionLimpia || null,
    precio: precioNum,
    duracion_minutos: DURACION_FIJA_MINUTOS,
  };
}

// Lista servicios. Si se pide soloHabilitados (wizard de reservas), filtra los deshabilitados.
async function getAll(soloHabilitados = false) {
  const servicios = await servicioRepository.findAll();
  if (!soloHabilitados) return servicios;
  return servicios.filter((s) => s.estado === 'HABILITADO');
}

// CUU7.1 - Alta de servicio.
async function create(datos) {
  const limpio = validarDatos(datos);

  const existente = await servicioRepository.findByNombre(limpio.nombre);
  if (existente) {
    throw createError('Ya existe un servicio con ese nombre', 409);
  }

  const id = await servicioRepository.create(limpio);
  return servicioRepository.findById(id);
}

// CUU7.2 - Modificación de servicio.
async function update(id, datos) {
  const servicio = await servicioRepository.findById(id);
  if (!servicio) {
    throw createError('Servicio no encontrado', 404);
  }

  const limpio = validarDatos(datos);

  // El nombre puede repetirse solo si pertenece al mismo servicio que estamos editando.
  const duplicado = await servicioRepository.findByNombre(limpio.nombre);
  if (duplicado && duplicado.id_servicio !== servicio.id_servicio) {
    throw createError('Ya existe otro servicio con ese nombre', 409);
  }

  await servicioRepository.update(id, limpio);
  return servicioRepository.findById(id);
}

// Habilita/deshabilita. No se borra para no romper turnos históricos.
async function toggleEstado(id) {
  const servicio = await servicioRepository.findById(id);
  if (!servicio) {
    throw createError('Servicio no encontrado', 404);
  }

  const next = servicio.estado === 'HABILITADO' ? 'DESHABILITADO' : 'HABILITADO';
  await servicioRepository.updateEstado(id, next);
  return servicioRepository.findById(id);
}

module.exports = { getAll, create, update, toggleEstado };
