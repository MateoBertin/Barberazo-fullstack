const { pool } = require('../config/db');

async function findWithFilters({ fecha, id_empleado, id_cliente, estado } = {}) {
  let query = `
    SELECT 
      t.id_turno,
      t.id_cliente,
      t.id_empleado,
      t.id_servicio,
      t.fecha_hora,
      DATE_FORMAT(t.fecha_hora, '%Y-%m-%d') AS fecha,
      DATE_FORMAT(t.fecha_hora, '%H:%i') AS hora,
      t.estado,
      t.motivo_cancelacion,
      t.cancelado_por,
      t.fecha_creacion,
      -- Datos del cliente
      c.nombre AS cliente_nombre,
      c.apellido AS cliente_apellido,
      CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre_completo,
      c.telefono AS cliente_telefono,
      c.contador_strikes AS cliente_strikes,
      c.estado AS cliente_estado,
      u_cli.email AS cliente_email,
      -- Datos del empleado
      e.nombre AS empleado_nombre,
      e.apellido AS empleado_apellido,
      CONCAT(e.nombre, ' ', e.apellido) AS empleado_nombre_completo,
      e.telefono AS empleado_telefono,
      e.especialidad AS empleado_especialidad,
      -- Datos del servicio
      s.nombre AS servicio_nombre,
      s.precio AS servicio_precio,
      s.duracion_minutos AS servicio_duracion
    FROM turnos t
    JOIN clientes c ON c.id_cliente = t.id_cliente
    JOIN usuarios u_cli ON u_cli.id_usuario = c.id_usuario
    JOIN empleados e ON e.id_empleado = t.id_empleado
    JOIN servicios s ON s.id_servicio = t.id_servicio
    WHERE 1=1
  `;

  const params = [];

  if (fecha) {
    query += ' AND DATE(t.fecha_hora) = ?';
    params.push(fecha);
  }

  if (id_empleado) {
    query += ' AND t.id_empleado = ?';
    params.push(id_empleado);
  }

  if (id_cliente) {
    query += ' AND t.id_cliente = ?';
    params.push(id_cliente);
  }

  if (estado) {
    query += ' AND t.estado = ?';
    params.push(estado);
  }

  query += ' ORDER BY t.fecha_hora DESC';

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function findById(id) {
  const query = `
    SELECT 
      t.id_turno,
      t.id_cliente,
      t.id_empleado,
      t.id_servicio,
      t.fecha_hora,
      DATE_FORMAT(t.fecha_hora, '%Y-%m-%d') AS fecha,
      DATE_FORMAT(t.fecha_hora, '%H:%i') AS hora,
      t.estado,
      t.motivo_cancelacion,
      t.cancelado_por,
      t.fecha_creacion,
      -- Datos del cliente
      c.id_usuario AS id_usuario_cliente,
      c.nombre AS cliente_nombre,
      c.apellido AS cliente_apellido,
      CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre_completo,
      c.telefono AS cliente_telefono,
      c.contador_strikes AS cliente_strikes,
      c.estado AS cliente_estado,
      u_cli.email AS cliente_email,
      -- Datos del empleado
      e.nombre AS empleado_nombre,
      e.apellido AS empleado_apellido,
      CONCAT(e.nombre, ' ', e.apellido) AS empleado_nombre_completo,
      -- Datos del servicio
      s.nombre AS servicio_nombre,
      s.precio AS servicio_precio,
      s.duracion_minutos AS servicio_duracion
    FROM turnos t
    JOIN clientes c ON c.id_cliente = t.id_cliente
    JOIN usuarios u_cli ON u_cli.id_usuario = c.id_usuario
    JOIN empleados e ON e.id_empleado = t.id_empleado
    JOIN servicios s ON s.id_servicio = t.id_servicio
    WHERE t.id_turno = ?
  `;

  const [rows] = await pool.execute(query, [id]);
  return rows[0] || null;
}

async function create({ id_cliente, id_empleado, id_servicio, fecha_hora }, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO turnos (id_cliente, id_empleado, id_servicio, fecha_hora, estado)
     VALUES (?, ?, ?, ?, 'SOLICITADO')`,
    [id_cliente, id_empleado, id_servicio, fecha_hora]
  );
  return result.insertId;
}

async function updateStatus(id, estado, motivo = null, canceladoPor = null, executor = pool) {
  await executor.execute(
    `UPDATE turnos 
     SET estado = ?, motivo_cancelacion = ?, cancelado_por = ?
     WHERE id_turno = ?`,
    [estado, motivo, canceladoPor, id]
  );
}

async function countActiveByClient(idCliente) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total 
     FROM turnos 
     WHERE id_cliente = ? AND estado = 'SOLICITADO'`,
    [idCliente]
  );
  return rows[0].total;
}

async function isSlotOccupied(idEmpleado, fechaHora) {
  const [rows] = await pool.execute(
    `SELECT id_turno 
     FROM turnos 
     WHERE id_empleado = ? AND fecha_hora = ? AND estado = 'SOLICITADO'`,
    [idEmpleado, fechaHora]
  );
  return rows.length > 0;
}

module.exports = {
  findWithFilters,
  findById,
  create,
  updateStatus,
  countActiveByClient,
  isSlotOccupied,
};
