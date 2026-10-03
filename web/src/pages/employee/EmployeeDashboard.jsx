import React from 'react';
import { Container, Typography, Paper, Grid, Stack, Chip, Alert } from '@mui/material';
import { Badge as BadgeIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { TurnosManager } from '../../components/turnos/TurnosManager';
import { BRAND_COLORS, withAlpha } from '../../theme';

export const EmployeeDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── HERO HEADER ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.blueTint} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.infoBlue, 0.4)}`,
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <BadgeIcon sx={{ color: BRAND_COLORS.infoBlue, fontSize: 32, flexShrink: 0 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
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
