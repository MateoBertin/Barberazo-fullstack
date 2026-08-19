import React from 'react';
import { Box, Container, Typography, Paper, Grid, Chip, Button, Stack, Alert } from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #22262f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              ¡Hola, {user?.nombre}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenido al Portal de Clientes de Barberazo. Desde aquí podrás gestionar tus reservas y consultar tu estado.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip
                label={`Estado: ${user?.estado?.toUpperCase()}`}
                color={user?.estado === 'Multado' ? 'error' : user?.estado === 'Bloqueado' ? 'error' : 'success'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`${user?.strikes || 0}/3 Strikes`}
                color={user?.strikes > 0 ? 'warning' : 'default'}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {user?.estado === 'Multado' && (
        <Alert
          severity="error"
          icon={<WarningIcon fontSize="inherit" />}
          sx={{ mb: 4, borderRadius: 3, '& .MuiAlert-message': { width: '100%' } }}
          action={
            <Button color="inherit" size="small" variant="outlined" onClick={() => navigate('/cliente/multas')}>
              Pagar Multa Ahora
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Cuenta Multada por acumular 3 strikes.
          </Typography>
          <Typography variant="body2">
            No podrás solicitar nuevos turnos hasta regularizar el pago de tu multa.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarIcon sx={{ fontSize: 36, color: '#d4af37', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Mis Turnos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Revisa tus turnos activos o cancela tus reservas agendadas.
            </Typography>
            <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/cliente/home')}>
              Ver Agenda
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <WarningIcon sx={{ fontSize: 36, color: '#e65100', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Multas y Penalizaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Consulta el historial de multas e inasistencias acumuladas.
            </Typography>
            <Button variant="outlined" color="secondary" fullWidth onClick={() => navigate('/cliente/multas')}>
              Ver Multas
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <AccountCircle sx={{ fontSize: 36, color: '#10b981', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Perfil y Datos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Actualiza tus datos de contacto y preferencias de usuario.
            </Typography>
            <Button variant="outlined" color="info" fullWidth onClick={() => navigate('/cliente/perfil')}>
              Editar Perfil
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
