import { apiRequest } from './api';

/**
 * Servicio de API para Pagos y Multas con Mercado Pago (CUU4.1)
 * Módulo 3 - Lucas (DSW)
 */
export const pagoService = {
  /**
   * Obtiene el listado de multas y estado de strikes del cliente logueado
   */
  async getMisMultas() {
    const res = await apiRequest('/pagos/multas', { method: 'GET' });
    return res.data;
  },

  /**
   * Genera la preferencia de checkout de Mercado Pago
   */
  async crearPreferencia(idMulta) {
    const res = await apiRequest('/pagos/preferencia', {
      method: 'POST',
      body: JSON.stringify({ id_multa: idMulta }),
    });
    return res.data;
  },

  /**
   * Confirma el pago de la multa, resetea los strikes a 0 y rehabilita la cuenta
   */
  async confirmarPago(idMulta, paymentMethod = 'Mercado Pago') {
    const res = await apiRequest('/pagos/confirmar', {
      method: 'POST',
      body: JSON.stringify({ id_multa: idMulta, paymentMethod }),
    });
    return res.data;
  },
};
