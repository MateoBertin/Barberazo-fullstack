import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Button,
  TextField,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  AccountCircle as ProfileIcon,
  Save as SaveIcon,
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clienteService } from '../../services/clienteService';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

export const ClientProfilePage = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Formulario controlado en inglés (se mapea a claves del back al guardar).
  // El back guarda nombre/apellido separados: se combinan para mostrar y se
  // separan al guardar (primera palabra = nombre, resto = apellido).
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.name || '';
  const [formData, setFormData] = useState({
    name: fullName,
    phone: user?.telefono || user?.phone || '',
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // CUU9.1: Guardar cambios del perfil contra MySQL y sincronizar sesión local.
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      enqueueSnackbar('El nombre no puede estar vacío.', { variant: 'error' });
      return;
    }

    const parts = formData.name.trim().split(/\s+/);
    try {
      const updated = await clienteService.updateProfile({
        nombre: parts[0],
        apellido: parts.slice(1).join(' '),
        telefono: formData.phone.trim(),
      });
      updateProfile({ nombre: updated.nombre, apellido: updated.apellido, telefono: updated.telefono });
      enqueueSnackbar('Perfil actualizado correctamente.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  // CUU9.2: Eliminar la cuenta (doble confirmación). Si tiene turnos, el back
  // responde 409 y no se cierra sesión.
  const handleConfirmDeleteAccount = async () => {
    try {
      await clienteService.deleteAccount();
      deleteAccount();
      setIsDeleteDialogOpen(false);
      enqueueSnackbar('Tu cuenta fue eliminada.', { variant: 'info' });
      navigate('/');
    } catch (error) {
      setIsDeleteDialogOpen(false);
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      {/* ─── Encabezado ─── */}
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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ProfileIcon sx={{ color: BRAND_COLORS.gold, fontSize: 32, flexShrink: 0 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              Mi Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Actualiza tus datos de contacto o elimina tu cuenta.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* ─── CUU9.1: Edición de datos ─── */}
      <Paper sx={{ p: 3, borderRadius: 3, background: BRAND_COLORS.card, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Datos Personales
        </Typography>
        <form onSubmit={handleSaveProfile}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Correo Electrónico (no se puede modificar)"
                value={user?.email || ''}
                disabled
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            sx={{ fontWeight: 700 }}
          >
            Guardar Cambios
          </Button>
        </form>
      </Paper>

      {/* ─── CUU9.2: Zona de peligro ─── */}
      <Paper sx={{ p: 3, borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.danger, 0.4)}` }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <WarningIcon sx={{ color: BRAND_COLORS.danger }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.danger }}>
            Zona de Peligro
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Al eliminar tu cuenta se cerrará tu sesión y perderás el acceso a tus reservas. Esta acción no se puede deshacer.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setIsDeleteDialogOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          Eliminar Mi Cuenta
        </Button>
      </Paper>

      {/* ─── Diálogo de confirmación de eliminación ─── */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: BRAND_COLORS.danger }}>
          ¿Eliminar tu cuenta?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se eliminará tu cuenta <strong>{user?.email}</strong> y se cerrará tu sesión.
            Tus turnos pasados se conservan como historial de la barbería. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDeleteAccount}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 700 }}
          >
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
