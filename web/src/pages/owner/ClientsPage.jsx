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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

export const ClientsPage = () => {
  const { clients, toggleClientBlock } = useData();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isEmpleado = user?.rol === 'empleado';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((client) => {
    const clientName = client.name || '';
    const clientPhone = client.phone || '';
    return (
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientPhone.includes(searchTerm)
    );
  });

  const handleToggleClientBlock = (client) => {
    if (isEmpleado) return;

    const clientName = client.name;
    const currentStatus = client.status;
    toggleClientBlock(client.id);
    const nextStatus = currentStatus === 'Bloqueado' ? 'Activo' : 'Bloqueado';
    if (nextStatus === 'Bloqueado') {
      enqueueSnackbar(`Cliente ${clientName} ha sido BLOQUEADO.`, { variant: 'error' });
    } else {
      enqueueSnackbar(`Cliente ${clientName} ha sido DESBLOQUEADO.`, { variant: 'success' });
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Bloqueado':
        return <Chip label="BLOQUEADO" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'Multado':
        return <Chip label="MULTADO (3 Strikes)" color="error" variant="outlined" size="small" sx={{ fontWeight: 800 }} />;
      case 'Activo':
        return <Chip label="ACTIVO" color="success" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Encabezado */}
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #181b20 0%, #1c2b20 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PeopleIcon sx={{ color: '#10b981', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Gestión de Clientes {isEmpleado && '(Modo Consulta)'}
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Listado de clientes registrados, historial de strikes y control de bloqueos de cuenta (`CUU5.1` / `CUU5.2`).
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Banner Informativo para Empleado */}
      {isEmpleado && (
        <Alert
          severity="info"
          icon={<LockIcon fontSize="inherit" />}
          sx={{ mb: 4, borderRadius: 3 }}
        >
          <strong>Aviso de Permisos (Mapa de Navegación):</strong> Como Empleado puedes consultar la información de contacto y estado de los clientes, pero <strong>no tienes la facultad de bloquear o desbloquear clientes</strong> (función reservada al Dueño).
        </Alert>
      )}

      {/* Buscador */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, background: '#181b20' }}>
        <TextField
          fullWidth
          placeholder="Buscar cliente por nombre, e-mail o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabla de Clientes */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, background: '#181b20', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Table>
          <TableHead sx={{ background: '#121419' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Contacto</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Estado de Cuenta</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Strikes Acumulados</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((client) => {
              const clientName = client.name;
              const clientPhone = client.phone;
              const clientStatus = client.status;
              const registrationDate = client.registrationDate || '2026-05-01';
              const isBlocked = clientStatus === 'Bloqueado';
              return (
              <TableRow key={client.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 700 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {clientName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registrado: {registrationDate}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{client.email}</Typography>
                  <Typography variant="caption" color="text.secondary">{clientPhone}</Typography>
                </TableCell>

                <TableCell>
                  {getStatusChip(clientStatus)}
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <WarningIcon fontSize="small" color={client.strikes > 0 ? 'warning' : 'disabled'} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: client.strikes > 0 ? 'warning.main' : 'text.secondary' }}>
                      {client.strikes} / 3 Strikes
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell align="right">
                  {isEmpleado ? (
                    <Tooltip title="El Empleado no tiene la facultad de bloquear clientes">
                      <span>
                        <Button variant="outlined" size="small" disabled startIcon={<BlockIcon />}>
                          Restringido
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      variant={isBlocked ? 'contained' : 'outlined'}
                      color={isBlocked ? 'success' : 'error'}
                      size="small"
                      startIcon={isBlocked ? <CheckIcon /> : <BlockIcon />}
                      onClick={() => handleToggleClientBlock(client)}
                      sx={{ fontWeight: 700 }}
                    >
                      {isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
