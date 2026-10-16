const { pool } = require('../config/db');

/**
 * Repositorio de Multas (Acceso a Datos - SQL Puro)
 * Parte 3 - Lucas (DSW) / CUU4.1 - Pagar Multa
 */

/**
 * Busca todas las multas de un cliente con datos de turno y servicio
 */
async function findByClienteId(idCliente) {
  const query = `
    SELECT 
      m.id_multa,
      m.id_cliente,
      m.id_turno,
      m.monto,
      m.motivo,
      m.estado_pago,
      DATE_FORMAT(m.fecha_emision, '%Y-%m-%d %H:%i') AS fecha_emision,
      DATE_FORMAT(m.fecha_emision, '%Y-%m-%d') AS fecha_emision_corta,
      DATE_FORMAT(m.fecha_pago, '%Y-%m-%d %H:%i') AS fecha_pago,
      DATE_FORMAT(m.fecha_pago, '%Y-%m-%d') AS fecha_pago_corta,
      m.metodo_pago,
      t.fecha_hora AS turno_fecha_hora,
      s.nombre AS servicio_nombre
    FROM multas m
    LEFT JOIN turnos t ON t.id_turno = m.id_turno
    LEFT JOIN servicios s ON s.id_servicio = t.id_servicio
    WHERE m.id_cliente = ?
    ORDER BY m.fecha_emision DESC
  `;

  const [rows] = await pool.execute(query, [idCliente]);
  return rows;
}

/**
 * Busca una multa por su ID con datos del cliente asociado
 */
async function findById(idMulta) {
  const query = `
    SELECT 
      m.id_multa,
      m.id_cliente,
      m.id_turno,
      m.monto,
      m.motivo,
      m.estado_pago,
      m.fecha_emision,
      m.fecha_pago,
      m.metodo_pago,
      c.id_usuario,
      c.contador_strikes,
      c.estado AS cliente_estado,
      u.email AS cliente_email,
      CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre
    FROM multas m
    JOIN clientes c ON c.id_cliente = m.id_cliente
    JOIN usuarios u ON u.id_usuario = c.id_usuario
    WHERE m.id_multa = ?
  `;

  const [rows] = await pool.execute(query, [idMulta]);
  return rows[0] || null;
}

/**
 * Busca la multa pendiente de pago más reciente de un cliente
 */
async function findPendingByClienteId(idCliente) {
  const query = `
    SELECT id_multa, id_cliente, id_turno, monto, motivo, estado_pago, fecha_emision
    FROM multas
    WHERE id_cliente = ? AND estado_pago = 'PENDIENTE'
    ORDER BY fecha_emision DESC
    LIMIT 1
  `;

  const [rows] = await pool.execute(query, [idCliente]);
  return rows[0] || null;
}

/**
 * Inserta una nueva multa
 */
async function create({ id_cliente, id_turno, monto, motivo }, executor = pool) {
  const [result] = await executor.execute(
    `INSERT INTO multas (id_cliente, id_turno, monto, motivo, estado_pago)
     VALUES (?, ?, ?, ?, 'PENDIENTE')`,
    [id_cliente, id_turno || null, monto, motivo]
  );
  return result.insertId;
}

/**
 * Registra el pago de una multa
 */
async function registrarPago(idMulta, { metodo_pago }, executor = pool) {
  await executor.execute(
    `UPDATE multas 
     SET estado_pago = 'PAGADO', fecha_pago = NOW(), metodo_pago = ?
     WHERE id_multa = ?`,
    [metodo_pago || 'Mercado Pago', idMulta]
  );
}

/**
 * Restaura la cuenta del cliente tras el pago de la multa:
 * Resetea el contador de strikes a 0 y pasa su estado a ACTIVO.
 */
async function rehabilitarCliente(idCliente, executor = pool) {
  await executor.execute(
    `UPDATE clientes 
     SET contador_strikes = 0, estado = 'ACTIVO'
     WHERE id_cliente = ?`,
    [idCliente]
  );
}

module.exports = {
  findByClienteId,
  findById,
  findPendingByClienteId,
  create,
  registrarPago,
  rehabilitarCliente,
};
