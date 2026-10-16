import { apiRequest } from './api';

/**
 * Servicio de API para Fechas y Calendario
 */
export const fechaService = {
  async getAll() {
    const res = await apiRequest('/fechas', { method: 'GET' });
    return res.data;
  },

  async toggleDate(fecha) {
    const res = await apiRequest(`/fechas/${fecha}/toggle`, { method: 'PATCH' });
    return res.data;
  },

  async updateSchedule(fecha, startTime, endTime) {
    const res = await apiRequest(`/fechas/${fecha}/horario`, {
      method: 'PUT',
      body: JSON.stringify({ startTime, endTime }),
    });
    return res.data;
  },
};
