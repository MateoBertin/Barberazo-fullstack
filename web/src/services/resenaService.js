import { apiRequest } from './api';

/**
 * Servicio de API para Reseñas y Calificaciones (Parte 3 - Lucas)
 */
export const resenaService = {
  async getAll() {
    const res = await apiRequest('/resenas', { method: 'GET' });
    return res.data;
  },

  async create(reviewData) {
    const res = await apiRequest('/resenas', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
    return res.data;
  },
};
