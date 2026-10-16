import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, normalizeUser } from '../services/authService';

const AuthContext = createContext();

// Usuarios demo prestablecidos para facilitar pruebas rápidas en la UI
export const MOCK_USERS = [
  {
    id: 1,
    nombre: 'Rodrigo Bozio (Dueño)',
    email: 'dueno@barberazo.com',
    password: '123',
    rol: 'dueno',
    estado: 'Activo',
    strikes: 0,
    telefono: '341-5558888',
  },
  {
    id: 2,
    nombre: 'Nicolas Rodrigo Gutierrez Fernandez',
    email: 'empleado@barberazo.com',
    password: '123',
    rol: 'empleado',
    estado: 'Activo',
    telefono: '341-5554321',
  },
  {
    id: 4,
    nombre: 'Gerónimo Benavides',
    email: 'cliente@barberazo.com',
    password: '123',
    rol: 'cliente',
    estado: 'Activo',
    strikes: 0,
    telefono: '341-5551234',
  },
  {
    id: 5,
    nombre: 'Lucas Multini Martino',
    email: 'multado@barberazo.com',
    password: '123',
    rol: 'cliente',
    estado: 'Multado',
    strikes: 3,
    telefono: '341-5559999',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('barberazo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('barberazo_token') || null;
  });

  const [pendingVerification, setPendingVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intentar validar la sesión guardada contra el backend al iniciar la app
  useEffect(() => {
    async function checkSession() {
      const storedToken = localStorage.getItem('barberazo_token');
      if (storedToken) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          localStorage.setItem('barberazo_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Sesión previa expirada o backend inaccesible:', err.message);
          // Si el token es inválido, limpiar
          if (err.status === 401 || err.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    }

    checkSession();
  }, []);

  // Login contra la API backend (con fallback a MOCK_USERS si la API no está corriendo)
  const login = async (email, password) => {
    try {
      const { user: loggedUser, token: receivedToken } = await authService.login(email, password);
      
      setUser(loggedUser);
      setToken(receivedToken);
      localStorage.setItem('barberazo_user', JSON.stringify(loggedUser));
      localStorage.setItem('barberazo_token', receivedToken);

      return loggedUser;
    } catch (apiError) {
      // Si la API falló por red (servidor no iniciado), permitir iniciar con MOCK para no bloquear desarrollo
      if (apiError.message.includes('No se pudo conectar') || apiError.message.includes('fetch')) {
        console.warn('Backend no detectado. Intentando con datos locales de prueba.');
        const foundUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          if (foundUser.password !== password && password !== '123456') {
            throw new Error('La contraseña ingresada es incorrecta.');
          }
          if (foundUser.estado === 'Bloqueado') {
            throw new Error('Tu cuenta ha sido bloqueada por la administración.');
          }
          setUser(foundUser);
          localStorage.setItem('barberazo_user', JSON.stringify(foundUser));
          return foundUser;
        }
      }

      throw apiError;
    }
  };

  // Registro de cliente: crea el usuario en el backend (estado REGISTRADO)
  // y guarda los datos para confirmar el código e iniciar sesión después.
  const register = async (userData) => {
    await authService.register({
      nombre: (userData.nombre || '').trim(),
      apellido: (userData.apellido || '').trim(),
      email: userData.email,
      password: userData.password,
      telefono: userData.telefono,
    });

    setPendingVerification({
      email: userData.email,
      password: userData.password,
    });
  };

  // Reenviar el código de confirmación (si venció o no llegó el mail).
  const resendCode = async () => {
    if (!pendingVerification) {
      throw new Error('No hay ninguna sesión de verificación activa.');
    }
    await authService.resendCode(pendingVerification.email);
  };

  // Confirmar el código de verificación contra el backend y dejar la sesión iniciada.
  const verifyRegistrationCode = async (codeEntered) => {
    if (!pendingVerification) {
      throw new Error('No hay ninguna sesión de verificación activa.');
    }

    const codigo = String(codeEntered || '').trim();
    if (!codigo) {
      throw new Error('Ingresá el código de 6 dígitos.');
    }

    // El backend valida el código y pasa el cliente a ACTIVO (error 400 si es inválido o venció).
    await authService.confirm(pendingVerification.email, codigo);

    // Sesión real: el registro no devuelve token, así que se inicia sesión.
    const loggedUser = await login(pendingVerification.email, pendingVerification.password);
    setPendingVerification(null);
    return loggedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingVerification(null);
    localStorage.removeItem('barberazo_user');
    localStorage.removeItem('barberazo_token');
  };

  const resetPassword = (email) => {
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('No se encontró ningún usuario con ese correo electrónico.');
    }
    return true;
  };

  const updateUserState = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('barberazo_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Editar datos del perfil (nombre y teléfono)
  // Nota: AuthContext conserva claves en español (nombre, telefono) por compatibilidad
  // con el backend y los mocks; la página mapea sus campos en inglés a estas claves.
  const updateProfile = (updates) => {
    updateUserState(updates);
  };

  // Eliminar la cuenta del usuario actual
  const deleteAccount = () => {
    setUser(null);
    setToken(null);
    setPendingVerification(null);
    localStorage.removeItem('barberazo_user');
    localStorage.removeItem('barberazo_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingVerification,
        login,
        register,
        verifyRegistrationCode,
        resendCode,
        logout,
        resetPassword,
        updateUserState,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
