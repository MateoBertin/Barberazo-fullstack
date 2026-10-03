import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { MercadoPagoModal } from '../../components/fines/MercadoPagoModal';

export const ClientFinesPage = () => {
  const { user } = useAuth();
  const { fines } = useData();

  // Estados locales en inglés (según apuntes de React)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);

  // Filtrar multas del usuario actual
  const myFines = fines.filter(
    (fine) =>
      String(fine.clientId) === String(user?.id) ||
      fine.clientEmail === user?.email
  );

  const currentStrikes = user?.strikes || 0;
  const pendingFine = myFines.find((fine) => fine.status === 'Pendiente');

  const handleOpenPayment = (fine) => {
    setSelectedFine(fine);
    setIsModalOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* ─── ENCABEZADO ─── */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #20252e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          mb: 4,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <WarningIcon sx={{ color: currentStrikes >= 3 ? '#ef4444' : '#f59e0b', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Control de Strikes y Multas
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Consulta tu historial de inasistencias, penalizaciones y regulariza pagos pendientes a través de Mercado Pago.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Chip
              label={user?.estado === 'Multado' ? 'CUENTA MULTADA' : user?.estado?.toUpperCase()}
              color={user?.estado === 'Multado' ? 'error' : 'success'}
              sx={{ fontWeight: 800, fontSize: '0.9rem', py: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── PANEL DE ESTADO DE STRIKES ─── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Contador de Strikes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Los strikes se aplican por inasistencias sin aviso o cancelaciones con menos de 24 hs de anticipación.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Nivel de Penalización:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: currentStrikes >= 3 ? '#ef4444' : currentStrikes > 0 ? '#f59e0b' : '#10b981',
                  }}
                >
                  {currentStrikes} / 3 Strikes
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(currentStrikes / 3) * 100}
                color={currentStrikes >= 3 ? 'error' : currentStrikes > 0 ? 'warning' : 'success'}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
              {[1, 2, 3].map((num) => (
                <Chip
                  key={num}
                  label={`Strike ${num}`}
                  color={currentStrikes >= num ? (num === 3 ? 'error' : 'warning') : 'default'}
                  variant={currentStrikes >= num ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Reglas del Sistema de Turnos
            </Typography>

            <Stack spacing={1.5}>
              <Alert severity="info" icon={<InfoIcon fontSize="inherit" />}>
                <strong>Cancelación anticipada:</strong> Puedes cancelar tu turno libremente y sin penalidad siempre que lo hagas con <strong>más de 24 hs</strong> de antelación.
              </Alert>

              <Alert severity="warning" icon={<WarningIcon fontSize="inherit" />}>
                <strong>Cancelación tardía (&lt;24 hs):</strong> Sumará <strong>+1 Strike</strong> debido al tiempo de reserva perdido.
              </Alert>

              <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />}>
                <strong>Acumulación de 3 Strikes:</strong> La cuenta queda en estado <strong>Multado</strong> y se bloquea la solicitud de nuevos turnos hasta abonar la multa correspondiente.
              </Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── ALERTA DESTACADA SI TIENE MULTA PENDIENTE ─── */}
      {pendingFine && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: 3, p: 2 }}
          action={
            <Button
              variant="contained"
              sx={{ background: '#009ee3', '&:hover': { background: '#0081ba' }, fontWeight: 700 }}
              onClick={() => handleOpenPayment(pendingFine)}
              startIcon={<PaymentIcon />}
            >
              Pagar con Mercado Pago
            </Button>
          }
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Multa Activa Pendiente de Pago (${pendingFine.amount?.toLocaleString()} ARS)
          </Typography>
          <Typography variant="body2">
            Has acumulado 3 strikes. Realiza el pago para resetear tus strikes a 0 y volver a solicitar turnos de inmediato.
          </Typography>
        </Alert>
      )}

      {/* ─── HISTORIAL DE MULTAS ─── */}
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Historial de Multas
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Table>
          <TableHead sx={{ background: '#1e2229' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Fecha Emisión</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {myFines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No posees multas registradas en tu historial. ¡Excelente conducta!
                </TableCell>
              </TableRow>
            ) : (
              myFines.map((fine) => {
                const fineDate = fine.issueDate;
                const fineReason = fine.reason;
                const fineAmount = fine.amount;
                const isPending = fine.status === 'Pendiente';
                const fineMethod = fine.paymentMethod || 'Mercado Pago';
                const finePaymentDate = fine.paymentDate || fineDate;

                return (
                  <TableRow key={fine.id} hover>
                    <TableCell>{fineDate}</TableCell>
                    <TableCell>{fineReason}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>${fineAmount?.toLocaleString()} ARS</TableCell>
                    <TableCell>
                      {isPending ? (
                        <Chip label="Pendiente de Pago" color="error" size="small" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip
                          label={`Pagada (${fineMethod})`}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isPending ? (
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ background: '#009ee3', '&:hover': { background: '#0081ba' }, fontWeight: 700 }}
                          onClick={() => handleOpenPayment(fine)}
                        >
                          Pagar
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Abonada el {finePaymentDate}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de simulación Mercado Pago */}
      <MercadoPagoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fine={selectedFine}
        clientId={user?.id}
      />
    </Container>
  );
};
