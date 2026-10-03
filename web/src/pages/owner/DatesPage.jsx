import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  IconButton,
  Stack,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  EventBusy as EventBusyIcon,
  EventAvailable as EventAvailableIcon,
  AccessTime as TimeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Opciones horarias en punto para el horario del día
// Regla de negocio: turnos de 1 hora, el día arranca y termina en hora exacta (xx:00)
const HOUR_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const isOnTheHour = (time) => HOUR_OPTIONS.includes(time);

// Determina el color y estilo de cada celda del calendario
// Usa los tokens centrales de marca (ver theme.js): mismo visual, sin hex duplicados
const getDayCellStyles = (dayInfo, isSelected) => {
  if (!dayInfo) return {};

  if (!dayInfo.isWorkday || dayInfo.isPast) {
    return {
      bg: withAlpha(BRAND_COLORS.white, 0.02),
      color: withAlpha(BRAND_COLORS.white, 0.12),
      cursor: 'default',
      border: '1px solid transparent',
      hoverFilter: 'none',
      hoverScale: 1,
    };
  }

  const dayStatus = dayInfo.dayData?.status;
  const isEnabled = !dayInfo.dayData || dayStatus === 'Habilitado';
  const accent = isEnabled ? BRAND_COLORS.brightGreen : BRAND_COLORS.danger;

  return {
    bg: isSelected
      ? withAlpha(accent, isEnabled ? 0.28 : 0.22)
      : withAlpha(accent, isEnabled ? 0.06 : 0.05),
    color: accent,
    cursor: 'pointer',
    border: isSelected
      ? `2px solid ${accent}`
      : `1px solid ${withAlpha(accent, isEnabled ? 0.25 : 0.22)}`,
    hoverFilter: 'brightness(1.25)',
    hoverScale: 1.06,
  };
};

