const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

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

async function register({ nombre, apellido, email, password, telefono }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error('El email ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const query = 'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)';

    const [userResult] = await connection.execute(query, [
      email,
      hashedPassword,
      'CLIENTE',
    ]);

    const idUsuario = userResult.insertId;

    await connection.execute(
      'INSERT INTO clientes (id_usuario, nombre, apellido, telefono, estado) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, nombre, apellido, telefono || null, 'ACTIVO']
    );

    await connection.commit();

    const user = await findUserById(idUsuario);
    const token = generateToken(user);

    return { user: sanitizeUser(user), token };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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
  if (profile && profile.estado === 'BLOQUEADO') {
    const error = new Error('Tu cuenta ha sido bloqueada por la administración.');
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(profile);

  return { user: sanitizeUser(profile), token };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id_usuario, email: user.email, rol: user.rol },
    process.env.JWT_SECRET || 'caup2019',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'caup2019');
}

module.exports = {
  register,
  login,
  findUserById,
  findUserByEmail,
  verifyToken,
  sanitizeUser,
};
