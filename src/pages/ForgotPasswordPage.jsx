import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    }
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
          <Box sx={{ mb: 3 }}>
            <MuiLink
              component={Link}
              to="/login"
              color="inherit"
              underline="none"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary' }}
            >
              <BackIcon fontSize="small" /> Volver al Login
            </MuiLink>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de restauración.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {submitted ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Se ha enviado un enlace de restauración a <strong>{email}</strong>. Por favor revisa tu casilla de entrada.
              </Alert>
              <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/login')}>
                Ir a Iniciar Sesión
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                sx={{ py: 1.4, fontSize: '1rem', fontWeight: 700 }}
              >
                Enviar Enlace de Restauración
              </Button>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
