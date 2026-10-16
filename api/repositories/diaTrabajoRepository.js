const { pool } = require('../config/db');

/**
 * Repositorio de Días de Trabajo y Calendario (SQL puro).
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

  query += ' ORDER BY id_dia_trabajo DESC LIMIT 1';

  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

/**
 * Inserta un nuevo día o actualiza el existente si ya figuraba esa fecha.
 * En MySQL, si id_empleado es NULL, la restricción UNIQUE permite múltiples NULLs,
 * por lo que verificamos por ID para garantizar unicidad real de fecha para el local.
 */
async function upsert({ fecha, hora_inicio = '08:00:00', hora_fin = '20:00:00', estado = 'HABILITADO', motivo = null, id_empleado = null }) {
  const existente = await findByFecha(fecha, id_empleado);

  if (existente) {
    await pool.execute(
      `UPDATE dias_trabajo 
       SET hora_inicio = ?, hora_fin = ?, estado = ?, motivo = ?
       WHERE id_dia_trabajo = ?`,
      [hora_inicio, hora_fin, estado, motivo, existente.id_dia_trabajo]
    );
    return { id_dia_trabajo: existente.id_dia_trabajo, updated: true };
  }

  const [result] = await pool.execute(
    `INSERT INTO dias_trabajo (id_empleado, fecha, hora_inicio, hora_fin, estado, motivo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_empleado, fecha, hora_inicio, hora_fin, estado, motivo]
  );
  return { id_dia_trabajo: result.insertId, updated: false };
}

/**
 * Modifica directamente el estado de un día registrado.
 */
async function updateEstado(fecha, estado, motivo = null, idEmpleado = null) {
  return upsert({ fecha, estado, motivo, id_empleado: idEmpleado });
}

/**
 * Modifica el horario de inicio y fin de una fecha específica.
 */
async function updateHorario(fecha, hora_inicio, hora_fin, idEmpleado = null) {
  return upsert({ fecha, hora_inicio, hora_fin, id_empleado: idEmpleado });
}

module.exports = {
  findAll,
  findByFecha,
  upsert,
  updateEstado,
  updateHorario,
};
