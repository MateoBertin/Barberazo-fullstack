import { apiRequest } from './api';

/**
 * Servicio de API para Turnos y Agenda (Parte 3 - Lucas)
 */
export const turnoService = {
  async getAll(filters = {}) {
    // Limpiar claves vacías o undefined
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        cleanFilters[key] = val;
      }
    });

    const params = new URLSearchParams(cleanFilters).toString();
    const endpoint = params ? `/turnos?${params}` : '/turnos';
    const res = await apiRequest(endpoint, { method: 'GET' });
    return res.data;
  },

  async getById(id) {
    const res = await apiRequest(`/turnos/${id}`, { method: 'GET' });
    return res.data;
  },

  async create(appointmentData) {
    const res = await apiRequest('/turnos', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return res.data;
  },

  async updateStatus(id, estado, motivo = '') {
    const res = await apiRequest(`/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, motivo }),
    });
    return res;
  },
};
