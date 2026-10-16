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
  InputAdornment,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  DesignServices as ServicesIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { servicioService } from '../../services/servicioService';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Convierte un registro de MySQL (api/servicios) al formato visual del frontend
const fromApi = (s) => ({
  id: s.id_servicio,
  name: s.nombre,
  description: s.descripcion || '',
  price: Number(s.precio) || 0,
  durationMinutes: s.duracion_minutos || 60,
  status: s.estado === 'HABILITADO' ? 'Habilitado' : 'Deshabilitado',
});

export const ServicesPage = () => {
  const { services: contextServices, updateService: updateContextService, addService: addContextService, toggleServiceStatus: toggleContextService } = useData();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isEmpleado = user?.rol === 'empleado';

  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Regla de negocio: todos los servicios duran 1 hora (60 minutos)
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 60,
    price: 0,
    description: '',
  });

  // Carga inicial desde MySQL
  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await servicioService.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setServicesList(data.map(fromApi));
      } else {
        setServicesList(contextServices);
      }
    } catch (err) {
      console.warn('Usando catálogo local por error de API:', err.message);
      setServicesList(contextServices);
      enqueueSnackbar('No se pudo sincronizar con MySQL, mostrando datos locales.', { variant: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setFormData({ name: '', durationMinutes: 60, price: 3000, description: '' });
    setOpenModal(true);
  };

  const handleOpenEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      durationMinutes: 60,
      price: service.price ?? 0,
      description: service.description || '',
    });
    setOpenModal(true);
  };

  // Alta y modificación de servicio contra MySQL
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      if (selectedService) {
        const updatedRaw = await servicioService.update(selectedService.id, {
          nombre: formData.name.trim(),
          precio: Number(formData.price),
          descripcion: formData.description?.trim() || null,
        });
        const updated = fromApi(updatedRaw);
        setServicesList((prev) => prev.map((s) => (s.id === selectedService.id ? updated : s)));
        updateContextService(selectedService.id, updated);
        enqueueSnackbar('Servicio actualizado con éxito en MySQL.', { variant: 'success' });
      } else {
        const createdRaw = await servicioService.create({
          nombre: formData.name.trim(),
          precio: Number(formData.price),
          descripcion: formData.description?.trim() || null,
        });
        const created = fromApi(createdRaw);
        setServicesList((prev) => [created, ...prev]);
        addContextService(created);
        enqueueSnackbar('Servicio creado correctamente en MySQL.', { variant: 'success' });
      }
      setOpenModal(false);
    } catch (err) {
      enqueueSnackbar(err.message || 'Error al guardar el servicio', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Habilitar / Deshabilitar servicio en MySQL
  const handleToggleStatus = async (service) => {
    if (isEmpleado) return;
    try {
      const updatedRaw = await servicioService.toggleStatus(service.id);
      const updated = fromApi(updatedRaw);
      setServicesList((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      toggleContextService(service.id);
      const nextStatus = updated.status;
      enqueueSnackbar(`Servicio "${service.name}" cambiado a ${nextStatus}.`, { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(err.message || 'Error al cambiar estado', { variant: 'error' });
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
          background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.neutralTint} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.gold, 0.3)}`,
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <ServicesIcon sx={{ color: BRAND_COLORS.gold, fontSize: 32, flexShrink: 0 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                Catálogo de Servicios {isEmpleado && '(Modo Lectura)'}
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Gestión de servicios de barbería, duraciones fijas de 1 hora y listas de precios conectadas a MySQL.
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
          <strong>Acceso de Empleado:</strong> Tienes permisos únicamente para consultar el catálogo de servicios. Las acciones de alta, edición y deshabilitación son facultad exclusiva del Dueño.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        /* Lista de Servicios en Grilla */
        <Grid container spacing={3}>
          {servicesList.map((service) => {
            const serviceName = service.name;
            const serviceDescription = service.description;
            const serviceDuration = service.durationMinutes ?? 60;
            const servicePrice = service.price ?? 0;
            const serviceStatus = service.status;
            const isEnabled = serviceStatus === 'Habilitado';
            return (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    background: BRAND_COLORS.card,
                    border: isEnabled
                      ? `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`
                      : `1px solid ${withAlpha(BRAND_COLORS.danger, 0.3)}`,
                    opacity: isEnabled ? 1 : 0.75,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {serviceName}
                      </Typography>
                      <Chip
                        label={serviceStatus.toUpperCase()}
                        color={isEnabled ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {serviceDescription || 'Sin descripción detallada.'}
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ color: BRAND_COLORS.gold, fontSize: 18 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {serviceDuration} min
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ color: BRAND_COLORS.successGreen, fontSize: 18 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_COLORS.successGreen }}>
                          ${servicePrice.toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                    </Stack>

                    {!isEmpleado && (
                      <Box
                        sx={{
                          pt: 1,
                          borderTop: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isEnabled}
                              onChange={() => handleToggleStatus(service)}
                              color="success"
                              size="small"
                            />
                          }
                          label={<Typography variant="caption">{isEnabled ? 'Habilitado' : 'Deshabilitado'}</Typography>}
                        />
                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(service)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal de Alta / Edición de Servicio (Dueño) */}
      <Dialog
        open={openModal}
        onClose={() => !saving && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.gold, 0.3)}`, borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre del Servicio"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={saving}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duración (Minutos)"
                  type="number"
                  value={formData.durationMinutes}
                  disabled
                  helperText="Todos los servicios duran 1 hora"
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
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  required
                  disabled={saving}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={saving}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }} disabled={saving}>
              {saving ? 'Guardando...' : selectedService ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};
