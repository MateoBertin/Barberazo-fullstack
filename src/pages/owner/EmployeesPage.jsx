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

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const EmployeesPage = () => {
  const { employees, services, addEmployee, updateEmployee, deleteEmployee } = useData();
  const { enqueueSnackbar } = useSnackbar();

  const [openModal, setOpenModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    especialidades: [],
    diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    mananaInicio: '08:00',
    mananaFin: '12:00',
    tardeInicio: '14:00',
    tardeFin: '20:00',
  });

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      especialidades: services.map((s) => s.nombre),
      diasHabilitados: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      mananaInicio: '08:00',
      mananaFin: '12:00',
      tardeInicio: '14:00',
      tardeFin: '20:00',
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      nombre: emp.nombre,
      email: emp.email,
      telefono: emp.telefono,
      especialidades: emp.especialidades || [],
      diasHabilitados: emp.horarios?.diasHabilitados || ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      mananaInicio: emp.horarios?.turnoManana?.inicio || '08:00',
      mananaFin: emp.horarios?.turnoManana?.fin || '12:00',
      tardeInicio: emp.horarios?.turnoTarde?.inicio || '14:00',
      tardeFin: emp.horarios?.turnoTarde?.fin || '20:00',
    });
    setOpenModal(true);
  };

  const handleDelete = (emp) => {
    if (window.confirm(`¿Estás seguro de eliminar al empleado ${emp.nombre}?`)) {
      deleteEmployee(emp.id);
      enqueueSnackbar(`Empleado ${emp.nombre} eliminado.`, { variant: 'warning' });
    }
  };

  const handleToggleDia = (dia) => {
    setFormData((prev) => {
      const exists = prev.diasHabilitados.includes(dia);
      const next = exists ? prev.diasHabilitados.filter((d) => d !== dia) : [...prev.diasHabilitados, dia];
      return { ...prev, diasHabilitados: next };
    });
  };

  const handleToggleEspecialidad = (nombreServicio) => {
    setFormData((prev) => {
      const exists = prev.especialidades.includes(nombreServicio);
      const next = exists ? prev.especialidades.filter((e) => e !== nombreServicio) : [...prev.especialidades, nombreServicio];
      return { ...prev, especialidades: next };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim()) return;

    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      especialidades: formData.especialidades,
      horarios: {
        diasHabilitados: formData.diasHabilitados,
        turnoManana: { inicio: formData.mananaInicio, fin: formData.mananaFin },
        turnoTarde: { inicio: formData.tardeInicio, fin: formData.tardeFin },
      },
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, payload);
      enqueueSnackbar('Empleado actualizado con éxito.', { variant: 'success' });
    } else {
      addEmployee(payload);
      enqueueSnackbar('Nuevo empleado asignado al equipo.', { variant: 'success' });
    }
    setOpenModal(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Encabezado */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #172433 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <BadgeIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
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
        {employees.map((emp) => (
          <Grid item xs={12} md={6} key={emp.id}>
            <Card sx={{ borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {emp.nombre}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label="Barbero Staff" color="info" size="small" sx={{ fontWeight: 700 }} />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton color="primary" onClick={() => handleOpenEdit(emp)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(emp)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{emp.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{emp.telefono || 'Sin teléfono'}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#d4af37' }}>
                  Jornada & Horarios Asignados:
                </Typography>

                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
                  {emp.horarios?.diasHabilitados?.map((dia) => (
                    <Chip key={dia} label={dia} size="small" variant="outlined" color="primary" />
                  ))}
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block">
                  • Mañana: {emp.horarios?.turnoManana?.inicio || '08:00'} a {emp.horarios?.turnoManana?.fin || '12:00'} hs
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  • Tarde: {emp.horarios?.turnoTarde?.inicio || '14:00'} a {emp.horarios?.turnoTarde?.fin || '20:00'} hs
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Especialidades:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {emp.especialidades?.map((esp) => (
                    <Chip key={esp} label={esp} size="small" color="default" sx={{ fontSize: '0.75rem' }} />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal de Alta / Edición de Empleado */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { background: '#181b20', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingEmployee ? 'Editar Empleado' : 'Asignar Nuevo Empleado'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#3b82f6' }}>
              Configuración de Días de Trabajo
            </Typography>
            <FormGroup row sx={{ mb: 2 }}>
              {DIAS_SEMANA.map((dia) => (
                <FormControlLabel
                  key={dia}
                  control={
                    <Checkbox
                      checked={formData.diasHabilitados.includes(dia)}
                      onChange={() => handleToggleDia(dia)}
                      color="info"
                    />
                  }
                  label={dia}
                />
              ))}
            </FormGroup>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Mañana Inicio"
                  type="time"
                  value={formData.mananaInicio}
                  onChange={(e) => setFormData({ ...formData, mananaInicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Mañana Fin"
                  type="time"
                  value={formData.mananaFin}
                  onChange={(e) => setFormData({ ...formData, mananaFin: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Tarde Inicio"
                  type="time"
                  value={formData.tardeInicio}
                  onChange={(e) => setFormData({ ...formData, tardeInicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Tarde Fin"
                  type="time"
                  value={formData.tardeFin}
                  onChange={(e) => setFormData({ ...formData, tardeFin: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Especialidades Habilitadas
            </Typography>
            <FormGroup row>
              {services.map((s) => (
                <FormControlLabel
                  key={s.id}
                  control={
                    <Checkbox
                      checked={formData.especialidades.includes(s.nombre)}
                      onChange={() => handleToggleEspecialidad(s.nombre)}
                      color="primary"
                    />
                  }
                  label={s.nombre}
                />
              ))}
            </FormGroup>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="info" sx={{ fontWeight: 700 }}>
              {editingEmployee ? 'Guardar Cambios' : 'Asignar Empleado'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};
