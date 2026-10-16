const { pool } = require('../config/db');
const turnoRepository = require('../repositories/turnoRepository');
const clienteRepository = require('../repositories/clienteRepository');

const ESTADOS_VALIDOS = ['ASISTIDO', 'NO ASISTIDO', 'CANCELADO'];
const MONTO_MULTA_STRIKES = 3000.00;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getAll(filters = {}, user) {
  const cleanFilters = { ...filters };

  // Si el usuario es cliente, restringe únicamente a sus propios turnos
  if (user && user.rol === 'CLIENTE') {
    const cliente = await clienteRepository.findByUserId(user.id);
    if (!cliente) throw createError('Perfil de cliente no encontrado', 404);
    cleanFilters.id_cliente = cliente.id_cliente;
  }

  return turnoRepository.findWithFilters(cleanFilters);
}

async function getById(id, user) {
  const turno = await turnoRepository.findById(id);
  if (!turno) {
    throw createError('Turno no encontrado', 404);
  }

  // Si es CLIENTE, no permitir acceder al turno de otro cliente
  if (user && user.rol === 'CLIENTE') {
    const cliente = await clienteRepository.findByUserId(user.id);
    if (!cliente || turno.id_cliente !== cliente.id_cliente) {
      throw createError('No tenés permisos para ver este turno', 403);
    }
  }

  return turno;
}

async function create({ id_cliente, id_empleado, id_servicio, fecha_hora }, user) {
  let resolvedClienteId = id_cliente;

  // Si el usuario logueado es cliente, da id automáticamente
  if (user && user.rol === 'CLIENTE') {
    const clienteLogueado = await clienteRepository.findByUserId(user.id);
    if (!clienteLogueado) throw createError('Perfil de cliente no encontrado', 404);
    resolvedClienteId = clienteLogueado.id_cliente;
  }

  if (!resolvedClienteId) throw createError('El cliente es obligatorio', 400);
  if (!id_empleado) throw createError('El empleado/barbero es obligatorio', 400);
  if (!id_servicio) throw createError('El servicio es obligatorio', 400);
  if (!fecha_hora) throw createError('La fecha y hora son obligatorias', 400);

  // Validar estado del cliente
  const cliente = await clienteRepository.findById(resolvedClienteId);
  if (!cliente) throw createError('Cliente no encontrado', 404);

  if (cliente.estado === 'BLOQUEADO') {
    throw createError('Tu cuenta se encuentra bloqueada por la administración. No podés solicitar turnos.', 403);
  }
  if (cliente.estado === 'MULTADO') {
    throw createError('Tu cuenta se encuentra multada por acumulación de strikes. Regularizá el pago de la multa para solicitar nuevos turnos.', 403);
  }

  // Validar que la fecha y hora sea futura
  const fechaTurno = new Date(fecha_hora);
  if (isNaN(fechaTurno.getTime())) {
    throw createError('Formato de fecha y hora inválido', 400);
  }
  if (fechaTurno <= new Date()) {
    throw createError('La fecha y hora del turno debe ser futura', 400);
  }

  //Rechaza si el cliente ya tiene un turno en estado SOLICITADO
  const activeCount = await turnoRepository.countActiveByClient(resolvedClienteId);
  if (activeCount > 0) {
    throw createError('Ya posees un turno activo en estado Solicitado. No podés reservar otro hasta asistir o cancelar el anterior.', 409);
  }

  //Rechaza si el empleado ya está ocupado en ese horario
  const isOccupied = await turnoRepository.isSlotOccupied(id_empleado, fecha_hora);
  if (isOccupied) {
    throw createError('El barbero seleccionado ya tiene un turno reservado en ese horario. Por favor elegí otro horario o profesional.', 409);
  }

  // Inserción atómica del turno
  const idTurno = await turnoRepository.create({
    id_cliente: resolvedClienteId,
    id_empleado,
    id_servicio,
    fecha_hora,
  });

  return getById(idTurno, user);
}

