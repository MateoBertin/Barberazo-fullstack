const { pool } = require('../config/db');

/*Repositorio de Reseñas*/

/*Obtiene todas las reseñas con datos de cliente, empleado y servicio*/
async function findAll() {
  const query = `
    SELECT 
      r.id_resena,
      r.id_cliente,
      r.id_turno,
      r.calificacion,
      r.comentario,
      DATE_FORMAT(r.fecha_resena, '%Y-%m-%d %H:%i') AS fecha_resena,
      DATE_FORMAT(r.fecha_resena, '%Y-%m-%d') AS fecha,
      -- Datos del cliente
      c.nombre AS cliente_nombre,
      c.apellido AS cliente_apellido,
      CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre_completo,
      -- Datos del empleado
      e.id_empleado,
      e.nombre AS empleado_nombre,
      e.apellido AS empleado_apellido,
      CONCAT(e.nombre, ' ', e.apellido) AS empleado_nombre_completo,
      u_emp.email AS empleado_email,
      -- Datos del servicio
      s.id_servicio,
      s.nombre AS servicio_nombre
    FROM resenas r
    JOIN clientes c ON c.id_cliente = r.id_cliente
    JOIN turnos t ON t.id_turno = r.id_turno
    JOIN empleados e ON e.id_empleado = t.id_empleado
    JOIN usuarios u_emp ON u_emp.id_usuario = e.id_usuario
    JOIN servicios s ON s.id_servicio = t.id_servicio
    ORDER BY r.fecha_resena DESC
  `;

  const [rows] = await pool.execute(query);
  return rows;
}

/*Busca una reseña por su ID*/
async function findById(id) {
  const query = `
    SELECT 
      r.id_resena,
      r.id_cliente,
      r.id_turno,
      r.calificacion,
      r.comentario,
      DATE_FORMAT(r.fecha_resena, '%Y-%m-%d %H:%i') AS fecha_resena,
      DATE_FORMAT(r.fecha_resena, '%Y-%m-%d') AS fecha,
      CONCAT(c.nombre, ' ', c.apellido) AS cliente_nombre_completo,
      e.id_empleado,
      CONCAT(e.nombre, ' ', e.apellido) AS empleado_nombre_completo,
      s.nombre AS servicio_nombre
    FROM resenas r
    JOIN clientes c ON c.id_cliente = r.id_cliente
    JOIN turnos t ON t.id_turno = r.id_turno
    JOIN empleados e ON e.id_empleado = t.id_empleado
    JOIN servicios s ON s.id_servicio = t.id_servicio
    WHERE r.id_resena = ?
  `;

  const [rows] = await pool.execute(query, [id]);
  return rows[0] || null;
}

/*Busca si ya existe una reseña para un turno en particular*/
async function findByTurnoId(idTurno) {
  const [rows] = await pool.execute(
    'SELECT id_resena, id_cliente, id_turno, calificacion, comentario FROM resenas WHERE id_turno = ?',
    [idTurno]
  );
  return rows[0] || null;
}

/*nueva reseña*/
async function create({ id_cliente, id_turno, calificacion, comentario }) {
  const [result] = await pool.execute(
    `INSERT INTO resenas (id_cliente, id_turno, calificacion, comentario)
     VALUES (?, ?, ?, ?)`,
    [id_cliente, id_turno, calificacion, comentario || null]
  );
  return result.insertId;
}

module.exports = {
  findAll,
  findById,
  findByTurnoId,
  create,
};
