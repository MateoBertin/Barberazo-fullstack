const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const empleadoRepository = require('../repositories/empleadoRepository');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS_VALIDOS = ['ACTIVO', 'INACTIVO'];

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Array del front -> string VARCHAR(100) de la DB.
function toString(especialidades, especialidad) {
  if (Array.isArray(especialidades)) return especialidades.join(', ');
  return especialidad || null;
}

async function getAll(estado) {
  const empleados = await empleadoRepository.findAll();
  if (!estado) return empleados;
  const clean = String(estado).toUpperCase();
  return empleados.filter((e) => e.estado === clean);
}

async function getById(id) {
  const empleado = await empleadoRepository.findById(id);
  if (!empleado) {
    throw createError('Empleado no encontrado', 404);
  }
  return empleado;
}

// Alta en dos tablas dentro de una transacción.
async function create({ nombre, apellido, email, password, telefono, especialidades, especialidad }) {
  const cleanNombre = (nombre || '').trim();
  const cleanApellido = (apellido || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  // Si el front no manda password (modal sin campo), se usa la clave seed del proyecto.
  const cleanPassword = password || '123456';

  if (!cleanNombre) throw createError('El nombre es obligatorio', 400);
  if (!cleanApellido) throw createError('El apellido es obligatorio', 400);
  if (!cleanEmail) throw createError('El email es obligatorio', 400);
  if (!EMAIL_REGEX.test(cleanEmail)) throw createError('El formato del email no es válido', 400);
  if (cleanPassword.length < 6) throw createError('La contraseña debe tener al menos 6 caracteres', 400);

  const existing = await empleadoRepository.findByEmail(cleanEmail);
  if (existing) throw createError('El email ya está registrado', 409);

  const hashedPassword = await bcrypt.hash(cleanPassword, SALT_ROUNDS);
  const connection = await pool.getConnection();
  let idEmpleado;
  try {
    await connection.beginTransaction();
    const idUsuario = await empleadoRepository.createUsuario(
      connection,
      { email: cleanEmail, hashedPassword }
    );
    idEmpleado = await empleadoRepository.createEmpleado(connection, {
      idUsuario,
      nombre: cleanNombre,
      apellido: cleanApellido,
      telefono: (telefono || '').trim() || null,
      especialidad: toString(especialidades, especialidad),
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getById(idEmpleado);
}

// Edición (datos del empleado y opcionalmente su email).
async function update(id, { nombre, apellido, email, telefono, especialidades, especialidad, estado }) {
  const current = await getById(id);

  const nextNombre = nombre !== undefined ? String(nombre).trim() : current.nombre;
  const nextApellido = apellido !== undefined ? String(apellido).trim() : current.apellido;
  const nextTelefono = telefono !== undefined ? String(telefono).trim() : current.telefono;
  const nextEspecialidad =
    especialidades !== undefined || especialidad !== undefined
      ? toString(especialidades, especialidad)
      : current.especialidad;
  const nextEstado = estado !== undefined ? String(estado).toUpperCase() : current.estado;

  if (!nextNombre) throw createError('El nombre es obligatorio', 400);
  if (!nextApellido) throw createError('El apellido es obligatorio', 400);
  if (!ESTADOS_VALIDOS.includes(nextEstado)) throw createError('Estado inválido (ACTIVO o INACTIVO)', 400);

  if (email !== undefined) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) throw createError('El formato del email no es válido', 400);
    if (cleanEmail !== current.email) {
      const existing = await empleadoRepository.findByEmail(cleanEmail);
      if (existing) throw createError('El email ya está registrado', 409);
      await empleadoRepository.updateUsuarioEmail(current.id_usuario, cleanEmail);
    }
  }

  await empleadoRepository.update(id, {
    nombre: nextNombre,
    apellido: nextApellido,
    telefono: nextTelefono || null,
    especialidad: nextEspecialidad,
    estado: nextEstado,
  });
  return getById(id);
}

// Baja lógica (pasa a INACTIVO), bloqueada si tiene turnos futuros sin resolver.
async function remove(id) {
  const current = await getById(id);
  if (current.estado === 'INACTIVO') {
    throw createError('El empleado ya está dado de baja', 409);
  }
  const futuros = await empleadoRepository.findFutureTurnos(id);
  if (futuros.length > 0) {
    const error = createError(
      `No se puede dar de baja: tiene ${futuros.length} turno(s) futuro(s) asignado(s). Reasigná o cancelá esos turnos e intentá de nuevo.`,
      409
    );
    error.details = futuros;
    throw error;
  }
  await empleadoRepository.deactivate(id);
  return getById(id);
}

module.exports = { getAll, getById, create, update, remove };
