const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const emailService = require('./emailService');

const SALT_ROUNDS = 10;

// Crea un error con código HTTP para que el controller sepa qué status responder
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Código numérico de 6 dígitos (crypto.randomInt es seguro, a diferencia de Math.random)
function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Guarda un código en la BD, válido por 5 minutos.
// `executor` puede ser el pool o una conexión con transacción abierta.
// El vencimiento se calcula en MySQL (NOW() + 5 min) para no depender de zonas horarias de Node.
async function saveCode(executor, idUsuario, tipo) {
  const codigo = generateCode();
  await executor.execute(
    `INSERT INTO codigos_verificacion (id_usuario, codigo, tipo, expira_en)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
    [idUsuario, codigo, tipo]
  );
  return codigo;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id_usuario, email, password, rol FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario, u.email, u.rol, u.fecha_registro,
            c.id_cliente,
            e.id_empleado,
            COALESCE(c.nombre, e.nombre, 'Usuario') AS nombre,
            COALESCE(c.apellido, e.apellido, '') AS apellido,
            COALESCE(c.telefono, e.telefono, '') AS telefono,
            COALESCE(c.estado, e.estado, 'ACTIVO') AS estado,
            COALESCE(c.contador_strikes, 0) AS contador_strikes,
            e.especialidad
     FROM usuarios u
     LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
     LEFT JOIN empleados e ON e.id_usuario = u.id_usuario
     WHERE u.id_usuario = ?`,
    [id]
  );
  return rows[0] || null;
}

function sanitizeUser(user) {
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    id: userWithoutPassword.id_usuario,
  };
}

// Registrar cliente: queda en estado REGISTRADO hasta confirmar el código del mail.
// Primero confirma y después se loguea (todavía no se devuelve token).
async function register({ nombre, apellido, email, password, telefono }) {
  // Camino alternativo 1.a: el mail ya está registrado
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw createError('El email ya está registrado', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const connection = await pool.getConnection();
  let codigo;

  try {
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
      [email, hashedPassword, 'CLIENTE']
    );

    const idUsuario = userResult.insertId;

    await connection.execute(
      'INSERT INTO clientes (id_usuario, nombre, apellido, telefono, estado) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, nombre, apellido, telefono || null, 'REGISTRADO']
    );

    // Código de confirmación válido por 5 minutos
    codigo = await saveCode(connection, idUsuario, 'CONFIRMACION');

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // El mail se envía DESPUÉS del commit: si falla, el usuario ya existe y puede pedir reenvío.
  await emailService.enviarCodigoConfirmacion(email, codigo);
}

// El cliente ingresa el código recibido y su estado pasa a ACTIVO
async function confirmRegistration({ email, codigo }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw createError('Código inválido o vencido', 400);
  }

  // Busca un código del usuario que coincida, no esté usado y no haya vencido
  const [rows] = await pool.execute(
    `SELECT id_codigo FROM codigos_verificacion
     WHERE id_usuario = ? AND codigo = ? AND tipo = 'CONFIRMACION'
       AND usado = 0 AND expira_en > NOW()
     ORDER BY id_codigo DESC LIMIT 1`,
    [user.id_usuario, codigo]
  );

  if (rows.length === 0) {
    throw createError('Código inválido o vencido', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE codigos_verificacion SET usado = 1 WHERE id_codigo = ?', [rows[0].id_codigo]);
    await connection.execute(
      "UPDATE clientes SET estado = 'ACTIVO' WHERE id_usuario = ? AND estado = 'REGISTRADO'",
      [user.id_usuario]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Reenvío del código si venció (5 min) o no llegó el mail
async function resendConfirmationCode({ email }) {
  const user = await findUserByEmail(email);
  const profile = user ? await findUserById(user.id_usuario) : null;

  // Solo se reenvía a cuentas pendientes de confirmar. No revelamos si el mail existe o no.
  if (profile && profile.estado === 'REGISTRADO') {
    const codigo = await saveCode(pool, user.id_usuario, 'CONFIRMACION');
    await emailService.enviarCodigoConfirmacion(email, codigo);
  }
}

async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const profile = await findUserById(user.id_usuario);

  // La cuenta está bloqueada por la administración.
  if (profile && profile.estado === 'BLOQUEADO') {
    throw createError('Tu cuenta ha sido bloqueada por la administración.', 403);
  }

  // Todavía no confirmó su registro con el código del mail.
  if (profile && profile.estado === 'REGISTRADO') {
    throw createError('Debés confirmar tu registro con el código enviado a tu mail para ingresar.', 403);
  }

  const token = generateToken(profile);

  return { user: sanitizeUser(profile), token };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id_usuario, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  register,
  confirmRegistration,
  resendConfirmationCode,
  login,
  findUserById,
  findUserByEmail,
  verifyToken,
  sanitizeUser,
};
