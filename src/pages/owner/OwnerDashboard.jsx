import React from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Stack, Chip } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  DesignServices as ServicesIcon,
  Badge as BadgeIcon,
  EventAvailable as DateIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #2a2215 100%)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <AdminIcon sx={{ color: '#d4af37', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Panel del Dueño (Administración)
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Control total del sistema: gestión de empleados, servicios, clientes, habilitación de calendario y supervisión de turnos.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip label="Administrador General" color="secondary" sx={{ fontWeight: 700 }} />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CalendarIcon sx={{ fontSize: 36, color: '#d4af37', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Agenda de Turnos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Visualiza y gestiona la agenda completa de la barbería por fecha y empleado.
            </Typography>
            <Button variant="contained" color="primary" fullWidth onClick={() => navigate('/dueno/home')}>
              Ver Agenda Global
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <BadgeIcon sx={{ fontSize: 36, color: '#3b82f6', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Empleados & Horarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Alta, edición y eliminación de barberos. Asignación de jornadas de trabajo.
            </Typography>
            <Button variant="outlined" color="info" fullWidth onClick={() => navigate('/dueno/empleados')}>
              Gestionar Empleados
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ServicesIcon sx={{ fontSize: 36, color: '#e65100', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Servicios & Tarifas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crea o edita los servicios (corte, barba, tintura) y sus duraciones estimadas.
            </Typography>
            <Button variant="outlined" color="secondary" fullWidth onClick={() => navigate('/dueno/servicios')}>
              Gestionar Servicios
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <PeopleIcon sx={{ fontSize: 36, color: '#10b981', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Clientes & Bloqueos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Revisa el listado de clientes registrados y gestiona bloqueos o desbloqueos.
            </Typography>
            <Button variant="outlined" color="success" fullWidth onClick={() => navigate('/dueno/clientes')}>
              Gestionar Clientes
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <DateIcon sx={{ fontSize: 36, color: '#f59e0b', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Habilitación de Fechas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define qué días abre el local y gestiona feriados o cierres excepcionales.
            </Typography>
            <Button variant="outlined" color="warning" fullWidth onClick={() => navigate('/dueno/fechas')}>
              Configurar Calendario
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
