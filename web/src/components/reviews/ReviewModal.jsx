import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Rating,
  TextField,
  Stack,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';

export const ReviewModal = ({ open, onClose, appointment }) => {
  const { addReview } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados locales en inglés (según apuntes de React)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!appointment) return null;

  const handleClose = () => {
    setRating(5);
    setComment('');
    onClose();
  };

  // CUU1.4: Enviar calificación del turno asistido
  const handleSubmitReview = () => {
    try {
      addReview({
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        employeeId: appointment.employeeId,
        employeeName: appointment.employeeName,
        serviceName: appointment.serviceName,
        rating,
        comment: comment.trim(),
      });
      enqueueSnackbar('¡Gracias por tu calificación!', { variant: 'success' });
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Calificar Turno
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {appointment.serviceName} con {appointment.employeeName} — {appointment.date} a las {appointment.time} hs
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Tu calificación:
          </Typography>
          <Rating
            value={rating}
            onChange={(e, newRating) => setRating(newRating || 1)}
            size="large"
            emptyIcon={<StarIcon style={{ opacity: 0.4 }} fontSize="inherit" />}
          />
          <Typography variant="body2" color="text.secondary">
            {rating}/5
          </Typography>
        </Stack>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Comentario (opcional)"
          placeholder="Contanos cómo fue tu experiencia..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmitReview}
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          sx={{ fontWeight: 700 }}
        >
          Enviar Calificación
        </Button>
      </DialogActions>
    </Dialog>
  );
};
