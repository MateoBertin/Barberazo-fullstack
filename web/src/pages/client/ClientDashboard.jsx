import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Chip, Button, Stack, Rating } from '@mui/material';
import {
  Star as StarIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { turnoService } from '../../services/turnoService';
import { resenaService } from '../../services/resenaService';
import { BookingWizard } from '../../components/booking/BookingWizard';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Estado del back ('SOLICITADO', 'ASISTIDO', ...) al formato que usa esta UI.
const mapStatus = (estado) => {
  const map = {
    SOLICITADO: 'Solicitado',
    ASISTIDO: 'Asistido',
    'NO ASISTIDO': 'No-Asistido',
    CANCELADO: 'Cancelado',
    'CANCELADO EMPLEADO': 'Cancelado',
  };
  return map[estado] || estado;
};

// Fila del back (turnos + clientes + empleados + servicios) al formato de la UI.
const fromApi = (turno) => ({
  id: turno.id_turno,
  clientId: turno.id_cliente,
  clientName: turno.cliente_nombre_completo,
  employeeId: turno.id_empleado,
  employeeName: turno.empleado_nombre_completo,
  serviceName: turno.servicio_nombre,
  date: turno.fecha,
  time: turno.hora,
  status: mapStatus(turno.estado),
});

export const ClientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reviews } = useData();

  // Historial real desde MySQL; si el back no responde, se usan los mocks locales.
  const [apiAppointments, setApiAppointments] = useState(null);
  const [apiReviews, setApiReviews] = useState(null);

  const fetchHistory = async () => {
    try {
      const [turnos, resenas] = await Promise.all([
        turnoService.getAll(),
        resenaService.getAll(),
      ]);
      setApiAppointments((turnos || []).map(fromApi));
      setApiReviews(
        (resenas || []).map((resena) => ({
          appointmentId: resena.id_turno,
          rating: resena.calificacion,
        }))
      );
    } catch {
      setApiAppointments(null);
      setApiReviews(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const allAppointments = apiAppointments || appointments;
  const allReviews = apiReviews || reviews;

  // Historial del cliente: turnos finalizados (no activos), más recientes primero.
  // El back ya filtra por el cliente logueado; el filtro local es para el fallback mock.
  const pastAppointments = allAppointments
    .filter((a) => apiAppointments || String(a.clientId) === String(user?.id))
    .filter((a) => a.status !== 'Solicitado')
    .sort((a, b) => (`${b.date} ${b.time}`).localeCompare(`${a.date} ${a.time}`));

  // Turno seleccionado para calificar
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const hasReview = (appointmentId) =>
    allReviews.some((r) => r.appointmentId === appointmentId);

  const getReviewRating = (appointmentId) =>
    allReviews.find((r) => r.appointmentId === appointmentId)?.rating || 0;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── TARJETA HERO DE BIENVENIDA Y ESTADO ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.neutralTint} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.gold, 0.2)}`,
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

      {/* ─── Asistente de reserva / turno activo ─── */}
      {/* Si la cuenta está multada, el propio BookingWizard muestra el aviso
          y bloquea la reserva: no se duplica el mensaje acá */}
      <BookingWizard />

      {/* ─── Historial de turnos + calificación ─── */}
      {pastAppointments.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, background: BRAND_COLORS.card, mt: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon sx={{ color: BRAND_COLORS.gold }} />
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
                  sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2 }}
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

      {/* ─── Modal de calificación ─── */}
      <ReviewModal
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onReviewSubmitted={fetchHistory}
      />
    </Container>
  );
};

