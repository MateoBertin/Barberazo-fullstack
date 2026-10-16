/**
 * Autorización por rol. Usar SIEMPRE después de `authenticateToken`,
 * porque el `RoleGuard` del front es solo UX y se bypassea con curl.
 *
 * Roles válidos en DB (`usuarios.rol`): 'ADMIN', 'EMPLEADO', 'CLIENTE'.
 * Uso: router.get('/ruta', authenticateToken, requireRole('ADMIN'), handler);
 */
function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map((role) => String(role).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    const userRole = String(req.user.rol || '').toUpperCase();
    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado para tu rol',
      });
    }

    next();
  };
}

module.exports = { requireRole };
