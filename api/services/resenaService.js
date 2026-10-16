const resenaRepository = require('../repositories/resenaRepository');
const turnoRepository = require('../repositories/turnoRepository');
const clienteRepository = require('../repositories/clienteRepository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/*Obtiene todas las reseñas. Si el usuario logueado es EMPLEADO, puede filtrarse por su propio perfil*/
async function getAll(user) {
  const reviews = await resenaRepository.findAll();

  // Si es un EMPLEADO, filtra solo las reseñas de sus turnos atendidos
  if (user && user.rol === 'EMPLEADO') {
    return reviews.filter((r) => r.empleado_email === user.email);
  }

  return reviews;
}

async function create({ id_turno, appointmentId, calificacion, rating, comentario, comment }, user) {
  const resolvedTurnoId = id_turno || appointmentId;
  const resolvedCalificacion = Number(calificacion ?? rating);
  const resolvedComentario = (comentario ?? comment ?? '').trim();

  if (!resolvedTurnoId) {
    throw createError('El ID del turno es obligatorio', 400);
  }

  if (isNaN(resolvedCalificacion) || resolvedCalificacion < 1 || resolvedCalificacion > 5) {
    throw createError('La calificación debe ser un número entero entre 1 y 5', 400);
  }

  // Verificar turno
  const turno = await turnoRepository.findById(resolvedTurnoId);
  if (!turno) {
    throw createError('El turno especificado no existe', 404);
  }

  //Solo se pueden reseñar turnos ASISTIDOS
  if (turno.estado !== 'ASISTIDO') {
    throw createError('Solo podés calificar turnos que hayan sido completados y asistidos', 400);
  }

  // Resolver cliente
  let resolvedClienteId = turno.id_cliente;
  if (user && user.rol === 'CLIENTE') {
    const cliente = await clienteRepository.findByUserId(user.id);
    if (!cliente || cliente.id_cliente !== turno.id_cliente) {
      throw createError('No tenés permisos para calificar un turno que no te pertenece', 403);
    }
    resolvedClienteId = cliente.id_cliente;
  }

  // Verificar si ya existe reseña para este turno
  const existingReview = await resenaRepository.findByTurnoId(resolvedTurnoId);
  if (existingReview) {
    throw createError('Este turno ya cuenta con una reseña registrada', 409);
  }

  const idResena = await resenaRepository.create({
    id_cliente: resolvedClienteId,
    id_turno: resolvedTurnoId,
    calificacion: resolvedCalificacion,
    comentario: resolvedComentario || null,
  });

  return resenaRepository.findById(idResena);
}

module.exports = {
  getAll,
  create,
};
