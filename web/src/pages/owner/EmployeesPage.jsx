import React, { useState, useEffect } from 'react';
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
import { empleadoService } from '../../services/empleadoService';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Mapea fila del back (usuarios + empleados) al formato que ya usa esta UI.
const fromApi = (emp) => {
  const fullName = `${emp.nombre || ''} ${emp.apellido || ''}`.trim();
  return {
    id: emp.id_empleado,
    name: fullName,
    firstName: emp.nombre || '',
    lastName: emp.apellido || '',
    email: emp.email,
    phone: emp.telefono || '',
    specialties: emp.especialidades || [],
    status: emp.estado === 'INACTIVO' ? 'Inactivo' : 'Activo',
    schedule: {
      enabledDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      morningShift: { startTime: '08:00', endTime: '12:00' },
      afternoonShift: { startTime: '14:00', endTime: '20:00' },
    },
  };
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const EmployeesPage = () => {
  const { services } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Empleados reales desde MySQL.
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoadError('');
      const data = await empleadoService.getAll();
      setEmployees(data.map(fromApi));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
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
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email,
      password: '',
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

  // La baja es lógica (pasa a INACTIVO); con turnos futuros el back responde 409.
  const handleDelete = async (employee) => {
    const employeeName = employee.name;
    if (!window.confirm(`¿Estás seguro de dar de baja al empleado ${employeeName}?`)) return;
    try {
      await empleadoService.delete(employee.id);
      enqueueSnackbar(`Empleado ${employeeName} dado de baja.`, { variant: 'warning' });
      await fetchEmployees();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const handleReactivate = async (employee) => {
    try {
      await empleadoService.update(employee.id, { estado: 'ACTIVO' });
      enqueueSnackbar(`Empleado ${employee.name} reactivado.`, { variant: 'success' });
      await fetchEmployees();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
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

  // Alta y edición contra MySQL.
  const handleSave = async (e) => {
    e.preventDefault();
    const nombre = formData.firstName.trim();
    const apellido = formData.lastName.trim();
    if (!nombre || !apellido || !formData.email.trim()) {
      enqueueSnackbar('Nombre, apellido y email son obligatorios.', { variant: 'error' });
      return;
    }

    try {
      if (selectedEmployee) {
        await empleadoService.update(selectedEmployee.id, {
          nombre,
          apellido,
          email: formData.email.trim(),
          telefono: formData.phone,
          especialidades: formData.specialties,
        });
        enqueueSnackbar('Empleado actualizado con éxito.', { variant: 'success' });
      } else {
        await empleadoService.create({
          nombre,
          apellido,
          email: formData.email.trim(),
          password: formData.password || undefined,
          telefono: formData.phone,
          especialidades: formData.specialties,
        });
        enqueueSnackbar('Nuevo empleado asignado al equipo.', { variant: 'success' });
      }
      setOpenModal(false);
      await fetchEmployees();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
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
      {loadError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          No se pudo conectar con el servidor backend: {loadError}
        </Alert>
      )}
      {loading ? (
        <Typography color="text.secondary">Cargando empleados...</Typography>
      ) : (
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
                      <Chip
                        label={employee.status === 'Inactivo' ? 'INACTIVO' : 'ACTIVO'}
                        color={employee.status === 'Inactivo' ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton color="primary" onClick={() => handleOpenEdit(employee)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {employee.status === 'Inactivo' ? (
                      <Button size="small" color="success" onClick={() => handleReactivate(employee)} sx={{ fontWeight: 700 }}>
                        Reactivar
                      </Button>
                    ) : (
                      <IconButton color="error" onClick={() => handleDelete(employee)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
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
      )}
      {!loading && !loadError && employees.length === 0 && (
        <Typography color="text.secondary">No hay empleados registrados.</Typography>
      )}

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
                  label="Nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
              {!selectedEmployee && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Contraseña inicial (opcional, por defecto 123456)"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </Grid>
              )}
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