async function updateStatus(id, { estado, motivo }, user) {
  const turno = await turnoRepository.findById(id);
  if (!turno) {
    throw createError('Turno no encontrado', 404);
  }

  if (turno.estado !== 'SOLICITADO') {
    throw createError(`El turno ya se encuentra en estado '${turno.estado}' y no puede ser modificado`, 409);
  }

  const cleanEstado = String(estado).toUpperCase();
  if (!ESTADOS_VALIDOS.includes(cleanEstado)) {
    throw createError(`Estado inválido. Opciones permitidas: ${ESTADOS_VALIDOS.join(', ')}`, 400);
  }

  // Validación de permisos según la transición solicitada
  if (cleanEstado === 'ASISTIDO' || cleanEstado === 'NO ASISTIDO') {
    if (user && user.rol === 'CLIENTE') {
      throw createError('Solo el personal de la barbería puede confirmar asistencia o registrar inasistencias', 403);
    }
  }

  const connection = await pool.getConnection();
  let strikeSumado = false;
  let multaGenerada = false;

  try {
    await connection.beginTransaction();

    if (cleanEstado === 'ASISTIDO') {
      //Asistencia confirmada
      await turnoRepository.updateStatus(id, 'ASISTIDO', null, null, connection);

    } else if (cleanEstado === 'NO ASISTIDO') {
      //Inasistencia confirmada
      const motivoInasistencia = motivo || 'Inasistencia sin previo aviso';
      await turnoRepository.updateStatus(id, 'NO ASISTIDO', motivoInasistencia, null, connection);

      //strike al cliente
      const [strikeResult] = await connection.execute(
        `UPDATE clientes 
         SET contador_strikes = contador_strikes + 1 
         WHERE id_cliente = ?`,
        [turno.id_cliente]
      );

      // Verificar total de strikes actualizado
      const [clientRows] = await connection.execute(
        'SELECT contador_strikes FROM clientes WHERE id_cliente = ?',
        [turno.id_cliente]
      );
      const strikesActuales = clientRows[0] ? clientRows[0].contador_strikes : 0;
      strikeSumado = true;

      // Si llega a 3 o más strikes:,pasa a multado y se emite la multa automática
      if (strikesActuales >= 3) {
        await connection.execute(
          "UPDATE clientes SET estado = 'MULTADO' WHERE id_cliente = ?",
          [turno.id_cliente]
        );

        await connection.execute(
          `INSERT INTO multas (id_cliente, id_turno, monto, motivo, estado_pago)
           VALUES (?, ?, ?, 'Acumulación de 3 strikes por inasistencias o cancelaciones tardías', 'PENDIENTE')`,
          [turno.id_cliente, id, MONTO_MULTA_STRIKES]
        );
        multaGenerada = true;
      }

    } else if (cleanEstado === 'CANCELADO') {
      const canceladoPor = user && user.rol ? user.rol : 'ADMIN';
      const motivoCancelacion = motivo || (canceladoPor === 'CLIENTE' ? 'Cancelado por el cliente' : 'Cancelado por el local');

      // Si quien cancela es el cliente: evalua las 24 horas de antelación
      if (canceladoPor === 'CLIENTE') {
        const fechaTurnoMs = new Date(turno.fecha_hora).getTime();
        const ahoraMs = Date.now();
        const horasAnticipacion = (fechaTurnoMs - ahoraMs) / (1000 * 60 * 60);

        if (horasAnticipacion < 24) {
          //Cancelación tardía 
          await connection.execute(
            `UPDATE clientes 
             SET contador_strikes = contador_strikes + 1 
             WHERE id_cliente = ?`,
            [turno.id_cliente]
          );

          const [clientRows] = await connection.execute(
            'SELECT contador_strikes FROM clientes WHERE id_cliente = ?',
            [turno.id_cliente]
          );
          const strikesActuales = clientRows[0] ? clientRows[0].contador_strikes : 0;
          strikeSumado = true;

          if (strikesActuales >= 3) {
            await connection.execute(
              "UPDATE clientes SET estado = 'MULTADO' WHERE id_cliente = ?",
              [turno.id_cliente]
            );

            await connection.execute(
              `INSERT INTO multas (id_cliente, id_turno, monto, motivo, estado_pago)
               VALUES (?, ?, ?, 'Cancelación con menos de 24 hs de anticipación y acumulación de 3 strikes', 'PENDIENTE')`,
              [turno.id_cliente, id, MONTO_MULTA_STRIKES]
            );
            multaGenerada = true;
          }
        }
      }

      await turnoRepository.updateStatus(id, 'CANCELADO', motivoCancelacion, canceladoPor, connection);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const turnoActualizado = await turnoRepository.findById(id);

  return {
    turno: turnoActualizado,
    strikeSumado,
    multaGenerada,
  };
}

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
};
