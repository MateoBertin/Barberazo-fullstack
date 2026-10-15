import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  EventBusy as AbsentIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { turnoService } from '../../services/turnoService';
import { empleadoService } from '../../services/empleadoService';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Mapeo de estados de MySQL al frontend
const STATUS_MAP = {
  SOLICITADO: 'Solicitado',
  ASISTIDO: 'Asistido',
  'NO ASISTIDO': 'No-Asistido',
  CANCELADO: 'Cancelado',
  'CANCELADO EMPLEADO': 'Cancelado',
};

// Transforma la respuesta enriquecida de /api/turnos al formato que renderiza la UI
const fromApi = (t) => ({
  id: t.id_turno,
  date: t.fecha,
  time: t.hora,
  dateTime: t.fecha_hora,
  clientId: t.id_cliente,
  clientName: t.cliente_nombre_completo || `${t.cliente_nombre || ''} ${t.cliente_apellido || ''}`.trim(),
  clientEmail: t.cliente_email,
  clientPhone: t.cliente_telefono || 'Sin teléfono',
  clientStrikes: t.cliente_strikes || 0,
  clientStatus: t.cliente_estado || 'ACTIVO',
  employeeId: t.id_empleado,
  employeeName: t.empleado_nombre_completo || `${t.empleado_nombre || ''} ${t.empleado_apellido || ''}`.trim(),
  employeePhone: t.empleado_telefono || 'Sin teléfono',
  employeeSpecialty: t.empleado_especialidad || 'General',
  serviceId: t.id_servicio,
  serviceName: t.servicio_nombre,
  servicePrice: Number(t.servicio_precio) || 0,
  serviceDuration: t.servicio_duracion || 60,
  status: STATUS_MAP[t.estado] || t.estado,
  rawStatus: t.estado,
  cancellationReason: t.motivo_cancelacion,
  cancelledBy: t.cancelado_por,
  createdAt: t.fecha_creacion,
});

