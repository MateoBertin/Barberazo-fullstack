import React from 'react';
import { Container, Typography, Paper, Grid, Stack, Chip, Alert } from '@mui/material';
import { Badge as BadgeIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { TurnosManager } from '../../components/turnos/TurnosManager';

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* ─── HERO HEADER ─── */}
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
                Agenda del Barbero
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              ¡Hola, {user?.nombre}! Consulta tus clientes agendados, confirma asistencias y registra inasistencias.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip label="Barbero / Empleado" color="info" sx={{ fontWeight: 700 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── CONSOLA DE GESTIÓN DE TURNOS (CUU1.3, CUU1.6) ─── */}
      <TurnosManager modo="empleado" />
    </Container>
  );
};
