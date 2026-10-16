import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardActionArea,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Stack,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ContentCut as ScissorsIcon,
  CheckCircle as CheckIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { turnoService } from '../../services/turnoService';
import { servicioService } from '../../services/servicioService';
import { empleadoService } from '../../services/empleadoService';
import { fechaService } from '../../services/fechaService';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Franjas horarias estándar de 1 hora para los turnos de atención
// Regla de negocio: todos los turnos duran 1 hora y empiezan en punto (xx:00)
const AVAILABLE_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

const STEPS = ['Servicio', 'Fecha', 'Barbero', 'Horario', 'Confirmación'];

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const BookingWizard = () => {
  const { user } = useAuth();
  const contextData = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados remotos cargados desde el backend
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del asistente (formulario controlado en 5 pasos)
  const [activeStep, setActiveStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // null significa "Cualquiera disponible"
  const [selectedTime, setSelectedTime] = useState(null);

  // Estado para el modal de confirmación de cancelación
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Carga remota de datos desde el backend
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Cargar servicios (Pedro) con fallback a contextData
      try {
        const srvData = await servicioService.getAll();
        setServices(
          (srvData || []).map((s) => ({
            id: s.id_servicio || s.id,
            name: s.nombre || s.name,
            price: Number(s.precio ?? s.price) || 0,
            durationMinutes: s.duracion_minutos || s.durationMinutes || 60,
            description: s.descripcion || s.description || '',
            status: s.estado === 'DESHABILITADO' ? 'Deshabilitado' : 'Habilitado',
          }))
        );
      } catch {
        setServices(contextData.services || []);
      }

      // 2. Cargar empleados (Mateo) con fallback a contextData
      try {
        const empData = await empleadoService.getAll();
        setEmployees(
          (empData || []).map((e) => ({
            id: e.id_empleado || e.id,
            name: `${e.nombre || ''} ${e.apellido || ''}`.trim() || e.name,
            specialties: e.especialidades || (e.especialidad ? e.especialidad.split(', ') : []),
            status: e.estado === 'INACTIVO' ? 'Inactivo' : 'Activo',
            email: e.email,
          }))
        );
      } catch {
        setEmployees(contextData.employees || []);
      }

      // 3. Cargar días habilitados con fallback a contextData
      try {
        const fechaData = await fechaService.getAll();
        if (fechaData && fechaData.length > 0) {
          setWorkingDays(
            fechaData.map((d) => {
              const dateObj = new Date(`${d.fecha || d.date}T00:00:00`);
              const dayOfWeek = DAY_NAMES_ES[dateObj.getDay()];
              return {
                id: d.id_dia_trabajo || d.id || `wd_${d.fecha}`,
                date: d.fecha || d.date,
                dayOfWeek,
                startTime: (d.hora_inicio || d.startTime || '08:00').substring(0, 5),
                endTime: (d.hora_fin || d.endTime || '20:00').substring(0, 5),
                status: d.estado === 'DESHABILITADO' ? 'Deshabilitado' : 'Habilitado',
              };
            })
          );
        } else {
          setWorkingDays(contextData.workingDays || []);
        }
      } catch {
        setWorkingDays(contextData.workingDays || []);
      }

      // 4. Cargar turnos desde MySQL (/api/turnos)
      try {
        const turnosData = await turnoService.getAll();
        setAppointments(
          (turnosData || []).map((t) => ({
            id: t.id_turno || t.id,
            clientId: t.id_cliente || t.clientId,
            clientName: t.cliente_nombre_completo || t.clientName,
            clientEmail: t.cliente_email || t.clientEmail,
            employeeId: t.id_empleado || t.employeeId,
            employeeName: t.empleado_nombre_completo || t.employeeName,
            serviceId: t.id_servicio || t.serviceId,
            serviceName: t.servicio_nombre || t.serviceName,
            servicePrice: Number(t.servicio_precio ?? t.servicePrice) || 0,
            serviceDuration: t.servicio_duracion || t.serviceDuration || 60,
            date: t.fecha || t.date,
            time: (t.hora || t.time || '').substring(0, 5),
            status: t.estado === 'SOLICITADO' ? 'Solicitado' : t.estado,
          }))
        );
      } catch {
        setAppointments(contextData.appointments || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Verificar si el usuario actual ya tiene un turno activo ('Solicitado')
  const activeAppointment = appointments.find(
    (a) =>
      a.status === 'Solicitado' &&
      (String(a.clientId) === String(user?.id) ||
        String(a.clientId) === String(user?.id_cliente) ||
        a.clientEmail === user?.email)
  );

  // Filtrar solo los servicios habilitados
  const enabledServices = services.filter((s) => s.status === 'Habilitado');

  // Filtrar solo los días habilitados a partir de hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const availableDays = (workingDays || [])
    .filter((d) => d.status === 'Habilitado' && d.date >= todayStr)
    .slice(0, 14);

  // Filtrar solo empleados activos
  const activeEmployees = employees.filter((e) => e.status === 'Activo');

  // Horarios ocupados para la fecha seleccionada y el barbero seleccionado
  const selectedDateStr = selectedDate?.date;

  const dayTimeSlots = !selectedDateStr
    ? []
    : AVAILABLE_TIME_SLOTS.filter((slot) => {
      const dayStart = selectedDate?.startTime || '08:00';
      const dayEnd = selectedDate?.endTime || '20:00';
      return slot >= dayStart && slot < dayEnd;
    });

  const occupiedTimeSlots = appointments
    .filter(
      (a) =>
        a.date === selectedDateStr &&
        a.status === 'Solicitado' &&
        (!selectedEmployee || a.employeeId === selectedEmployee.id)
    )
    .map((a) => a.time);

  // --- MANEJADORES DE EVENTOS ---

  const handleSelectService = (service) => {
    setSelectedService(service);
    setActiveStep(1);
  };

  const handleSelectDate = (day) => {
    setSelectedDate(day);
    setActiveStep(2);
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setActiveStep(3);
  };

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    setActiveStep(4);
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleResetForm = () => {
    setActiveStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedEmployee(null);
    setSelectedTime(null);
  };

  // Confirmar y registrar el turno contra MySQL (CUU1.2 - RN05 y RN06)
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      enqueueSnackbar('Por favor completa todos los pasos para reservar.', { variant: 'warning' });
      return;
    }

    const assignedEmployee = selectedEmployee || activeEmployees[0];
    if (!assignedEmployee) {
      enqueueSnackbar('No hay barberos disponibles en este momento.', { variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      await turnoService.create({
        id_servicio: selectedService.id,
        id_empleado: assignedEmployee.id,
        fecha: selectedDate.date,
        hora: selectedTime,
      });

      enqueueSnackbar('¡Turno reservado con éxito!', { variant: 'success' });
      handleResetForm();
      await loadData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al reservar el turno', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancelar el turno activo del cliente contra MySQL (CUU1.5 - RN13)
  const handleConfirmCancelAppointment = async () => {
    if (!activeAppointment) return;

    try {
      setIsSubmitting(true);
      const res = await turnoService.updateStatus(
        activeAppointment.id,
        'CANCELADO',
        'Cancelado por el cliente desde su panel'
      );
      setIsCancelDialogOpen(false);

      if (res && res.strikeSumado) {
        enqueueSnackbar('Turno cancelado con menos de 24 hs de anticipación. Se te aplicó +1 Strike.', {
          variant: 'warning',
          autoHideDuration: 6000,
        });
      } else {
        enqueueSnackbar('Turno cancelado correctamente sin penalización.', { variant: 'info' });
      }

      await loadData();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al cancelar el turno', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ─── CASO 1: CLIENTE BLOQUEADO O MULTADO ───
  if (user?.estado === 'Bloqueado' || user?.estado === 'BLOQUEADO') {
    return (
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, background: BRAND_COLORS.darkPanel, border: `1px solid ${BRAND_COLORS.danger}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CancelIcon sx={{ color: BRAND_COLORS.danger, fontSize: 40 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.danger }}>
              Cuenta Bloqueada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta se encuentra bloqueada por la administración. No puedes solicitar nuevos turnos.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  if (user?.estado === 'Multado' || user?.estado === 'MULTADO') {
    return (
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, background: BRAND_COLORS.darkPanel, border: `1px solid ${BRAND_COLORS.warningAmber}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WarningIcon sx={{ color: BRAND_COLORS.warningAmber, fontSize: 40 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.warningAmber }}>
              Cuenta Multada por Acumulación de Strikes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tienes 3 strikes acumulados. Para volver a reservar turnos, debes regularizar el pago de la multa pendiente.
            </Typography>
            <Button variant="contained" color="warning" href="/cliente/multas">
              Ir a Pagar Multa con Mercado Pago
            </Button>
          </Box>
        </Stack>
      </Paper>
    );
  }

  // ─── CASO 2: CLIENTE YA TIENE TURNO ACTIVO ('Solicitado' - RN06) ───
  if (activeAppointment) {
    const appointmentDateStr = activeAppointment.date;
    const appointmentTimeStr = activeAppointment.time || '10:00';
    const appointmentDateTime = new Date(`${appointmentDateStr}T${appointmentTimeStr}:00`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const cancelWithPenalty = diffHours < 24;

    return (
      <Box>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.steelTint} 100%)`,
            border: `1px solid ${withAlpha(BRAND_COLORS.gold, 0.4)}`,
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND_COLORS.gold }}>
              Tu Turno Agendado
            </Typography>
            <Chip label="Turno Activo" color="success" sx={{ fontWeight: 700 }} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Recuerda que según las reglas de la barbería (**Regla RN06**), solo puedes tener 1 turno activo a la vez.
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Servicio
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_COLORS.white }}>
                  {activeAppointment.serviceName}
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.successGreen, fontWeight: 600 }}>
                  ${activeAppointment.servicePrice?.toLocaleString()} ({activeAppointment.serviceDuration} min)
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_COLORS.white }}>
                  {activeAppointment.date}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Horario
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_COLORS.white }}>
                  {activeAppointment.time} hs
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Barbero Asignado
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: BRAND_COLORS.white }}>
                  {activeAppointment.employeeName}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Alert severity={cancelWithPenalty ? 'warning' : 'info'} sx={{ flexGrow: 1 }}>
              {cancelWithPenalty
                ? 'Atención: Si cancelas ahora faltan menos de 24 hs, por lo que se te aplicará 1 Strike (Regla RN13).'
                : 'Faltan más de 24 hs para tu turno. Puedes cancelarlo libremente sin penalidad.'}
            </Alert>

            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              disabled={isSubmitting}
              onClick={() => setIsCancelDialogOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Cancelar Turno
            </Button>
          </Stack>
        </Paper>

        {/* Modal de confirmación de cancelación */}
        <Dialog open={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700, color: BRAND_COLORS.danger }}>¿Deseas cancelar tu turno?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
              {cancelWithPenalty
                ? 'Estás cancelando con menos de 24 horas de antelación. Esto sumará +1 Strike a tu cuenta. Con 3 strikes tu cuenta quedará multada.'
                : '¿Estás seguro de que deseas cancelar tu turno? Al faltar más de 24 hs no recibirás ninguna penalidad.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsCancelDialogOpen(false)} color="inherit" disabled={isSubmitting}>
              Volver
            </Button>
            <Button onClick={handleConfirmCancelAppointment} color="error" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Cancelando...' : 'Sí, Cancelar Turno'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ─── CASO 3: ASISTENTE DE RESERVA (BOOKING WIZARD) ───
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: 4,
        background: BRAND_COLORS.card,
        border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: BRAND_COLORS.gold }}>
        Reservar Nuevo Turno
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Selecciona el servicio, fecha, barbero y horario que mejor se adapte a tu día.
      </Typography>

      {/* Stepper visual de pasos */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ─── PASO 0: SELECCIÓN DE SERVICIO ─── */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            1. Elige tu Servicio
          </Typography>
          <Grid container spacing={2}>
            {enabledServices.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card
                    sx={{
                      height: '100%',
                      background: isSelected ? withAlpha(BRAND_COLORS.gold, 0.12) : BRAND_COLORS.darkPanel,
                      border: isSelected ? `2px solid ${BRAND_COLORS.gold}` : `1px solid ${withAlpha(BRAND_COLORS.white, 0.06)}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectService(service)} sx={{ p: 2, height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <ScissorsIcon sx={{ color: BRAND_COLORS.gold }} />
                        <Chip
                          label={`$${service.price?.toLocaleString()}`}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {service.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        ⏱ Duración: {service.durationMinutes} minutos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* ─── PASO 1: SELECCIÓN DE FECHA ─── */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            2. Selecciona la Fecha
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Atención disponible según calendario oficial:
          </Typography>
          <Grid container spacing={1.5}>
            {availableDays.map((day) => {
              const dayDate = day.date;
              const dayOfWeek = day.dayOfWeek;
              const startTime = day.startTime;
              const endTime = day.endTime;
              const isSelected = selectedDateStr === dayDate;
              return (
                <Grid item xs={6} sm={4} md={3} key={day.id}>
                  <Card
                    sx={{
                      background: isSelected ? withAlpha(BRAND_COLORS.successGreen, 0.15) : BRAND_COLORS.darkPanel,
                      border: isSelected ? `2px solid ${BRAND_COLORS.successGreen}` : `1px solid ${withAlpha(BRAND_COLORS.white, 0.06)}`,
                      textAlign: 'center',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectDate(day)} sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: BRAND_COLORS.gold, fontWeight: 700, textTransform: 'uppercase' }}>
                        {dayOfWeek}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {dayDate.split('-')[2]} / {dayDate.split('-')[1]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {startTime} - {endTime} hs
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* ─── PASO 2: SELECCIÓN DE BARBERO ─── */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            3. Selecciona tu Barbero Preferido
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Puedes elegir a tu profesional favorito o elegir "Cualquier empleado disponible":
          </Typography>

          <Grid container spacing={2}>
            {/* Opción 1: Sin preferencia / Cualquiera */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  background: selectedEmployee === null ? withAlpha(BRAND_COLORS.infoBlue, 0.15) : BRAND_COLORS.darkPanel,
                  border: selectedEmployee === null ? `2px solid ${BRAND_COLORS.infoBlue}` : `1px solid ${withAlpha(BRAND_COLORS.white, 0.06)}`,
                  height: '100%',
                }}
              >
                <CardActionArea onClick={() => handleSelectEmployee(null)} sx={{ p: 2.5, height: '100%' }}>
                  <Avatar sx={{ bgcolor: BRAND_COLORS.infoBlue, mb: 1 }}>✨</Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Cualquier Barbero Disponible
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ideal para conseguir el horario más conveniente sin esperar a un barbero en particular.
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Barberos específicos */}
            {activeEmployees.map((employee) => {
              const isSelected = selectedEmployee?.id === employee.id;
              const employeeName = employee.name;
              const employeeSpecialties = employee.specialties;
              return (
                <Grid item xs={12} sm={6} md={4} key={employee.id}>
                  <Card
                    sx={{
                      background: isSelected ? withAlpha(BRAND_COLORS.gold, 0.15) : BRAND_COLORS.darkPanel,
                      border: isSelected ? `2px solid ${BRAND_COLORS.gold}` : `1px solid ${withAlpha(BRAND_COLORS.white, 0.06)}`,
                      height: '100%',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectEmployee(employee)} sx={{ p: 2.5, height: '100%' }}>
                      <Avatar sx={{ bgcolor: BRAND_COLORS.gold, color: BRAND_COLORS.ink, fontWeight: 'bold', mb: 1 }}>
                        {employeeName.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Especialidades: {employeeSpecialties?.join(', ') || 'Corte general'}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* ─── PASO 3: SELECCIÓN DE HORARIO ─── */}
      {activeStep === 3 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            4. Elige el Horario
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Día seleccionado: <strong>{selectedDate?.dayOfWeek} {selectedDateStr}</strong>
            {selectedEmployee ? ` con ${selectedEmployee.name}` : ' (Cualquier barbero)'}
            {' '}({selectedDate?.startTime} a {selectedDate?.endTime} hs)
          </Typography>

          <Grid container spacing={1.5}>
            {dayTimeSlots.map((slot) => {
              const isOccupied = occupiedTimeSlots.includes(slot);
              const isSelected = selectedTime === slot;

              return (
                <Grid item xs={4} sm={3} md={2} key={slot}>
                  <Button
                    fullWidth
                    variant={isSelected ? 'contained' : 'outlined'}
                    color={isSelected ? 'primary' : 'inherit'}
                    disabled={isOccupied}
                    onClick={() => handleSelectTime(slot)}
                    sx={{
                      py: 1.2,
                      fontWeight: 700,
                      opacity: isOccupied ? 0.35 : 1,
                    }}
                  >
                    {slot} {isOccupied && '🚫'}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* ─── PASO 4: CONFIRMACIÓN Y RESUMEN ─── */}
      {activeStep === 4 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            5. Revisa y Confirma tu Reserva
          </Typography>

          <Paper sx={{ p: 3, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Servicio
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {selectedService?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duración: {selectedService?.durationMinutes} min — Precio: ${selectedService?.price?.toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Fecha y Hora
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {selectedDate?.dayOfWeek}, {selectedDateStr} a las {selectedTime} hs
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Barbero
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {selectedEmployee ? selectedEmployee.name : 'Cualquier barbero disponible (Asignación automática)'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {user?.name || user?.nombre} ({user?.email})
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Recordatorio de Cancelación:</strong> Si necesitas cancelar, hazlo con más de 24 hs de anticipación para no acumular strikes en tu cuenta (Regla RN13).
          </Alert>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={isSubmitting}
            onClick={handleConfirmBooking}
            startIcon={<CheckIcon />}
            sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
          >
            {isSubmitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Turno'}
          </Button>
        </Box>
      )}

      {/* Controles de Navegación de Pasos (Atrás / Siguiente) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
        <Button
          disabled={activeStep === 0 || isSubmitting}
          onClick={handleBack}
          startIcon={<BackIcon />}
          color="inherit"
        >
          Atrás
        </Button>

        {activeStep < 4 && (
          <Button
            variant="contained"
            color="inherit"
            onClick={handleNext}
            endIcon={<NextIcon />}
            disabled={
              (activeStep === 0 && !selectedService) ||
              (activeStep === 1 && !selectedDate) ||
              (activeStep === 3 && !selectedTime) ||
              isSubmitting
            }
          >
            Siguiente
          </Button>
        )}
      </Box>
    </Paper>
  );
};
