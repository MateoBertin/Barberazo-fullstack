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

  // Registro de Cliente (CUU2.1) - Inicia verificación por código (5 min)
  const register = (userData) => {
    // Generar código de 6 dígitos para la verificación del CUU2.1
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

    const tempUser = {
      ...userData,
      verificationCode: code,
      codeExpiresAt: expiresAt,
    };

    setPendingVerification(tempUser);
    return code; // Retorna código para mostrar en modal de prueba
  };

  // Confirmar código de verificación y persistir en la BD MySQL
  const verifyRegistrationCode = async (codeEntered) => {
    if (!pendingVerification) {
      throw new Error('No hay ninguna sesión de verificación activa.');
    }

    if (Date.now() > pendingVerification.codeExpiresAt) {
      setPendingVerification(null);
      throw new Error('El código de verificación ha expirado (límite de 5 minutos). Inicia el registro nuevamente.');
    }

    if (pendingVerification.verificationCode !== codeEntered) {
      throw new Error('El código ingresado es incorrecto.');
    }

    try {
      // Registrar en la base de datos real
      const { user: registeredUser, token: receivedToken } = await authService.register({
        nombre: pendingVerification.nombre,
        apellido: pendingVerification.apellido,
        email: pendingVerification.email,
        password: pendingVerification.password,
        telefono: pendingVerification.telefono,
      });

      setUser(registeredUser);
      setToken(receivedToken);
      localStorage.setItem('barberazo_user', JSON.stringify(registeredUser));
      if (receivedToken) {
        localStorage.setItem('barberazo_token', receivedToken);
      }
      setPendingVerification(null);
      return registeredUser;
    } catch (apiError) {
      // Fallback local si el backend no está disponible
      if (apiError.message.includes('No se pudo conectar') || apiError.message.includes('fetch')) {
        const localUser = {
          id: 'c_' + Date.now(),
          nombre: pendingVerification.nombre,
          email: pendingVerification.email,
          telefono: pendingVerification.telefono,
          rol: 'cliente',
          estado: 'Activo',
          strikes: 0,
        };
        setUser(localUser);
        localStorage.setItem('barberazo_user', JSON.stringify(localUser));
        setPendingVerification(null);
        return localUser;
      }
      throw apiError;
    }
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
        logout,
        resetPassword,
        updateUserState,
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
