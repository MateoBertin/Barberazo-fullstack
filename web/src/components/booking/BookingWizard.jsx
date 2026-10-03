import React, { useState } from 'react';
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
import { useSnackbar } from 'notistack';

// Franjas horarias de 1 hora para los turnos de atención
// Regla de negocio: todos los turnos duran 1 hora y empiezan en punto
const AVAILABLE_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

const STEPS = ['Servicio', 'Fecha', 'Barbero', 'Horario', 'Confirmación'];

export const BookingWizard = () => {
  const { user } = useAuth();
  const { services, employees, workingDays, appointments, addAppointment, cancelClientAppointment } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados del asistente (formulario controlado en inglés según apuntes de React)
  const [activeStep, setActiveStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // null significa "Cualquiera disponible"
  const [selectedTime, setSelectedTime] = useState(null);

  // Estado para el modal de confirmación de cancelación
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // 1. Verificar si el usuario actual ya tiene un turno activo ('Solicitado')
  const activeAppointment = appointments.find(
    (a) => String(a.clientId) === String(user?.id) && a.status === 'Solicitado'
  );

  // Filtrar solo los servicios habilitados
  const enabledServices = services.filter((s) => s.status === 'Habilitado');

  // Filtrar solo los días habilitados a partir de hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const availableDays = (workingDays || []).filter(
    (d) => d.status === 'Habilitado' && d.date >= todayStr
  ).slice(0, 14);

  // Filtrar solo empleados activos
  const activeEmployees = employees.filter((e) => e.status === 'Activo');

  // Horarios ocupados para la fecha seleccionada y el barbero seleccionado
  const selectedDateStr = selectedDate?.date;

  // Slots del día seleccionado según su horario (turnos de 1 hora en punto)
  // Solo se ofrecen los horarios entre el inicio y el fin del día (el fin es exclusivo:
  // un día de 09:00 a 13:00 ofrece 09, 10, 11 y 12)
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

  // --- MANEJADORES DE EVENTOS EN INGLÉS ---

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

  // Confirmar y registrar el turno (CUU1.2)
  const handleConfirmBooking = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      enqueueSnackbar('Por favor completa todos los pasos para reservar.', { variant: 'warning' });
      return;
    }

    const assignedEmployee = selectedEmployee || activeEmployees[0];

    const newAppointment = {
      clientId: user.id,
      clientName: user.name || user.nombre,
      clientEmail: user.email,
      clientPhone: user.phone || user.telefono || 'Sin teléfono',
      employeeId: assignedEmployee ? assignedEmployee.id : 'e1',
      employeeName: assignedEmployee ? assignedEmployee.name : 'Barbero de Turno',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.durationMinutes,
      date: selectedDate.date,
      time: selectedTime,
    };

    try {
      addAppointment(newAppointment);
      enqueueSnackbar('¡Turno reservado con éxito!', { variant: 'success' });
      handleResetForm();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  // Cancelar el turno activo del cliente (CUU1.5)
  const handleConfirmCancelAppointment = () => {
    if (!activeAppointment) return;

    const result = cancelClientAppointment(activeAppointment.id, 'Cancelado por el cliente desde su panel');
    setIsCancelDialogOpen(false);

    if (result && result.isLessThan24Hours) {
      enqueueSnackbar('Turno cancelado con menos de 24 hs de anticipación. Se te aplicó +1 Strike.', {
        variant: 'warning',
      });
    } else {
      enqueueSnackbar('Turno cancelado correctamente sin penalización.', { variant: 'info' });
    }
  };

  // ─── CASO 1: CLIENTE BLOQUEADO O MULTADO ───
  if (user?.estado === 'Bloqueado') {
    return (
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, background: '#1e2229', border: '1px solid #ef4444' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CancelIcon sx={{ color: '#ef4444', fontSize: 40 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>
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

  if (user?.estado === 'Multado') {
    return (
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, background: '#1e2229', border: '1px solid #f59e0b' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WarningIcon sx={{ color: '#f59e0b', fontSize: 40 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
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

  // ─── CASO 2: CLIENTE YA TIENE TURNO ACTIVO ('Solicitado') ───
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
            background: 'linear-gradient(135deg, #181b20 0%, #20252e 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#d4af37' }}>
              Tu Turno Agendado
            </Typography>
            <Chip label="Turno Activo" color="success" sx={{ fontWeight: 700 }} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Recuerda que según las reglas de la barbería, solo puedes tener 1 turno activo a la vez.
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Servicio
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {activeAppointment.serviceName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                  ${activeAppointment.servicePrice?.toLocaleString()} (
                  {activeAppointment.serviceDuration} min)
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {activeAppointment.date}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Horario
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {activeAppointment.time} hs
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Barbero Asignado
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {activeAppointment.employeeName}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Alert severity={cancelWithPenalty ? 'warning' : 'info'} sx={{ flexGrow: 1 }}>
              {cancelWithPenalty
                ? 'Atención: Si cancelas ahora faltan menos de 24 hs, por lo que se te aplicará 1 Strike.'
                : 'Faltan más de 24 hs para tu turno. Puedes cancelarlo libremente sin penalidad.'}
            </Alert>

            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setIsCancelDialogOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Cancelar Turno
            </Button>
          </Stack>
        </Paper>

        {/* Modal de confirmación de cancelación */}
        <Dialog open={isCancelDialogOpen} onClose={() => setIsCancelDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>¿Deseas cancelar tu turno?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'text.secondary', mb: 2 }}>
              {cancelWithPenalty
                ? 'Estás cancelando con menos de 24 horas de antelación. Esto sumará +1 Strike a tu cuenta. Con 3 strikes tu cuenta quedará multada.'
                : '¿Estás seguro de que deseas cancelar tu turno? Al faltar más de 24 hs no recibirás ninguna penalidad.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsCancelDialogOpen(false)} color="inherit">
              Volver
            </Button>
            <Button onClick={handleConfirmCancelAppointment} color="error" variant="contained">
              Sí, Cancelar Turno
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
        background: '#181b20',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#d4af37' }}>
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
                      background: isSelected ? 'rgba(212, 175, 55, 0.12)' : '#1e2229',
                      border: isSelected ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectService(service)} sx={{ p: 2, height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <ScissorsIcon sx={{ color: '#d4af37' }} />
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
            Atención disponible de Martes a Sábado (próximos días habilitados):
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
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : '#1e2229',
                      border: isSelected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'center',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectDate(day)} sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>
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
                  background: selectedEmployee === null ? 'rgba(59, 130, 246, 0.15)' : '#1e2229',
                  border: selectedEmployee === null ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                  height: '100%',
                }}
              >
                <CardActionArea onClick={() => handleSelectEmployee(null)} sx={{ p: 2.5, height: '100%' }}>
                  <Avatar sx={{ bgcolor: '#3b82f6', mb: 1 }}>✨</Avatar>
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
                      background: isSelected ? 'rgba(212, 175, 55, 0.15)' : '#1e2229',
                      border: isSelected ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.06)',
                      height: '100%',
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectEmployee(employee)} sx={{ p: 2.5, height: '100%' }}>
                      <Avatar sx={{ bgcolor: '#d4af37', color: '#121212', fontWeight: 'bold', mb: 1 }}>
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

          <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, mb: 3 }}>
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
            <strong>Recordatorio de Cancelación:</strong> Si necesitas cancelar, hazlo con más de 24 hs de anticipación para no acumular strikes en tu cuenta.
          </Alert>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleConfirmBooking}
            startIcon={<CheckIcon />}
            sx={{ py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
          >
            Confirmar Reserva de Turno
          </Button>
        </Box>
      )}

      {/* Controles de Navegación de Pasos (Atrás / Siguiente) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Button
          disabled={activeStep === 0}
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
              (activeStep === 3 && !selectedTime)
            }
          >
            Siguiente
          </Button>
        )}
      </Box>
    </Paper>
  );
};
