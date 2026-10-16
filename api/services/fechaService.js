const diaTrabajoRepository = require('../repositories/diaTrabajoRepository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function validarFechaStr(fecha) {
  if (!fecha || !DATE_REGEX.test(fecha)) {
    throw createError('Formato de fecha inválido. Se espera YYYY-MM-DD', 400);
  }
}

async function getAll(filtros = {}) {
  return diaTrabajoRepository.findAll(filtros);
}

/**
 * Habilita / deshabilita una fecha específica.
 * Si la fecha ya estaba en la base de datos, alterna su estado.
 * Si no estaba, por defecto un día laboral es HABILITADO, por lo que el primer toggle lo DESHABILITA.
 */
async function toggleFecha(fecha, motivo = null) {
  validarFechaStr(fecha);

  const existente = await diaTrabajoRepository.findByFecha(fecha);

  let nuevoEstado = 'DESHABILITADO';
  let horaInicio = '08:00:00';
  let horaFin = '20:00:00';

  if (existente) {
    nuevoEstado = existente.estado === 'HABILITADO' ? 'DESHABILITADO' : 'HABILITADO';
    horaInicio = existente.hora_inicio ? `${existente.hora_inicio}:00`.slice(0, 8) : '08:00:00';
    horaFin = existente.hora_fin ? `${existente.hora_fin}:00`.slice(0, 8) : '20:00:00';
  }

  await diaTrabajoRepository.upsert({
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    estado: nuevoEstado,
    motivo: motivo || (nuevoEstado === 'DESHABILITADO' ? 'Día no laboral configurado por administración' : null),
  });

  return diaTrabajoRepository.findByFecha(fecha);
}

async function updateHorario(fecha, { startTime, endTime }) {
  validarFechaStr(fecha);

  if (!startTime || !endTime) {
    throw createError('Los horarios de inicio y fin son obligatorios', 400);
  }

  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    throw createError('Formato de hora inválido. Se espera HH:mm', 400);
  }

  // Normalizar a formato HH:mm:00
  const normStart = startTime.length === 5 ? `${startTime}:00` : startTime;
  const normEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

  if (normStart >= normEnd) {
    throw createError('La hora de inicio debe ser anterior a la hora de cierre', 400);
  }

  const existente = await diaTrabajoRepository.findByFecha(fecha);
  const estadoActual = existente ? existente.estado : 'HABILITADO';
  const motivoActual = existente ? existente.motivo : null;

  await diaTrabajoRepository.upsert({
    fecha,
    hora_inicio: normStart,
    hora_fin: normEnd,
    estado: estadoActual,
    motivo: motivoActual,
  });

  return diaTrabajoRepository.findByFecha(fecha);
}

module.exports = {
  getAll,
  toggleFecha,
  updateHorario,
};
