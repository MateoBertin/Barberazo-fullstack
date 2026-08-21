const authService = require('../services/authService');

async function register(req, res) {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido, email y contraseña son obligatorios',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const { user, token } = await authService.register({
      nombre,
      apellido,
      email,
      password,
      telefono,
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: { user, token },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al registrar usuario',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios',
      });
    }

    const { user, token } = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: { user, token },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al iniciar sesión',
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await authService.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: { user: authService.sanitizeUser(user) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
    });
  }
}

module.exports = { register, login, getProfile };
