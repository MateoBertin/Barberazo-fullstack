const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, duracion_minutos, estado
     FROM servicios
     ORDER BY nombre`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, duracion_minutos, estado
     FROM servicios
     WHERE id_servicio = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByNombre(nombre) {
  const [rows] = await pool.execute(
    `SELECT id_servicio, nombre, descripcion, precio, duracion_minutos, estado
     FROM servicios
     WHERE LOWER(nombre) = LOWER(?)`,
    [nombre]
  );
  return rows[0] || null;
}

async function create({ nombre, descripcion, precio, duracion_minutos }) {
  const [result] = await pool.execute(
    `INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion, precio, duracion_minutos]
  );
  return result.insertId;
}

async function update(id, { nombre, descripcion, precio, duracion_minutos }) {
  await pool.execute(
    `UPDATE servicios
     SET nombre = ?, descripcion = ?, precio = ?, duracion_minutos = ?
     WHERE id_servicio = ?`,
    [nombre, descripcion, precio, duracion_minutos, id]
  );
}

async function updateEstado(id, estado) {
  await pool.execute('UPDATE servicios SET estado = ? WHERE id_servicio = ?', [estado, id]);
}

module.exports = { findAll, findById, findByNombre, create, update, updateEstado };
