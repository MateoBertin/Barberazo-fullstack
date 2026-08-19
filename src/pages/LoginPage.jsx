import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ContentCut as ScissorsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, MOCK_USERS } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = login(email, password);
      const targetPath =
        from ||
        (loggedUser.rol === 'dueno'
          ? '/dueno/home'
          : loggedUser.rol === 'empleado'
          ? '/empleado/home'
          : '/cliente/home');
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMock = (mockUser) => {
    setEmail(mockUser.email);
    setPassword(mockUser.password);
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f1115 0%, #1a1d24 100%)',
        py: 6,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            p: 4,
            borderRadius: 4,
            background: '#181b20',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
              }}
            >
              <ScissorsIcon sx={{ color: '#121212', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tus credenciales para acceder a Barberazo
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
              <MuiLink component={Link} to="/recuperar-contrasena" variant="caption" underline="hover" color="primary">
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ py: 1.4, fontSize: '1rem', fontWeight: 700, mb: 2 }}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              O probar credenciales demo
            </Typography>
          </Divider>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, textAlign: 'center' }}>
            Selecciona un perfil para autorellenar datos:
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
            {MOCK_USERS.map((mock) => (
              <Chip
                key={mock.id}
                label={mock.rol.toUpperCase() + (mock.estado === 'Multado' ? ' (MULTADO)' : '')}
                size="small"
                onClick={() => handleSelectMock(mock)}
                color={mock.rol === 'dueno' ? 'secondary' : mock.rol === 'empleado' ? 'info' : mock.estado === 'Multado' ? 'error' : 'default'}
                variant={email === mock.email ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?{' '}
              <MuiLink component={Link} to="/registro" color="primary" sx={{ fontWeight: 700 }}>
                Regístrate como Cliente
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
