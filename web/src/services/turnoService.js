import { apiRequest } from './api';

/**
 * Servicio de API para Turnos y Agenda (Parte 3 - Lucas)
 */
export const turnoService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/turnos?${params}` : '/turnos';
    const res = await apiRequest(endpoint, { method: 'GET' });
    return res.data;
  },

  async create(appointmentData) {
    const res = await apiRequest('/turnos', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return res.data;
  },

  async updateStatus(id, status, reason = '') {
    const res = await apiRequest(`/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return res.data;
  },
};
