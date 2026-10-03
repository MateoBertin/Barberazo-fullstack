import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Grid, Chip, Button, Stack, Alert, Rating } from '@mui/material';
import {
  Warning as WarningIcon,
  Star as StarIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { BookingWizard } from '../../components/booking/BookingWizard';
import { ReviewModal } from '../../components/reviews/ReviewModal';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reviews } = useData();
  const navigate = useNavigate();

  // Historial del cliente: turnos finalizados (no activos), más recientes primero
  const pastAppointments = appointments
    .filter((a) => String(a.clientId) === String(user?.id) && a.status !== 'Solicitado')
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Turno seleccionado para calificar (CUU1.4)
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const hasReview = (appointmentId) =>
    reviews.some((r) => r.appointmentId === appointmentId);

  const getReviewRating = (appointmentId) =>
    reviews.find((r) => r.appointmentId === appointmentId)?.rating || 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── TARJETA HERO DE BIENVENIDA Y ESTADO ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #22262f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              ¡Hola, {user?.nombre}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenido a Barberazo. Aquí puedes reservar turnos, consultar tu turno activo o gestionar tus penalizaciones.
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
                color={user?.strikes > 0 ? (user?.strikes >= 3 ? 'error' : 'warning') : 'default'}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Alerta destacada si está multado */}
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

      {/* ─── ASISTENTE DE RESERVA / TURNO ACTIVO (CUU1.2 & CUU1.5) ─── */}
      <BookingWizard />

      {/* ─── HISTORIAL DE TURNOS + CALIFICACIÓN (CUU1.4) ─── */}
      {pastAppointments.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', mt: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon sx={{ color: '#d4af37' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Mis Turnos Anteriores
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {pastAppointments.map((appointment) => {
              const reviewed = hasReview(appointment.id);
              const canReview = appointment.status === 'Asistido' && !reviewed;
              return (
                <Paper
                  key={appointment.id}
                  sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {appointment.serviceName} — {appointment.date} a las {appointment.time} hs
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Con {appointment.employeeName} • {appointment.status}
                      </Typography>
                    </Box>
                    {canReview ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<StarIcon />}
                        onClick={() => setSelectedAppointment(appointment)}
                        sx={{ fontWeight: 700 }}
                      >
                        Calificar
                      </Button>
                    ) : (
                      reviewed && (
                        <Rating value={getReviewRating(appointment.id)} readOnly size="small" />
                      )
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* ─── MODAL DE CALIFICACIÓN (CUU1.4) ─── */}
      <ReviewModal
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
      />
    </Container>
  );
};

