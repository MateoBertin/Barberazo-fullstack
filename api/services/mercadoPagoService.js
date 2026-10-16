const { MercadoPagoConfig, Preference } = require('mercadopago');
const { pool } = require('../config/db');
const multaRepository = require('../repositories/multaRepository');
const clienteRepository = require('../repositories/clienteRepository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/* Inicializa cliente de Mercado Pago si existe token en el entorno*/
function getMercadoPagoClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token });
}

/*Obtiene las multas y el estado actual del cliente logueado*/
async function getMisMultas(user) {
  let cliente;
  if (user.rol === 'CLIENTE') {
    cliente = await clienteRepository.findByUserId(user.id);
  } else {
    // Si es admin, puede consultar de prueba
    cliente = await clienteRepository.findByUserId(user.id);
  }

  if (!cliente) {
    throw createError('Perfil de cliente no encontrado', 404);
  }

  const multas = await multaRepository.findByClienteId(cliente.id_cliente);
  const pendingFine = await multaRepository.findPendingByClienteId(cliente.id_cliente);

  return {
    cliente: {
      id_cliente: cliente.id_cliente,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      contador_strikes: cliente.contador_strikes,
      estado: cliente.estado,
    },
    multas,
    multaPendiente: pendingFine,
  };
}

async function crearPreferencia(idMulta, user) {
  const multa = await multaRepository.findById(idMulta);
  if (!multa) {
    throw createError('Multa no encontrada', 404);
  }

  if (multa.estado_pago === 'PAGADO') {
    throw createError('La multa seleccionada ya se encuentra abonada', 400);
  }

  // Si es cliente, verificar que le pertenezca
  if (user && user.rol === 'CLIENTE' && multa.id_usuario !== user.id) {
    throw createError('No tenés permisos para abonar esta multa', 403);
  }

  const mpClient = getMercadoPagoClient();
  let preferenceData;

  if (mpClient) {
    try {
      const preference = new Preference(mpClient);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      const res = await preference.create({
        body: {
          items: [
            {
              id: String(multa.id_multa),
              title: 'Regularización de Multa - Barberazo',
              description: multa.motivo || 'Penalización por 3 strikes acumulados',
              quantity: 1,
              unit_price: Number(multa.monto),
              currency_id: 'ARS',
            },
          ],
          payer: {
            email: user.email,
          },
          back_urls: {
            success: `${clientUrl}/cliente/multas?status=success`,
            failure: `${clientUrl}/cliente/multas?status=failure`,
            pending: `${clientUrl}/cliente/multas?status=pending`,
          },
          auto_return: 'approved',
          external_reference: String(multa.id_multa),
        },
      });

      preferenceData = {
        id: res.id,
        init_point: res.init_point,
        sandbox_init_point: res.sandbox_init_point,
      };
    } catch (mpError) {
      console.warn('Mercado Pago API warning (usando modo sandbox seguro):', mpError.message);
      preferenceData = {
        id: `pref_sandbox_${multa.id_multa}_${Date.now()}`,
        init_point: null,
        sandbox_init_point: null,
      };
    }
  } else {
    // Modo simulación local / desarrollo seguro
    preferenceData = {
      id: `pref_local_${multa.id_multa}_${Date.now()}`,
      init_point: null,
      sandbox_init_point: null,
    };
  }

  return {
    multa,
    preference: preferenceData,
  };
}

/*Confirmar pago de multa y rehabilitar cuenta del cliente
 1. Marca la multa como PAGADA con fecha actual y medio de pago.
 2. Resetea los strikes a 0 y pasa el estado del cliente a ACTIVO.*/
async function confirmarPago(idMulta, { paymentMethod }, user) {
  const multa = await multaRepository.findById(idMulta);
  if (!multa) {
    throw createError('Multa no encontrada', 404);
  }

  if (multa.estado_pago === 'PAGADO') {
    throw createError('La multa ya fue abonada previamente', 400);
  }

  if (user && user.rol === 'CLIENTE' && multa.id_usuario !== user.id) {
    throw createError('No tenés permisos para pagar esta multa', 403);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const metodo = paymentMethod || 'Mercado Pago';

    // 1. Registrar pago en la tabla multas
    await multaRepository.registrarPago(idMulta, { metodo_pago: metodo }, connection);

    // 2. Resetear strikes a 0 y rehabilitar a ACTIVO
    await multaRepository.rehabilitarCliente(multa.id_cliente, connection);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const multaActualizada = await multaRepository.findById(idMulta);
  const clienteActualizado = await clienteRepository.findById(multa.id_cliente);

  return {
    multa: multaActualizada,
    cliente: clienteActualizado,
    message: '¡Pago aprobado con éxito! Tu cuenta ha sido rehabilitada y tus strikes se han reiniciado a 0.',
  };
}

module.exports = {
  getMisMultas,
  crearPreferencia,
  confirmarPago,
};
