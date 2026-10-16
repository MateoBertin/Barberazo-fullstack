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
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { resenaService } from '../../services/resenaService';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';

export const ReviewModal = ({ open, onClose, appointment, onReviewSubmitted }) => {
  const { addReview } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados locales en inglés (según apuntes de React)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const handleClose = () => {
    setRating(5);
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  // CUU1.4: Enviar calificación del turno asistido contra MySQL (/api/resenas)
  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);

      const reviewData = {
        id_turno: appointment.id,
        appointmentId: appointment.id,
        calificacion: rating,
        rating: rating,
        comentario: comment.trim(),
        comment: comment.trim(),
      };

      // 1. Guardar en base de datos MySQL mediante API real
      await resenaService.create(reviewData);

      // 2. Actualizar estado local del DataContext para refresco instantáneo en UI
      if (addReview) {
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
        } catch {
          // Si ya existe en context local, continuar
        }
      }

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      enqueueSnackbar('¡Gracias por tu calificación!', { variant: 'success' });
      handleClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Error al enviar la calificación', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmitReview}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          sx={{ fontWeight: 700 }}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
