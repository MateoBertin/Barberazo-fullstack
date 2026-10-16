import { apiRequest } from './api';

/**
 * Servicio de API para Servicios de Barbería
 */
export const servicioService = {
  async getAll() {
    const res = await apiRequest('/servicios', { method: 'GET' });
    return res.data;
  },

  async create(data) {
    const res = await apiRequest('/servicios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async update(id, data) {
    const res = await apiRequest(`/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async toggleStatus(id) {
    const res = await apiRequest(`/servicios/${id}/estado`, {
      method: 'PATCH',
    });
    return res.data;
  },
};