export const DatesPage = () => {
  const { workingDays, toggleDayStatus, updateDaySchedule } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Hoy sin hora para comparaciones de fechas
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    [today]
  );

  // Mes visualizado (navegar entre mes actual y mes actual+2)
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const canGoBack = viewDate > minMonth;
  const canGoForward = viewDate < maxMonth;

  const handlePrevMonth = () => {
    if (canGoBack)
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    if (canGoForward)
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Día seleccionado para el panel lateral
  const [selectedDay, setSelectedDay] = useState(null);

  // Diálogo de confirmación de deshabilitación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Edición de horario del día
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ startTime: '08:00', endTime: '20:00' });

  // Construye la grilla del mes activo
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Dom…6=Sáb
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];

    // Celdas vacías iniciales para alinear el primer día
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay(); // 0=Dom, 1=Lun
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isWorkday = dow !== 0 && dow !== 1;
      const isPast = date < today;
      const dayData = workingDays.find((day) => day.date === dateStr) || null;

      grid.push({ day: d, date, dateStr, dow, isWorkday, isPast, dayData, isToday: dateStr === todayStr });
    }

    return grid;
  }, [viewDate, workingDays, today, todayStr]);

  // Estadísticas del mes visualizado
  const stats = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthDays = workingDays.filter((day) => {
      const d = new Date(day.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      enabledCount: monthDays.filter((d) => d.status === 'Habilitado').length,
      disabledCount: monthDays.filter((d) => d.status === 'Deshabilitado').length,
      totalCount: monthDays.length,
    };
  }, [viewDate, workingDays]);

  // Actualiza el selectedDay con los datos más recientes de workingDays
  const refreshSelectedDay = (dateStr) => {
    const dayData = workingDays.find((day) => day.date === dateStr) || null;
    setSelectedDay((prev) => (prev ? { ...prev, dayData } : null));
  };

  // Clic sobre un día del calendario
  const handleDayClick = (dayInfo) => {
    if (!dayInfo.isWorkday || dayInfo.isPast) return;
    setSelectedDay(dayInfo);
    setIsEditingSchedule(false);
  };

  // Habilitar / iniciar flujo de deshabilitar
  const handleToggleDayStatus = () => {
    if (!selectedDay) return;
    const currentStatus = selectedDay.dayData?.status || 'Habilitado';
    if (currentStatus === 'Habilitado') {
      setIsConfirmOpen(true); // CUU6.2: pide confirmación antes de deshabilitar
    } else {
      // CUU6.1: habilitar directamente
      toggleDayStatus(selectedDay.dateStr);
      enqueueSnackbar(
        `Fecha ${selectedDay.dateStr} habilitada correctamente.`,
        { variant: 'success' }
      );
      refreshSelectedDay(selectedDay.dateStr);
    }
  };

  // Confirmar deshabilitación (CUU6.2)
  const handleConfirmDisableDay = () => {
    toggleDayStatus(selectedDay.dateStr);
    enqueueSnackbar(
      `Fecha ${selectedDay.dateStr} deshabilitada.`,
      { variant: 'warning' }
    );
    setIsConfirmOpen(false);
    refreshSelectedDay(selectedDay.dateStr);
  };

  // Guardar horario editado (solo horas en punto: turnos de 1 hora)
  const handleSaveDaySchedule = () => {
    if (!isOnTheHour(scheduleForm.startTime) || !isOnTheHour(scheduleForm.endTime)) {
      enqueueSnackbar('El horario debe ser en hora en punto (ej. 08:00 a 20:00).', { variant: 'error' });
      return;
    }
    if (scheduleForm.startTime >= scheduleForm.endTime) {
      enqueueSnackbar('El horario de inicio debe ser menor al de fin.', { variant: 'error' });
      return;
    }
    updateDaySchedule(selectedDay.dateStr, scheduleForm.startTime, scheduleForm.endTime);
    enqueueSnackbar('Horario del día actualizado correctamente.', { variant: 'success' });
    setIsEditingSchedule(false);
    refreshSelectedDay(selectedDay.dateStr);
  };

  // Helper: estado actual del día seleccionado (puede haber cambiado por toggleDayStatus)
  const selectedDayData = selectedDay
    ? workingDays.find((day) => day.date === selectedDay.dateStr) || selectedDay.dayData
    : null;
  const isSelectedDayEnabled = selectedDayData?.status !== 'Deshabilitado';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── Header ─── */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${BRAND_COLORS.deepGreen} 0%, ${BRAND_COLORS.card} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.brightGreen, 0.3)}`,
          mb: 4,
          overflow: 'hidden',
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={7}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <CalendarIcon sx={{ color: BRAND_COLORS.brightGreen, fontSize: 32, flexShrink: 0 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                Habilitación de Calendario
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Administrá los días laborales del negocio. Solo los días{' '}
              <strong>Martes a Sábado</strong> pueden habilitarse o deshabilitarse.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <Stack
              direction="row"
              spacing={{ xs: 2, sm: 3 }}
              flexWrap="wrap"
              rowGap={1.5}
              justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: BRAND_COLORS.brightGreen, fontWeight: 800 }}>
                  {stats.enabledCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Habilitados
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: BRAND_COLORS.danger, fontWeight: 800 }}>
                  {stats.disabledCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Deshabilitados
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {stats.totalCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total mes
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* ─── Calendario ─── */}
        <Grid item xs={12} md={selectedDay ? 7 : 12}>
          <Paper
            sx={{
              p: { xs: 1.5, sm: 3 },
              borderRadius: 3,
              background: BRAND_COLORS.card,
              border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`,
              overflow: 'hidden',
            }}
          >
            {/* Navegación de mes */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <IconButton
                onClick={handlePrevMonth}
                disabled={!canGoBack}
                sx={{ color: canGoBack ? BRAND_COLORS.brightGreen : withAlpha(BRAND_COLORS.white, 0.15) }}
              >
                <ChevronLeft />
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Typography>
              <IconButton
                onClick={handleNextMonth}
                disabled={!canGoForward}
                sx={{ color: canGoForward ? BRAND_COLORS.brightGreen : withAlpha(BRAND_COLORS.white, 0.15) }}
              >
                <ChevronRight />
              </IconButton>
            </Stack>

            {/* Encabezados de días: 7 columnas iguales en cualquier ancho */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {DAY_HEADERS.map((d, i) => (
                <Typography
                  key={d}
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: 700,
                    py: 0.5,
                    color:
                      i === 0 || i === 1
                        ? withAlpha(BRAND_COLORS.white, 0.18)
                        : BRAND_COLORS.gold,
                    letterSpacing: '0.05em',
                  }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            {/* Grilla de días: 7 columnas iguales en cualquier ancho */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
              }}
            >
              {calendarDays.map((dayInfo, idx) => {
                if (!dayInfo) {
                  return (
                    <Box key={`empty-${idx}`} sx={{ aspectRatio: '1', borderRadius: 2 }} />
                  );
                }

                const isSelected = selectedDay?.dateStr === dayInfo.dateStr;
                const styles = getDayCellStyles(dayInfo, isSelected);

                return (
                  <Box key={dayInfo.dateStr} sx={{ minWidth: 0 }}>
                    <Tooltip
                      title={
                        !dayInfo.isWorkday
                          ? 'Día no laborable (Dom/Lun)'
                          : dayInfo.isPast
                          ? 'Fecha pasada'
                          : dayInfo.dayData?.status || 'Habilitado'
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        onClick={() => dayInfo && handleDayClick(dayInfo)}
                        sx={{
                          aspectRatio: '1',
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: styles.bg,
                          color: styles.color,
                          cursor: styles.cursor,
                          border: styles.border,
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                          position: 'relative',
                          '&:hover': {
                            filter: styles.hoverFilter,
                            transform: `scale(${styles.hoverScale})`,
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: dayInfo.isToday ? 900 : 600,
                            fontSize: { xs: '0.65rem', sm: '0.8rem' },
                            lineHeight: 1,
                          }}
                        >
                          {dayInfo.day}
                        </Typography>
                        {/* Punto indicador de "hoy" */}
                        {dayInfo.isToday && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              bgcolor: 'currentColor',
                              mt: 0.4,
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>

            {/* Leyenda */}
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={3} flexWrap="wrap" rowGap={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 1,
                    bgcolor: withAlpha(BRAND_COLORS.brightGreen, 0.15),
                    border: `1px solid ${BRAND_COLORS.brightGreen}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Habilitado
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 1,
                    bgcolor: withAlpha(BRAND_COLORS.danger, 0.1),
                    border: `1px solid ${BRAND_COLORS.danger}`,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Deshabilitado
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: 1,
                    bgcolor: withAlpha(BRAND_COLORS.white, 0.03),
                    border: '1px solid transparent',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  No laborable / Pasado
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* ─── Panel lateral de detalle ─── */}
        {selectedDay && (
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: BRAND_COLORS.card,
                border: `1px solid ${withAlpha(isSelectedDayEnabled ? BRAND_COLORS.brightGreen : BRAND_COLORS.danger, 0.4)}`,
                position: 'sticky',
                top: 80,
                transition: 'border-color 0.3s ease',
              }}
            >
              {/* Encabezado del panel */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                    {selectedDay.date.toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Typography>
                  <Chip
                    label={isSelectedDayEnabled ? 'Habilitado' : 'Deshabilitado'}
                    color={isSelectedDayEnabled ? 'success' : 'error'}
                    size="small"
                    icon={isSelectedDayEnabled ? <CheckIcon /> : <CancelIcon />}
                    sx={{ mt: 0.5, fontWeight: 700 }}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => { setSelectedDay(null); setIsEditingSchedule(false); }}
                  sx={{ color: 'text.secondary' }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Horario del día */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <TimeIcon sx={{ color: BRAND_COLORS.gold, fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.gold }}>
                  Horario del día
                </Typography>
              </Stack>

              {!isEditingSchedule ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDayData?.startTime || '08:00'} → {selectedDayData?.endTime || '20:00'} hs
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setScheduleForm({
                        startTime: selectedDayData?.startTime || '08:00',
                        endTime: selectedDayData?.endTime || '20:00',
                      });
                      setIsEditingSchedule(true);
                    }}
                    sx={{ color: BRAND_COLORS.gold, minWidth: 0 }}
                  >
                    Editar
                  </Button>
                </Stack>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="day-start-label">Hora inicio</InputLabel>
                      <Select
                        labelId="day-start-label"
                        label="Hora inicio"
                        value={HOUR_OPTIONS.includes(scheduleForm.startTime) ? scheduleForm.startTime : '08:00'}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))
                        }
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <MenuItem key={hour} value={hour}>
                            {hour}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel id="day-end-label">Hora fin</InputLabel>
                      <Select
                        labelId="day-end-label"
                        label="Hora fin"
                        value={HOUR_OPTIONS.includes(scheduleForm.endTime) ? scheduleForm.endTime : '20:00'}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))
                        }
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <MenuItem key={hour} value={hour}>
                            {hour}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={handleSaveDaySchedule}
                      sx={{ fontWeight: 700 }}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setIsEditingSchedule(false)}
                    >
                      Cancelar
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Nota informativa sobre turnos */}
              <Alert
                severity="info"
                icon={<InfoIcon fontSize="small" />}
                sx={{ mb: 2, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}
              >
                Los turnos ofrecidos a los clientes respetan este horario, en bloques de 1 hora en punto.
              </Alert>

              <Divider sx={{ mb: 2 }} />

              {/* Botón de acción principal */}
              <Button
                fullWidth
                variant="contained"
                color={isSelectedDayEnabled ? 'error' : 'success'}
                startIcon={isSelectedDayEnabled ? <EventBusyIcon /> : <EventAvailableIcon />}
                onClick={handleToggleDayStatus}
                sx={{ fontWeight: 700, py: 1.4 }}
              >
                {isSelectedDayEnabled
                  ? 'Deshabilitar este día'
                  : 'Habilitar este día'}
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* ─── Diálogo de confirmación de deshabilitación (CUU6.2) ─── */}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        PaperProps={{
          sx: {
            background: BRAND_COLORS.card,
            border: `1px solid ${withAlpha(BRAND_COLORS.danger, 0.4)}`,
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: BRAND_COLORS.danger, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventBusyIcon /> Confirmar Deshabilitación
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>
              ¿Deshabilitar el{' '}
              {selectedDay?.date.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              ?
            </strong>
            <br />
            Si hay turnos agendados para este día, serán cancelados automáticamente
            cuando se implemente el motor de reservas (Fase 4).
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Esta acción puede revertirse habilitando la fecha nuevamente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsConfirmOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDisableDay}
            variant="contained"
            color="error"
            startIcon={<EventBusyIcon />}
            sx={{ fontWeight: 700 }}
          >
            Sí, deshabilitar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
