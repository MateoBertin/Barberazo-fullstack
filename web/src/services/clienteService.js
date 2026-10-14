import { apiRequest } from './api';

/**
 * Servicio de API para Gestión de Clientes (Parte 2 - Mateo)
 */
export const clienteService = {
  async getAll() {
    const res = await apiRequest('/clientes', { method: 'GET' });
    return res.data;
  },

  async toggleBlock(id, motivo = '') {
    const res = await apiRequest(`/clientes/${id}/bloqueo`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });
    return res.data;
  },

  async updateProfile(data) {
    const res = await apiRequest('/clientes/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
