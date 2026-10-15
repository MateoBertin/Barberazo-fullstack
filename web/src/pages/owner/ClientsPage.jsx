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
import { clienteService } from '../../services/clienteService';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { BRAND_COLORS, withAlpha } from '../../theme';

// Mapea fila del back (usuarios + clientes) al formato que ya usa esta UI.
const fromApi = (client) => {
  const fullName = `${client.nombre || ''} ${client.apellido || ''}`.trim();
  const statusMap = { ACTIVO: 'Activo', BLOQUEADO: 'Bloqueado', MULTADO: 'Multado', REGISTRADO: 'Pendiente' };
  return {
    id: client.id_cliente,
    name: fullName,
    email: client.email,
    phone: client.telefono || '',
    status: statusMap[client.estado] || client.estado,
    strikes: client.contador_strikes || 0,
    registrationDate: (client.fecha_registro || '2026-05-01').split('T')[0],
  };
};

const STATUS_FILTERS = ['Todos', 'Activo', 'Bloqueado', 'Multado'];

export const ClientsPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Fase 6 (Mateo): clientes reales desde MySQL, no de localStorage.
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchClients = async () => {
    try {
      setLoadError('');
      const data = await clienteService.getAll();
      setClients(data.map(fromApi));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const isEmpleado = user?.rol === 'empleado';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredClients = clients.filter((client) => {
    const clientName = client.name || '';
    const clientPhone = client.phone || '';
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // CUU5.1 / CUU5.2: bloqueo y desbloqueo contra MySQL (solo Dueño).
  const handleToggleClientBlock = async (client) => {
    if (isEmpleado) return;

    const clientName = client.name;
    try {
      const updated = fromApi(await clienteService.toggleBlock(client.id));
      setClients((prev) => prev.map((c) => (c.id === client.id ? updated : c)));
      if (updated.status === 'Bloqueado') {
        enqueueSnackbar(`Cliente ${clientName} ha sido BLOQUEADO.`, { variant: 'error' });
      } else {
        enqueueSnackbar(`Cliente ${clientName} ha sido DESBLOQUEADO.`, { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
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
      case 'Pendiente':
        return <Chip label="PENDIENTE" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label={status} size="small" />;
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
          background: `linear-gradient(135deg, ${BRAND_COLORS.card} 0%, ${BRAND_COLORS.greenTint} 100%)`,
          border: `1px solid ${withAlpha(BRAND_COLORS.successGreen, 0.3)}`,
          mb: 4,
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PeopleIcon sx={{ color: BRAND_COLORS.successGreen, fontSize: 32, flexShrink: 0 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
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

      {/* Buscador + Filtro por estado (Listado con Filtro + Detalle 1) */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, background: BRAND_COLORS.card }}>
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
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              clickable
              color={statusFilter === filter ? 'primary' : 'default'}
              variant={statusFilter === filter ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter(filter)}
              sx={{ fontWeight: 700 }}
            />
          ))}
        </Stack>
      </Paper>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          No se pudo conectar con el servidor backend: {loadError}
        </Alert>
      )}
      {loading && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Cargando clientes...
        </Typography>
      )}

      {/* Tabla de Clientes */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, background: BRAND_COLORS.card, border: `1px solid ${withAlpha(BRAND_COLORS.white, 0.08)}` }}>
        <Table>
          <TableHead sx={{ background: BRAND_COLORS.appBar }}>
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
