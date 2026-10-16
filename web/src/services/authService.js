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
    // Crea el usuario en estado REGISTRADO y genera el código de confirmación.
    // El backend no devuelve sesión: primero hay que confirmar y después loguearse.
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        password: userData.password,
        telefono: userData.telefono || null,
      }),
    });
  },

  async confirm(email, codigo) {
    await apiRequest('/auth/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, codigo: String(codigo) }),
    });
  },

  async resendCode(email) {
    await apiRequest('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getProfile() {
    const res = await apiRequest('/auth/profile', {
      method: 'GET',
    });

    return normalizeUser(res.data.user);
  },
};