export const TurnosManager = ({ mode = null, modo = 'dueno' }) => {
  const currentMode = mode || modo;
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Estados de datos remotos (conectados a MySQL vía api/turnos)
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Estados de filtros
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'upcoming'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Solicitado' | 'Asistido' | 'No-Asistido' | 'Cancelado'
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');

  // Estados para Modal de Detalle (Requisito: Listado con Filtro + Detalle 2)
  const [selectedDetailAppointment, setSelectedDetailAppointment] = useState(null);

  // Estados para diálogo de cancelación por el local (CUU1.6)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Carga inicial y recarga de turnos desde MySQL
  const fetchTurnos = async () => {
    try {
      setLoadError('');
      const data = await turnoService.getAll();
      setAppointments((data || []).map(fromApi));
    } catch (error) {
      setLoadError(error.message || 'Error al cargar los turnos del servidor');
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de empleados para el selector de filtro
  const fetchEmployees = async () => {
    try {
      const data = await empleadoService.getAll();
      setEmployees(
        (data || []).map((e) => ({
          id: e.id_empleado,
          name: `${e.nombre || ''} ${e.apellido || ''}`.trim(),
          email: e.email,
        }))
      );
    } catch (error) {
      console.error('No se pudo cargar la lista de empleados:', error);
    }
  };

  useEffect(() => {
    fetchTurnos();
    fetchEmployees();
  }, []);

  // Si es empleado, prefiltrar por su ID una vez que se carguen los empleados
  const isEmployeeMode = currentMode === 'empleado' || currentMode === 'employee' || user?.rol === 'EMPLEADO';
  useEffect(() => {
    if (isEmployeeMode && employees.length > 0) {
      const currentEmp = employees.find((e) => e.email === user?.email);
      if (currentEmp) {
        setEmployeeFilter(currentEmp.id);
      }
    }
  }, [isEmployeeMode, employees, user]);

  // Filtrado reactivo en memoria
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = appointment.date;
    const appointmentEmployeeId = appointment.employeeId;
    const appointmentClientName = appointment.clientName || '';
    const appointmentStatus = appointment.status;

    // 1. Filtro por fecha
    if (dateFilter === 'today' && appointmentDate !== todayStr) return false;
    if (dateFilter === 'upcoming' && appointmentDate < todayStr) return false;

    // 2. Filtro por estado
    if (statusFilter !== 'all' && appointmentStatus !== statusFilter) return false;

    // 3. Filtro por barbero
    if (employeeFilter !== 'all' && String(appointmentEmployeeId) !== String(employeeFilter)) {
      return false;
    }

    // 4. Filtro por búsqueda de cliente
    if (
      clientSearch.trim() !== '' &&
      !appointmentClientName.toLowerCase().includes(clientSearch.toLowerCase()) &&
      !appointment.clientEmail.toLowerCase().includes(clientSearch.toLowerCase()) &&
      !appointment.clientPhone.includes(clientSearch.trim())
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

  // --- MANEJADORES DE ACCIONES CONTRA MYSQL ---

  // Confirmar Asistencia (CUU1.3)
  const handleConfirmAttendance = async (appointment) => {
    try {
      setIsActionLoading(true);
      await turnoService.updateStatus(appointment.id, 'ASISTIDO');
      enqueueSnackbar(`Asistencia confirmada para ${appointment.clientName}.`, { variant: 'success' });
      await fetchTurnos();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al confirmar asistencia', { variant: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Marcar Inasistencia (CUU1.3) -> Aplica +1 Strike / Multa si llega a 3
  const handleMarkAbsence = async (appointment) => {
    try {
      setIsActionLoading(true);
      const res = await turnoService.updateStatus(appointment.id, 'NO ASISTIDO');
      if (res.multaGenerada) {
        enqueueSnackbar(
          `Inasistencia registrada para ${appointment.clientName}. ¡Alcanzó 3 Strikes! Cuenta multada ($3.000).`,
          { variant: 'error', autoHideDuration: 6000 }
        );
      } else {
        enqueueSnackbar(
          `Inasistencia registrada para ${appointment.clientName}. Se le computó +1 Strike.`,
          { variant: 'warning' }
        );
      }
      await fetchTurnos();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al registrar inasistencia', { variant: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Abrir diálogo de cancelación (CUU1.6)
  const handleOpenCancel = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancellationReason('');
    setIsCancelDialogOpen(true);
  };

  // Confirmar cancelación por parte del local
  const handleConfirmLocalCancellation = async () => {
    if (!appointmentToCancel) return;
    try {
      setIsActionLoading(true);
      await turnoService.updateStatus(
        appointmentToCancel.id,
        'CANCELADO',
        cancellationReason || 'Cancelado por el local'
      );
      setIsCancelDialogOpen(false);
      enqueueSnackbar('Turno cancelado por la barbería.', { variant: 'info' });
      await fetchTurnos();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al cancelar el turno', { variant: 'error' });
    } finally {
      setIsActionLoading(false);
    }
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
      {/* ─── ALERTA DE ERROR SI FALLA EL BACKEND ─── */}
      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={fetchTurnos}>Reintentar</Button>}>
          {loadError}
        </Alert>
      )}

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

      {/* ─── BARRA DE FILTROS (FECHA, ESTADO, BARBERO, CLIENTE) ─── */}
      <Paper sx={{ p: 2.5, borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar cliente, email o teléfono..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Fecha"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <MenuItem value="all">Todas las fechas</MenuItem>
              <MenuItem value="today">Turnos de Hoy</MenuItem>
              <MenuItem value="upcoming">Próximos días</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Todos los estados</MenuItem>
              <MenuItem value="Solicitado">Solicitados</MenuItem>
              <MenuItem value="Asistido">Asistidos</MenuItem>
              <MenuItem value="No-Asistido">No Asistidos</MenuItem>
              <MenuItem value="Cancelado">Cancelados</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
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
                  const appointmentClientContact = appointment.clientPhone !== 'Sin teléfono' ? appointment.clientPhone : appointment.clientEmail;
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
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          {/* Botón Ver Detalle (Requisito CUU Listado + Detalle) */}
                          <Tooltip title="Ver detalle del turno">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedDetailAppointment(appointment)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {appointmentStatus === 'Solicitado' ? (
                            <>
                              <Tooltip title="Confirmar Asistencia">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckIcon />}
                                  disabled={isActionLoading}
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
                                  disabled={isActionLoading}
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
                                  disabled={isActionLoading}
                                  onClick={() => handleOpenCancel(appointment)}
                                >
                                  Cancelar
                                </Button>
                              </Tooltip>
                            </>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                              Finalizado
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* ─── MODAL DE DETALLE DE TURNO (REQUISITO: Listado con Filtro + Detalle 2) ─── */}
      <Dialog
        open={Boolean(selectedDetailAppointment)}
        onClose={() => setSelectedDetailAppointment(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Detalle del Turno #{selectedDetailAppointment?.id}</span>
          <IconButton size="small" onClick={() => setSelectedDetailAppointment(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDetailAppointment && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
                  Estado y Horario
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Fecha y Hora</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {selectedDetailAppointment.date} a las {selectedDetailAppointment.time} hs
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Estado Actual</Typography>
                    <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedDetailAppointment.status)}</Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
                  Información del Cliente
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedDetailAppointment.clientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                    <Typography variant="body2">{selectedDetailAppointment.clientPhone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{selectedDetailAppointment.clientEmail}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Historial de Penalizaciones</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: selectedDetailAppointment.clientStrikes >= 3 ? BRAND_COLORS.danger : BRAND_COLORS.warningAmber,
                      }}
                    >
                      {selectedDetailAppointment.clientStrikes} / 3 Strikes ({selectedDetailAppointment.clientStatus})
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
                  Servicio y Profesional
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Servicio Solicitado</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedDetailAppointment.serviceName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Precio y Duración</Typography>
                    <Typography variant="body2">
                      ${selectedDetailAppointment.servicePrice?.toLocaleString()} • {selectedDetailAppointment.serviceDuration} min
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Barbero Asignado</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedDetailAppointment.employeeName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Especialidad</Typography>
                    <Typography variant="body2">{selectedDetailAppointment.employeeSpecialty}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {selectedDetailAppointment.cancellationReason && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 0.5 }}>
                      Detalle de Cancelación
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{selectedDetailAppointment.cancellationReason}"
                    </Typography>
                    {selectedDetailAppointment.cancelledBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Cancelado por: <strong>{selectedDetailAppointment.cancelledBy}</strong>
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedDetailAppointment(null)} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

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
          <Button onClick={() => setIsCancelDialogOpen(false)} color="inherit" disabled={isActionLoading}>
            Volver
          </Button>
          <Button
            onClick={handleConfirmLocalCancellation}
            color="error"
            variant="contained"
            disabled={isActionLoading}
          >
            {isActionLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
