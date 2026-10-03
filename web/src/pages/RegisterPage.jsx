import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Timer as TimerIcon,
  MarkEmailRead as EmailReadIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, verifyRegistrationCode, pendingVerification } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos = 300s
  const [verifyError, setVerifyError] = useState('');
  const [loading, setLoading] = useState(false);

  // Temporizador de 5 minutos
  useEffect(() => {
    let timer;
    if (openVerifyModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [openVerifyModal, timeLeft]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const code = register({
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
      });

      setSuccessCode(code);
      setInputCode(code); // Pre-cargar para comodidad del usuario
      setTimeLeft(300);
      setOpenVerifyModal(true);
    } catch (err) {
      setError(err.message || 'Error durante el registro.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setLoading(true);

    try {
      await verifyRegistrationCode(inputCode);
      setOpenVerifyModal(false);
      navigate('/cliente/home', { replace: true });
    } catch (err) {
      setVerifyError(err.message || 'Error de verificación.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f1115 0%, #1a1d24 100%)',
        py: { xs: 3, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            background: '#181b20',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              Crear Cuenta de Cliente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Regístrate en Barberazo para solicitar y administrar tus turnos
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 341-5551234"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  helperText="Mínimo 6 caracteres"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 1.4, fontSize: '1rem', fontWeight: 700, mt: 3, mb: 2 }}
            >
              Registrarse y Enviar Código
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya posees una cuenta?{' '}
              <MuiLink component={Link} to="/login" color="primary" sx={{ fontWeight: 700 }}>
                Inicia Sesión
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Modal de Verificación de Código de 5 Minutos (CUU2.1) */}
      <Dialog
        open={openVerifyModal}
        onClose={() => {}}
        PaperProps={{
          sx: { background: '#181b20', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 3, p: 2 },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <EmailReadIcon sx={{ fontSize: 48, color: '#d4af37', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Verificación por Correo
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se ha enviado un código de confirmación a <strong>{formData.email}</strong>. El código expirará en 5 minutos.
          </Alert>

          {successCode && (
            <Alert severity="success" sx={{ mb: 2, background: 'rgba(16, 185, 129, 0.15)' }}>
              Código de demostración generado: <strong>{successCode}</strong>
            </Alert>
          )}

          {verifyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {verifyError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, my: 2 }}>
            <TimerIcon color={timeLeft < 60 ? 'error' : 'primary'} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: timeLeft < 60 ? 'error.main' : 'primary.main' }}>
              Tiempo restante: {formatTime(timeLeft)}
            </Typography>
          </Box>

          <form onSubmit={handleVerifySubmit} id="verify-form">
            <TextField
              fullWidth
              label="Código de 6 dígitos"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="123456"
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: 4 } }}
              required
            />
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center' }}>
          <Button
            type="submit"
            form="verify-form"
            variant="contained"
            color="primary"
            size="large"
            disabled={timeLeft === 0 || loading}
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : timeLeft > 0 ? 'Confirmar Registro' : 'Código Expirado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
