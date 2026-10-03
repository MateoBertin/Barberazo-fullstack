import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Security as SecurityIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

export const MercadoPagoModal = ({ open, onClose, fine, clientId }) => {
  const { payFine } = useData();
  const { enqueueSnackbar } = useSnackbar();

  // Estados locales en inglés (según apuntes de React)
  const [paymentMethod, setPaymentMethod] = useState('account_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentApproved, setIsPaymentApproved] = useState(false);

  // Manejador del submit de pago
  const handlePay = () => {
    setIsProcessing(true);

    // Simulamos la latencia de la pasarela de pagos (1.5 segundos)
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentApproved(true);
      payFine(fine.id, clientId);
      enqueueSnackbar('¡Pago procesado exitosamente! Tu cuenta ha sido rehabilitada.', {
        variant: 'success',
      });
    }, 1500);
  };

  const handleClose = () => {
    setIsPaymentApproved(false);
    setIsProcessing(false);
    onClose();
  };

  if (!fine) return null;

  const fineAmount = fine.amount;
  const fineReason = fine.reason;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      {/* ─── ENCABEZADO ESTILO MERCADO PAGO ─── */}
      <Box sx={{ background: BRAND_COLORS.mercadoPago, p: 3, color: BRAND_COLORS.white, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
          Mercado Pago
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Checkout Oficial de Pagos
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {isPaymentApproved ? (
          // ─── PANTALLA DE PAGO APROBADO ───
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckIcon sx={{ color: BRAND_COLORS.successGreen, fontSize: 64, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: BRAND_COLORS.successGreen }}>
              ¡Pago Aprobado!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Operación #{Math.floor(100000000 + Math.random() * 900000000)}
            </Typography>
            <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Monto abonado
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${fineAmount?.toLocaleString()} ARS
              </Typography>
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>
                ✓ Strikes reiniciados a 0 • Cuenta Activa
              </Typography>
            </Paper>
          </Box>
        ) : isProcessing ? (
          // ─── PANTALLA DE PROCESANDO PAGO ───
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress sx={{ color: BRAND_COLORS.mercadoPago, mb: 3 }} size={48} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Procesando tu pago...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conectando de forma segura con Mercado Pago. No cierres esta ventana.
            </Typography>
          </Box>
        ) : (
          // ─── SELECCIÓN DE MÉTODO DE PAGO ───
          <Box>
            <Paper sx={{ p: 2, background: withAlpha(BRAND_COLORS.white, 0.03), borderRadius: 2, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Detalle del Cobro
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Regularización de Multa - Barberazo
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Motivo: {fineReason}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total a pagar:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND_COLORS.mercadoPago }}>
                  ${fineAmount?.toLocaleString()} ARS
                </Typography>
              </Stack>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Selecciona tu medio de pago:
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <Paper sx={{ p: 1.5, mb: 1, borderRadius: 2, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
                  <FormControlLabel
                    value="account_money"
                    control={<Radio color="primary" />}
                    label={
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WalletIcon sx={{ fontSize: 20, color: BRAND_COLORS.mercadoPago }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Dinero en cuenta Mercado Pago
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Disponible: $28.500,00
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
                  <FormControlLabel
                    value="debit_card"
                    control={<Radio color="primary" />}
                    label={
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CardIcon sx={{ fontSize: 20, color: BRAND_COLORS.successGreen }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Tarjeta de Débito
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Visa Débito terminada en •••• 4242
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>
            </FormControl>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, opacity: 0.7 }}>
              <SecurityIcon fontSize="small" sx={{ color: BRAND_COLORS.successGreen }} />
              <Typography variant="caption" color="text.secondary">
                Pago protegido y encriptado por Mercado Pago Sandbox
              </Typography>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        {isPaymentApproved ? (
          <Button fullWidth variant="contained" color="success" onClick={handleClose} sx={{ py: 1.2, fontWeight: 700 }}>
            Continuar
          </Button>
        ) : (
          !isProcessing && (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button fullWidth color="inherit" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePay}
                sx={{
                  background: BRAND_COLORS.mercadoPago,
                  '&:hover': { background: BRAND_COLORS.mercadoPagoDark },
                  fontWeight: 700,
                  py: 1.2,
                }}
              >
                Pagar ${fineAmount?.toLocaleString()}
              </Button>
            </Stack>
          )
        )}
      </DialogActions>
    </Dialog>
  );
};
