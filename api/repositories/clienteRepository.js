const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.nombre, c.apellido, c.telefono, c.contador_strikes, c.estado,
            u.id_usuario, u.email, u.fecha_registro
     FROM clientes c
     JOIN usuarios u ON u.id_usuario = c.id_usuario
     ORDER BY c.apellido, c.nombre`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.nombre, c.apellido, c.telefono, c.contador_strikes, c.estado,
            u.id_usuario, u.email, u.fecha_registro
     FROM clientes c
     JOIN usuarios u ON u.id_usuario = c.id_usuario
     WHERE c.id_cliente = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateEstado(id, estado) {
  await pool.execute('UPDATE clientes SET estado = ? WHERE id_cliente = ?', [estado, id]);
}

async function findByUserId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.nombre, c.apellido, c.telefono, c.contador_strikes, c.estado,
            u.id_usuario, u.email
     FROM clientes c
     JOIN usuarios u ON u.id_usuario = c.id_usuario
     WHERE c.id_usuario = ?`,
    [idUsuario]
  );
  return rows[0] || null;
}

async function updateProfile(idUsuario, { nombre, apellido, telefono }) {
  await pool.execute(
    'UPDATE clientes SET nombre = ?, apellido = ?, telefono = ? WHERE id_usuario = ?',
    [nombre, apellido, telefono, idUsuario]
  );
}

async function countTurnos(idCliente) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM turnos WHERE id_cliente = ?',
    [idCliente]
  );
  return rows[0].total;
}

async function deleteUsuario(idUsuario) {
  await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [idUsuario]);
}

module.exports = { findAll, findById, updateEstado, findByUserId, updateProfile, countTurnos, deleteUsuario };
