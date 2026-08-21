import { apiRequest } from './api';

/**
 * Normaliza el rol del backend ('ADMIN', 'EMPLEADO', 'CLIENTE')
 * a los identificadores usados en el frontend ('dueno', 'empleado', 'cliente').
 */
export function normalizeUser(user) {
  if (!user) return null;

  let role = (user.rol || '').toLowerCase();
  if (role === 'admin') role = 'dueno';

  let estado = user.estado || 'Activo';
  if (estado === 'ACTIVO') estado = 'Activo';
  if (estado === 'BLOQUEADO') estado = 'Bloqueado';
  if (estado === 'MULTADO') estado = 'Multado';
  if (estado === 'REGISTRADO') estado = 'Registrado';

  return {
    ...user,
    id: user.id_usuario || user.id,
    nombre: user.nombre || user.email?.split('@')[0] || 'Usuario',
    apellido: user.apellido || '',
    rol: role,
    estado,
    strikes: user.contador_strikes !== undefined ? user.contador_strikes : (user.strikes || 0),
  };
}

export const authService = {
  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const user = normalizeUser(res.data.user);
    const token = res.data.token;

    return { user, token };
  },

  async register(userData) {
    // Si viene nombre completo en un solo campo, separar nombre y apellido
    let nombre = userData.nombre || '';
    let apellido = userData.apellido || '';

    if (nombre && !apellido) {
      const parts = nombre.trim().split(' ');
      if (parts.length > 1) {
        nombre = parts[0];
        apellido = parts.slice(1).join(' ');
      } else {
        apellido = '-';
      }
    }

    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        apellido,
        email: userData.email,
        password: userData.password,
        telefono: userData.telefono || null,
      }),
    });

    const user = normalizeUser(res.data.user);
    const token = res.data.token;

    return { user, token };
  },

  async getProfile() {
    const res = await apiRequest('/auth/profile', {
      method: 'GET',
    });

    return normalizeUser(res.data.user);
  },
};
