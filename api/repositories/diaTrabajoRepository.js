const { pool } = require('../config/db');

/**
 * Repositorio de Días de Trabajo y Calendario (SQL Puro)
 * Parte 1 - Pedro (DSW) - CRUD Simple 2 (CUU6.1 / CUU6.2)
 */

/**
 * Obtiene todos los días registrados en la base de datos.
 * Opcionalmente filtra por rango de fechas (desde, hasta) y estado.
 */
async function findAll({ desde, hasta, estado } = {}) {
  let query = `
    SELECT 
      id_dia_trabajo,
      id_empleado,
      DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
      TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
      TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin,
      estado,
      motivo,
      fecha_creacion
    FROM dias_trabajo
    WHERE 1=1
  `;
  const params = [];

  if (desde) {
    query += ' AND fecha >= ?';
    params.push(desde);
  }
  if (hasta) {
    query += ' AND fecha <= ?';
    params.push(hasta);
  }
  if (estado) {
    query += ' AND estado = ?';
    params.push(estado);
  }

  query += ' ORDER BY fecha ASC';

  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Busca un día específico por fecha (formato YYYY-MM-DD).
 */
async function findByFecha(fecha, idEmpleado = null) {
  let query = `
    SELECT 
      id_dia_trabajo,
      id_empleado,
      DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
      TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
      TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin,
      estado,
      motivo,
      fecha_creacion
    FROM dias_trabajo
    WHERE fecha = ?
  `;
  const params = [fecha];

  if (idEmpleado) {
    query += ' AND id_empleado = ?';
    params.push(idEmpleado);
  } else {
    query += ' AND id_empleado IS NULL';
  }

  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

/**
 * Inserta un nuevo día o actualiza el existente si ya figuraba esa fecha.
 * Patrón ON DUPLICATE KEY UPDATE / Upsert seguro.
 */
async function upsert({ fecha, hora_inicio = '08:00:00', hora_fin = '20:00:00', estado = 'HABILITADO', motivo = null, id_empleado = null }) {
  const [result] = await pool.execute(
    `INSERT INTO dias_trabajo (id_empleado, fecha, hora_inicio, hora_fin, estado, motivo)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       hora_inicio = VALUES(hora_inicio),
       hora_fin = VALUES(hora_fin),
       estado = VALUES(estado),
       motivo = VALUES(motivo)`,
    [id_empleado, fecha, hora_inicio, hora_fin, estado, motivo]
  );
  return result;
}

/**
 * Modifica directamente el estado de un día registrado.
 */
async function updateEstado(fecha, estado, motivo = null, idEmpleado = null) {
  let query = 'UPDATE dias_trabajo SET estado = ?, motivo = ? WHERE fecha = ?';
  const params = [estado, motivo, fecha];

  if (idEmpleado) {
    query += ' AND id_empleado = ?';
    params.push(idEmpleado);
  } else {
    query += ' AND id_empleado IS NULL';
  }

  await pool.execute(query, params);
}

/**
 * Modifica el horario de inicio y fin de una fecha específica.
 */
async function updateHorario(fecha, hora_inicio, hora_fin, idEmpleado = null) {
  let query = 'UPDATE dias_trabajo SET hora_inicio = ?, hora_fin = ? WHERE fecha = ?';
  const params = [hora_inicio, hora_fin, fecha];

  if (idEmpleado) {
    query += ' AND id_empleado = ?';
    params.push(idEmpleado);
  } else {
    query += ' AND id_empleado IS NULL';
  }

  await pool.execute(query, params);
}

module.exports = {
  findAll,
  findByFecha,
  upsert,
  updateEstado,
  updateHorario,
};
