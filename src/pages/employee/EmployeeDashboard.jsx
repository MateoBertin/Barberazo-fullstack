import React from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Stack, Chip, Alert } from '@mui/material';
import {
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  DesignServices as ServicesIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #172433 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <BadgeIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Panel de Empleado (Barbero)
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Consulta de turnos del día, confirmaciones de asistencia, inasistencias y registro de sobreturnos.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip label="Empleado / Barbero" color="info" sx={{ fontWeight: 700 }} />
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
        <strong>Nota de Permisos de Empleado:</strong> Tienes acceso de consulta a la lista de Clientes y Servicios, pero las acciones de modificación o bloqueo están reservadas exclusivamente al Dueño del local.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarIcon sx={{ fontSize: 36, color: '#3b82f6', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Agenda de Turnos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Consulta los turnos agendados y confirma asistencia o inasistencia.
            </Typography>
            <Button variant="contained" color="info" fullWidth onClick={() => navigate('/empleado/home')}>
              Ver Mi Agenda
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <PeopleIcon sx={{ fontSize: 36, color: '#10b981', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Clientes (Sólo Lectura)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca información de contacto y estado de clientes.
            </Typography>
            <Button variant="outlined" color="success" fullWidth onClick={() => navigate('/empleado/clientes')}>
              Consultar Clientes
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <StarIcon sx={{ fontSize: 36, color: '#d4af37', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reseñas Recibidas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Consulta las calificaciones de los clientes tras asistir al turno.
            </Typography>
            <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/empleado/resenas')}>
              Ver Reseñas
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
