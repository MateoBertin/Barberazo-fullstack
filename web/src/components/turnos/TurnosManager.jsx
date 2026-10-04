import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  EventBusy as AbsentIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

export const TurnosManager = ({ mode = null, modo = 'dueno' }) => {
  const currentMode = mode || modo;
  const { user } = useAuth();
  const { appointments, employees, updateAppointmentStatus } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados de filtros controlados en inglés (según apuntes de React)
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'upcoming'
  // El empleado ve por defecto su propia agenda. Se lo ubica por email
  // (igual que en Reseñas): el id de Auth es numérico y no coincide
  // con los ids de empleados ('e1', 'e2').
  const isEmployeeMode = currentMode === 'empleado' || currentMode === 'employee';
  const ownEmployeeId = isEmployeeMode
    ? employees.find((e) => e.email === user?.email)?.id || 'all'
    : 'all';
  const [employeeFilter, setEmployeeFilter] = useState(ownEmployeeId);
  const [clientSearch, setClientSearch] = useState('');

  // Estados para diálogo de cancelación por el local (CUU1.6)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtrado de turnos
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = appointment.date;
    const appointmentEmployeeId = appointment.employeeId;
    const appointmentClientName = appointment.clientName || '';

    // 1. Filtro por fecha
    if (dateFilter === 'today' && appointmentDate !== todayStr) return false;
    if (dateFilter === 'upcoming' && appointmentDate < todayStr) return false;

    // 2. Filtro por empleado
    if (employeeFilter !== 'all' && String(appointmentEmployeeId) !== String(employeeFilter)) {
      return false;
    }

    // 3. Filtro por búsqueda de cliente
    if (
      clientSearch.trim() !== '' &&
      !appointmentClientName.toLowerCase().includes(clientSearch.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Estadísticas rápidas para los indicadores superiores
  const stats = {
    requested: appointments.filter((a) => a.status === 'Solicitado').length,
    attended: appointments.filter((a) => a.status === 'Asistido').length,
    absent: appointments.filter((a) => a.status === 'No-Asistido').length,
    cancelled: appointments.filter((a) => a.status === 'Cancelado').length,
  };

  // --- MANEJADORES DE ACCIONES EN INGLÉS ---

  // Confirmar Asistencia (CUU1.3)
  const handleConfirmAttendance = (appointment) => {
    updateAppointmentStatus(appointment.id, 'Asistido');
    enqueueSnackbar(
      `Asistencia confirmada para ${appointment.clientName}.`,
      { variant: 'success' }
    );
  };

  // Marcar Inasistencia (CUU1.3) -> Aplica +1 Strike
  const handleMarkAbsence = (appointment) => {
    updateAppointmentStatus(appointment.id, 'No-Asistido');
    enqueueSnackbar(
      `Inasistencia registrada para ${appointment.clientName}. Se le computó +1 Strike.`,
      { variant: 'warning' }
    );
  };

  // Abrir diálogo de cancelación (CUU1.6)
  const handleOpenCancel = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancellationReason('');
    setIsCancelDialogOpen(true);
  };

  // Confirmar cancelación por parte del local
  const handleConfirmLocalCancellation = () => {
    if (!appointmentToCancel) return;
    updateAppointmentStatus(
      appointmentToCancel.id,
      'Cancelado',
      cancellationReason || 'Cancelado por el local'
    );
    setIsCancelDialogOpen(false);
    enqueueSnackbar('Turno cancelado por la barbería.', { variant: 'info' });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Solicitado':
        return <Chip label="Solicitado" color="primary" size="small" sx={{ fontWeight: 700 }} />;
      case 'Asistido':
        return <Chip label="Asistido" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'No-Asistido':
        return <Chip label="No Asistió" color="error" size="small" sx={{ fontWeight: 700 }} />;
      case 'Cancelado':
        return <Chip label="Cancelado" color="default" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      {/* ─── TARJETAS DE RESUMEN / ESTADÍSTICAS ─── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: BRAND_COLORS.darkPanel, border: `1px solid ${withAlpha(BRAND_COLORS.infoBlue, 0.3)}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                Turnos Pendientes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' }, color: BRAND_COLORS.infoBlue }}>
                {stats.requested}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: BRAND_COLORS.darkPanel, border: `1px solid ${withAlpha(BRAND_COLORS.successGreen, 0.3)}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                Asistidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' }, color: BRAND_COLORS.successGreen }}>
                {stats.attended}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: BRAND_COLORS.darkPanel, border: `1px solid ${withAlpha(BRAND_COLORS.danger, 0.3)}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                Inasistencias
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' }, color: BRAND_COLORS.danger }}>
                {stats.absent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ background: BRAND_COLORS.darkPanel, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.1)}` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                Cancelados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' }, color: BRAND_COLORS.mutedGray }}>
                {stats.cancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── BARRA DE FILTROS ─── */}
      <Paper sx={{ p: 2.5, borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre de cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
              }}
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Fecha"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los turnos</MenuItem>
              <MenuItem value="today">Turnos de Hoy</MenuItem>
              <MenuItem value="upcoming">Próximos días</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Barbero"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los barberos</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── TABLA DE GESTIÓN DE TURNOS ─── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
        <Table>
          <TableHead sx={{ background: BRAND_COLORS.darkPanel }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Fecha & Hora</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Servicio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Barbero</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No se encontraron turnos con los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => {
                const appointmentDate = appointment.date;
                const appointmentTime = appointment.time;
                const appointmentClientName = appointment.clientName;
                const appointmentClientContact = appointment.clientPhone || appointment.clientEmail;
                const appointmentServiceName = appointment.serviceName;
                const appointmentServicePrice = appointment.servicePrice;
                const appointmentServiceDuration = appointment.serviceDuration;
                const appointmentEmployeeName = appointment.employeeName;
                const appointmentStatus = appointment.status;
                const cancellationNote = appointment.cancellationReason;

                return (
                  <TableRow key={appointment.id} hover sx={{ '&:hover': { background: withAlpha(BRAND_COLORS.white, 0.02) } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {appointmentDate}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointmentTime} hs
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {appointmentClientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointmentClientContact}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{appointmentServiceName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${appointmentServicePrice?.toLocaleString()} • {appointmentServiceDuration} min
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{appointmentEmployeeName}</Typography>
                    </TableCell>

                    <TableCell>
                      {getStatusChip(appointmentStatus)}
                      {cancellationNote && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {cancellationNote}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {appointmentStatus === 'Solicitado' ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Confirmar Asistencia">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleConfirmAttendance(appointment)}
                            >
                              Asistió
                            </Button>
                          </Tooltip>

                          <Tooltip title="Marcar Inasistencia (+1 Strike)">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<AbsentIcon />}
                              onClick={() => handleMarkAbsence(appointment)}
                            >
                              No Asistió
                            </Button>
                          </Tooltip>

                          <Tooltip title="Cancelar por el local">
                            <Button
                              size="small"
                              variant="text"
                              color="inherit"
                              onClick={() => handleOpenCancel(appointment)}
                            >
                              Cancelar
                            </Button>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Finalizado
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── MODAL DE CANCELACIÓN POR EL LOCAL (CUU1.6) ─── */}
      <Dialog open={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancelar Turno (Barbería)</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Indica el motivo de cancelación para el turno de{' '}
            <strong>{appointmentToCancel?.clientName}</strong> del día{' '}
            <strong>{appointmentToCancel?.date}</strong> a las{' '}
            <strong>{appointmentToCancel?.time} hs</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Motivo de cancelación (opcional)"
            placeholder="Ej: Ausencia de barbero por fuerza mayor, corte de luz..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsCancelDialogOpen(false)} color="inherit">
            Volver
          </Button>
          <Button onClick={handleConfirmLocalCancellation} color="error" variant="contained">
            Confirmar Cancelación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
