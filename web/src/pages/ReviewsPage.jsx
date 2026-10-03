import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Rating,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const ReviewsPage = () => {
  const { user } = useAuth();
  const { reviews, employees } = useData();

  const isOwner = user?.rol === 'dueno';

  // El empleado solo ve las reseñas de sus propios turnos (se ubica por email)
  const employeeRecord = !isOwner
    ? employees.find((e) => e.email === user?.email)
    : null;

  const visibleReviews = isOwner
    ? reviews
    : reviews.filter((r) => employeeRecord && r.employeeId === employeeRecord.id);

  const averageRating = visibleReviews.length > 0
    ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
    : 0;

  // Promedio por barbero (solo vista del dueño)
  const employeeAverages = isOwner
    ? employees.map((employee) => {
        const employeeReviews = reviews.filter((r) => r.employeeId === employee.id);
        const average = employeeReviews.length > 0
          ? employeeReviews.reduce((sum, r) => sum + r.rating, 0) / employeeReviews.length
          : 0;
        return { ...employee, reviewCount: employeeReviews.length, average };
      })
    : [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── Encabezado ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #22262f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          mb: 4,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <StarIcon sx={{ color: '#d4af37', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            {isOwner ? 'Reseñas de Clientes' : 'Mis Reseñas Recibidas'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Rating value={averageRating} precision={0.5} readOnly />
          <Typography variant="body1" color="text.secondary">
            Promedio: <strong>{averageRating.toFixed(1)}/5</strong> ({visibleReviews.length} {visibleReviews.length === 1 ? 'reseña' : 'reseñas'})
          </Typography>
        </Stack>
      </Paper>

      {/* ─── Promedio por barbero (solo dueño) ─── */}
      {isOwner && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {employeeAverages.map((employee) => (
            <Grid item xs={12} sm={6} md={4} key={employee.id}>
              <Paper sx={{ p: 2, borderRadius: 3, background: '#181b20' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {employee.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating value={employee.average} precision={0.5} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {employee.average.toFixed(1)}/5 ({employee.reviewCount})
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ─── Tabla de reseñas (CUU8.1) ─── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Table>
          <TableHead sx={{ background: '#121419' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Servicio</TableCell>
              {isOwner && (
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Barbero</TableCell>
              )}
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Calificación</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Comentario</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isOwner ? 6 : 5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Todavía no hay reseñas para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              visibleReviews.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell>{review.date}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{review.clientName}</TableCell>
                  <TableCell>{review.serviceName}</TableCell>
                  {isOwner && <TableCell>{review.employeeName}</TableCell>}
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Rating value={review.rating} readOnly size="small" />
                      <Chip label={`${review.rating}/5`} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {review.comment || 'Sin comentario.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
