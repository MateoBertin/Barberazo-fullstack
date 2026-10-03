import React from 'react';
import { Container, Typography, Paper, Grid, Stack, Chip } from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { TurnosManager } from '../../components/turnos/TurnosManager';

export const OwnerDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── HERO HEADER ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
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
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                Agenda y Gestión de Turnos
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Supervisa la agenda diaria de la barbería, confirma asistencias e inasistencias de clientes y gestiona cancelaciones.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip label="Administrador General" color="secondary" sx={{ fontWeight: 700 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── CONSOLA DE GESTIÓN DE TURNOS (CUU1.3, CUU1.6) ─── */}
      <TurnosManager modo="dueno" />
    </Container>
  );
};
