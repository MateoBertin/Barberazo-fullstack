const { pool } = require('../config/db');

// Convierte "Corte, Barba" en ["Corte", "Barba"] para el front.
// En DB es VARCHAR(100), no hay tabla intermedia (ver PLAN_MATEO_FASES.md).
function toArray(especialidad) {
  if (!especialidad) return [];
  return especialidad.split(',').map((s) => s.trim()).filter(Boolean);
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT e.id_empleado, e.nombre, e.apellido, e.telefono, e.especialidad, e.estado,
            u.id_usuario, u.email, u.rol
     FROM empleados e
     JOIN usuarios u ON u.id_usuario = e.id_usuario
     ORDER BY e.apellido, e.nombre`
  );
  return rows.map((row) => ({ ...row, especialidades: toArray(row.especialidad) }));
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT e.id_empleado, e.nombre, e.apellido, e.telefono, e.especialidad, e.estado,
            u.id_usuario, u.email, u.rol
     FROM empleados e
     JOIN usuarios u ON u.id_usuario = e.id_usuario
     WHERE e.id_empleado = ?`,
    [id]
  );
  const row = rows[0];
  return row ? { ...row, especialidades: toArray(row.especialidad) } : null;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id_usuario, email FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function findUsuarioIdByEmpleadoId(idEmpleado) {
  const [rows] = await pool.execute(
    'SELECT id_usuario FROM empleados WHERE id_empleado = ?',
    [idEmpleado]
  );
  return rows[0] ? rows[0].id_usuario : null;
}

// `executor` es pool o una conexión con transacción (igual que authService.saveCode).
async function createUsuario(executor, { email, hashedPassword }) {
  const [result] = await executor.execute(
    "INSERT INTO usuarios (email, password, rol) VALUES (?, ?, 'EMPLEADO')",
    [email, hashedPassword]
  );
  return result.insertId;
}

async function createEmpleado(executor, { idUsuario, nombre, apellido, telefono, especialidad }) {
  const [result] = await executor.execute(
    'INSERT INTO empleados (id_usuario, nombre, apellido, telefono, especialidad, estado) VALUES (?, ?, ?, ?, ?, ?)',
    [idUsuario, nombre, apellido, telefono || null, especialidad || null, 'ACTIVO']
  );
  return result.insertId;
}

async function update(id, { nombre, apellido, telefono, especialidad, estado }) {
  await pool.execute(
    'UPDATE empleados SET nombre = ?, apellido = ?, telefono = ?, especialidad = ?, estado = ? WHERE id_empleado = ?',
    [nombre, apellido, telefono || null, especialidad || null, estado, id]
  );
}

async function updateUsuarioEmail(idUsuario, email) {
  await pool.execute('UPDATE usuarios SET email = ? WHERE id_usuario = ?', [email, idUsuario]);
}

// Turnos futuros en estado SOLICITADO (solo lectura de la tabla de Lucas para CUU10.3).
async function findFutureTurnos(idEmpleado) {
  const [rows] = await pool.execute(
    `SELECT t.id_turno, t.fecha_hora, t.id_cliente,
            c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
     FROM turnos t
     JOIN clientes c ON c.id_cliente = t.id_cliente
     WHERE t.id_empleado = ? AND t.fecha_hora > NOW() AND t.estado = 'SOLICITADO'
     ORDER BY t.fecha_hora`,
    [idEmpleado]
  );
  return rows;
}

// Baja lógica: el registro se conserva para el historial de turnos.
async function deactivate(id) {
  await pool.execute("UPDATE empleados SET estado = 'INACTIVO' WHERE id_empleado = ?", [id]);
}

module.exports = { findAll, findById, findByEmail, findUsuarioIdByEmpleadoId, createUsuario, createEmpleado, update, updateUsuarioEmail, findFutureTurnos, deactivate };
