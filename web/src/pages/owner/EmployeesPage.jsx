import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const EmployeesPage = () => {
  const { employees, services, addEmployee, updateEmployee, deleteEmployee } = useData();
  const { enqueueSnackbar } = useSnackbar();

  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    morningStart: '08:00',
    morningEnd: '12:00',
    afternoonStart: '14:00',
    afternoonEnd: '20:00',
  });

  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: services.map((s) => s.name),
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningStart: '08:00',
      morningEnd: '12:00',
      afternoonStart: '14:00',
      afternoonEnd: '20:00',
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (employee) => {
    setSelectedEmployee(employee);
    const schedule = employee.schedule || {};
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      specialties: employee.specialties || [],
      enabledDays: schedule.enabledDays || ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningStart: schedule.morningShift?.startTime || '08:00',
      morningEnd: schedule.morningShift?.endTime || '12:00',
      afternoonStart: schedule.afternoonShift?.startTime || '14:00',
      afternoonEnd: schedule.afternoonShift?.endTime || '20:00',
    });
    setOpenModal(true);
  };

  const handleDelete = (employee) => {
    const employeeName = employee.name;
    if (window.confirm(`¿Estás seguro de eliminar al empleado ${employeeName}?`)) {
      deleteEmployee(employee.id);
      enqueueSnackbar(`Empleado ${employeeName} eliminado.`, { variant: 'warning' });
    }
  };

  const handleToggleDay = (day) => {
    setFormData((prev) => {
      const exists = prev.enabledDays.includes(day);
      const next = exists ? prev.enabledDays.filter((d) => d !== day) : [...prev.enabledDays, day];
      return { ...prev, enabledDays: next };
    });
  };

  const handleToggleSpecialty = (serviceName) => {
    setFormData((prev) => {
      const exists = prev.specialties.includes(serviceName);
      const next = exists ? prev.specialties.filter((e) => e !== serviceName) : [...prev.specialties, serviceName];
      return { ...prev, specialties: next };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialties: formData.specialties,
      schedule: {
        enabledDays: formData.enabledDays,
        morningShift: { startTime: formData.morningStart, endTime: formData.morningEnd },
        afternoonShift: { startTime: formData.afternoonStart, endTime: formData.afternoonEnd },
      },
    };

    if (selectedEmployee) {
      updateEmployee(selectedEmployee.id, payload);
      enqueueSnackbar('Empleado actualizado con éxito.', { variant: 'success' });
    } else {
      addEmployee(payload);
      enqueueSnackbar('Nuevo empleado asignado al equipo.', { variant: 'success' });
    }
    setOpenModal(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* Encabezado */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.blueTint} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.infoBlue, 0.3)}`,
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <BadgeIcon sx={{ color: BRAND_COLORS.infoBlue, fontSize: 32, flexShrink: 0 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                Gestión de Empleados y Horarios
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Alta, edición y eliminación del equipo de barberos y asignación de jornadas de trabajo.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Button
              variant="contained"
              color="info"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ fontWeight: 700, py: 1.2, px: 3 }}
            >
              Nuevo Empleado
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grilla de Empleados */}
      <Grid container spacing={3}>
        {employees.map((employee) => {
          const employeeName = employee.name;
          const employeePhone = employee.phone;
          const employeeSpecialties = employee.specialties || [];
          const schedule = employee.schedule || {};
          const enabledDays = schedule.enabledDays || [];
          const morningStart = schedule.morningShift?.startTime || '08:00';
          const morningEnd = schedule.morningShift?.endTime || '12:00';
          const afternoonStart = schedule.afternoonShift?.startTime || '14:00';
          const afternoonEnd = schedule.afternoonShift?.endTime || '20:00';
          return (
          <Grid item xs={12} md={6} key={employee.id}>
            <Card sx={{ borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {employeeName}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label="Barbero Staff" color="info" size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton color="primary" onClick={() => handleOpenEdit(employee)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(employee)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{employee.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{employeePhone || 'Sin teléfono'}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: BRAND_COLORS.gold }}>
                  Jornada & Horarios Asignados:
                </Typography>

                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
                  {enabledDays?.map((day) => (
                    <Chip key={day} label={day} size="small" variant="outlined" color="primary" />
                  ))}
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block">
                  • Mañana: {morningStart} a {morningEnd} hs
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  • Tarde: {afternoonStart} a {afternoonEnd} hs
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Especialidades:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {employeeSpecialties?.map((specialty) => (
                    <Chip key={specialty} label={specialty} size="small" color="default" sx={{ fontSize: '0.75rem' }} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          );
        })}
      </Grid>

      {/* Modal de Alta / Edición de Empleado */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.infoBlue, 0.3)}`, borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedEmployee ? 'Editar Empleado' : 'Asignar Nuevo Empleado'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: BRAND_COLORS.infoBlue }}>
              Configuración de Días de Trabajo
            </Typography>
            <FormGroup row sx={{ mb: 2 }}>
              {DIAS_SEMANA.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={formData.enabledDays.includes(day)}
                      onChange={() => handleToggleDay(day)}
                      color="info"
                    />
                  }
                  label={day}
                />
              ))}
            </FormGroup>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Mañana Inicio"
                  type="time"
                  value={formData.morningStart}
                  onChange={(e) => setFormData({ ...formData, morningStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Mañana Fin"
                  type="time"
                  value={formData.morningEnd}
                  onChange={(e) => setFormData({ ...formData, morningEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Tarde Inicio"
                  type="time"
                  value={formData.afternoonStart}
                  onChange={(e) => setFormData({ ...formData, afternoonStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Tarde Fin"
                  type="time"
                  value={formData.afternoonEnd}
                  onChange={(e) => setFormData({ ...formData, afternoonEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Especialidades Habilitadas
            </Typography>
            <FormGroup row>
              {services.map((service) => {
                const serviceName = service.name;
                return (
                <FormControlLabel
                  key={service.id}
                  control={
                    <Checkbox
                      checked={formData.specialties.includes(serviceName)}
                      onChange={() => handleToggleSpecialty(serviceName)}
                      color="primary"
                    />
                  }
                  label={serviceName}
                />
                );
              })}
            </FormGroup>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="info" sx={{ fontWeight: 700 }}>
              {selectedEmployee ? 'Guardar Cambios' : 'Asignar Empleado'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};
