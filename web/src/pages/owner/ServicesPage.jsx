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
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  DesignServices as ServicesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

export const ServicesPage = () => {
  const { services, addService, updateService, toggleServiceStatus } = useData();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isEmpleado = user?.rol === 'empleado';

  const [openModal, setOpenModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    duracionMinutos: 30,
    precio: 0,
    descripcion: '',
  });

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({ nombre: '', duracionMinutos: 30, precio: 3000, descripcion: '' });
    setOpenModal(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      nombre: service.nombre,
      duracionMinutos: service.duracionMinutos,
      precio: service.precio,
      descripcion: service.descripcion || '',
    });
    setOpenModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    if (editingService) {
      updateService(editingService.id, formData);
      enqueueSnackbar('Servicio actualizado con éxito.', { variant: 'success' });
    } else {
      addService(formData);
      enqueueSnackbar('Servicio creado correctamente.', { variant: 'success' });
    }
    setOpenModal(false);
  };

  const handleToggleStatus = (service) => {
    if (isEmpleado) return;
    toggleServiceStatus(service.id);
    const nextState = service.estado === 'Habilitado' ? 'Deshabilitado' : 'Habilitado';
    enqueueSnackbar(`Servicio "${service.nombre}" cambiado a ${nextState}.`, { variant: 'info' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Encabezado */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #22262f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <ServicesIcon sx={{ color: '#d4af37', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Catálogo de Servicios {isEmpleado && '(Modo Lectura)'}
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Gestión de servicios de barbería, duraciones estimadas y listas de precios.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            {!isEmpleado && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ fontWeight: 700, py: 1.2, px: 3 }}
              >
                Nuevo Servicio
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Banner Informativo si es Empleado */}
      {isEmpleado && (
        <Alert
          severity="info"
          icon={<LockIcon fontSize="inherit" />}
          sx={{ mb: 4, borderRadius: 3 }}
        >
          <strong>Acceso de Empleado (CUU7.1 / CUU7.2):</strong> Tienes permisos únicamente para consultar el catálogo de servicios. Las acciones de alta, edición y deshabilitación son facultad exclusiva del Dueño.
        </Alert>
      )}

      {/* Lista de Servicios en Grilla */}
      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                background: '#181b20',
                border: service.estado === 'Habilitado' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(239, 68, 68, 0.3)',
                opacity: service.estado === 'Deshabilitado' ? 0.75 : 1,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {service.nombre}
                  </Typography>
                  <Chip
                    label={service.estado.toUpperCase()}
                    color={service.estado === 'Habilitado' ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {service.descripcion || 'Sin descripción detallada.'}
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimeIcon sx={{ color: '#d4af37', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {service.duracionMinutos} min
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon sx={{ color: '#10b981', fontSize: 18 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                      ${service.precio.toLocaleString('es-AR')}
                    </Typography>
                  </Box>
                </Stack>

                {!isEmpleado && (
                  <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={service.estado === 'Habilitado'}
                          onChange={() => handleToggleStatus(service)}
                          color="success"
                          size="small"
                        />
                      }
                      label={<Typography variant="caption">{service.estado === 'Habilitado' ? 'Habilitado' : 'Deshabilitado'}</Typography>}
                    />
                    <IconButton color="primary" size="small" onClick={() => handleOpenEdit(service)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal de Alta / Edición de Servicio (Dueño) */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { background: '#181b20', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre del Servicio"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duración (Minutos)"
                  type="number"
                  value={formData.duracionMinutos}
                  onChange={(e) => setFormData({ ...formData, duracionMinutos: parseInt(e.target.value) || 15 })}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Precio ($ ARS)"
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseInt(e.target.value) || 0 })}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción del Servicio"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};
