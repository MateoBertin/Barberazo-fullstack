import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Usuarios de prueba prestablecidos para facilitar la evaluación
export const MOCK_USERS = [
  {
    id: 'c1',
    nombre: 'Gerónimo Benavides',
    email: 'cliente@barberazo.com',
    password: '123',
    rol: 'cliente',
    estado: 'Activo', // 'Registrado' | 'Activo' | 'Bloqueado' | 'Multado'
    strikes: 0,
    telefono: '341-5551234'
  },
  {
    id: 'c2',
    nombre: 'Lucas Multini Martino',
    email: 'multado@barberazo.com',
    password: '123',
    rol: 'cliente',
    estado: 'Multado',
    strikes: 3,
    telefono: '341-5559999'
  },
  {
    id: 'e1',
    nombre: 'Nicolas Rodrigo Gutierrez Fernandez (Empleado)',
    email: 'empleado@barberazo.com',
    password: '123',
    rol: 'empleado',
    estado: 'Activo',
    telefono: '341-5554321'
  },
  {
    id: 'd1',
    nombre: 'Rodrigo Bozio (Dueño)',
    email: 'dueno@barberazo.com',
    password: '123',
    rol: 'dueno',
    estado: 'Activo',
    telefono: '341-5558888'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('barberazo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [pendingVerification, setPendingVerification] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('barberazo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('barberazo_user');
    }
  }, [user]);

  // Login habitual con e-mail y contraseña (CUU1.1)
  const login = (email, password, preferredRole = null) => {
    // Buscar usuario registrado o permitir rápida selección de rol
    const foundUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (foundUser) {
      if (foundUser.password !== password) {
        throw new Error('La contraseña ingresada es incorrecta.');
      }
      if (foundUser.estado === 'Bloqueado') {
        throw new Error('Tu cuenta ha sido bloqueada por la administración de la barbería.');
      }
      setUser(foundUser);
      return foundUser;
    }

    // Si no está registrado en los MOCK pero especificó un rol para demo
    if (preferredRole) {
      const newUser = {
        id: 'u_' + Date.now(),
        nombre: email.split('@')[0],
        email,
        password,
        rol: preferredRole,
        estado: 'Activo',
        strikes: 0,
      };
      setUser(newUser);
      return newUser;
    }

    throw new Error('No existe una cuenta registrada con este correo electrónico.');
  };

  // Registro de Cliente (CUU2.1) - Desencadena verificación por código (5 min)
  const register = (userData) => {
    const existing = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      throw new Error('Ya existe una cuenta registrada con ese correo electrónico.');
    }

    // Generar código aleatorio de 6 dígitos para simulación
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

    const tempUser = {
      ...userData,
      id: 'c_' + Date.now(),
      rol: 'cliente',
      estado: 'Registrado',
      strikes: 0,
      verificationCode: code,
      codeExpiresAt: expiresAt,
    };

    setPendingVerification(tempUser);
    return code; // Retorna código para mostrar en alerta de prueba
  };

  // Confirmar código de verificación de 5 minutos
  const verifyRegistrationCode = (codeEntered) => {
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

    // Activar cuenta
    const activeUser = {
      ...pendingVerification,
      estado: 'Activo',
      verificationCode: undefined,
      codeExpiresAt: undefined,
    };

    MOCK_USERS.push(activeUser);
    setUser(activeUser);
    setPendingVerification(null);
    return activeUser;
  };

  const logout = () => {
    setUser(null);
    setPendingVerification(null);
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
