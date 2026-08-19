import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
} from '@mui/material';
import {
  ContentCut as ScissorsIcon,
  CalendarMonth as CalendarIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth, MOCK_USERS } from '../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const handleQuickLogin = (email, password) => {
    login(email, password);
    const found = MOCK_USERS.find((u) => u.email === email);
    if (found.rol === 'dueno') navigate('/dueno/home');
    else if (found.rol === 'empleado') navigate('/empleado/home');
    else navigate('/cliente/home');
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(180deg, #0f1115 0%, #181b20 100%)', py: 6 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
          <Grid item xs={12} md={7}>
            <Chip
              label="UTN FRRo - Seminario Integrador G24"
              color="primary"
              variant="outlined"
              sx={{ mb: 2, fontWeight: 600, borderColor: '#d4af37' }}
            />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.15,
                mb: 2.5,
                fontSize: { xs: '2.5rem', md: '3.75rem' },
              }}
            >
              Gestión Inteligente de Turnos para{' '}
              <Typography
                component="span"
                variant="inherit"
                sx={{
                  background: 'linear-gradient(90deg, #d4af37 0%, #ff833a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Barberías Premium
              </Typography>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
              Reserva tu turno de forma rápida, selecciona tu barbero preferido, gestiona tu horario sin esperas y califica la experiencia post-servicio.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {!user ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate('/registro')}
                    sx={{ px: 4, py: 1.5, fontSize: '1.05rem', fontWeight: 700 }}
                  >
                    Registrarme como Cliente
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ px: 4, py: 1.5, fontSize: '1.05rem' }}
                  >
                    Iniciar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate(user.rol === 'dueno' ? '/dueno/home' : user.rol === 'empleado' ? '/empleado/home' : '/cliente/home')}
                  sx={{ px: 4, py: 1.5, fontSize: '1.05rem', fontWeight: 700 }}
                >
                  Ir a Mi Panel ({user.nombre})
                </Button>
              )}
            </Stack>
          </Grid>

          {/* Quick Demo Access Card */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={8}
              sx={{
                p: 3.5,
                background: 'rgba(24, 27, 32, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 4,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ScissorsIcon sx={{ color: '#d4af37', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Acceso Rápido de Evaluación
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Haz clic en cualquier rol para ingresar inmediatamente al sistema y evaluar sus vistas y permisos:
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={() => handleQuickLogin('cliente@barberazo.com', '123')}
                  sx={{ justifyContent: 'flex-start', py: 1.2, px: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Cliente Activo</Typography>
                    <Typography variant="caption" color="text.secondary">Gerónimo Benavides (0 strikes)</Typography>
                  </Box>
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<PersonIcon />}
                  onClick={() => handleQuickLogin('multado@barberazo.com', '123')}
                  sx={{ justifyContent: 'flex-start', py: 1.2, px: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>Cliente Multado</Typography>
                    <Typography variant="caption" color="text.secondary">Lucas Multini Martino (3 strikes - Requiere Pago)</Typography>
                  </Box>
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<BadgeIcon />}
                  onClick={() => handleQuickLogin('empleado@barberazo.com', '123')}
                  sx={{ justifyContent: 'flex-start', py: 1.2, px: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Empleado de Barbería</Typography>
                    <Typography variant="caption" color="text.secondary">Nicolas Rodrigo Gutierrez Fernandez (Consulta & Asistencias)</Typography>
                  </Box>
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<AdminIcon />}
                  onClick={() => handleQuickLogin('dueno@barberazo.com', '123')}
                  sx={{ justifyContent: 'flex-start', py: 1.2, px: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Dueño (Administrador)</Typography>
                    <Typography variant="caption" color="text.secondary">Rodrigo Bozio (Control Total del Negocio)</Typography>
                  </Box>
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Feature Cards */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <CalendarIcon sx={{ fontSize: 40, color: '#d4af37', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Reserva Inteligente de Turnos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona la fecha, el servicio deseado (corte, barba, tintura) y la duración estimada. Elige tu barbero o asigna a cualquier disponible.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <ShieldIcon sx={{ fontSize: 40, color: '#e65100', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Control de Strikes y Multas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Política justa para el negocio: cancelaciones tardías (&lt;24hs) e inasistencias acumulan strikes. A los 3 strikes se genera multa con opción de pago Mercado Pago.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ height: '100%', p: 1 }}>
              <CardContent>
                <StarIcon sx={{ fontSize: 40, color: '#10b981', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Calificación y Reseñas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Al completar tu turno, recibe una solicitud para valorar el servicio prestado y dejar tus comentarios para mantener la excelencia del local.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
