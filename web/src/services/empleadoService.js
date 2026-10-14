import { apiRequest } from './api';

/**
 * Servicio de API para Empleados / Barberos (Parte 2 - Mateo)
 */
export const empleadoService = {
  async getAll() {
    const res = await apiRequest('/empleados', { method: 'GET' });
    return res.data;
  },

  async create(data) {
    const res = await apiRequest('/empleados', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async update(id, data) {
    const res = await apiRequest(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async delete(id) {
    const res = await apiRequest(`/empleados/${id}`, { method: 'DELETE' });
    return res.data;
  },
};
