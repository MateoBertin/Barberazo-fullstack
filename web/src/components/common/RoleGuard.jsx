import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            textAlign: 'center',
            background: '#181b20',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 4,
          }}
        >
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Acceso Restringido
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tu usuario con rol <strong>{user.rol}</strong> no posee facultades para acceder a esta sección.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (user.rol === 'dueno') window.location.href = '/dueno/home';
              else if (user.rol === 'empleado') window.location.href = '/empleado/home';
              else window.location.href = '/cliente/home';
            }}
          >
            Volver a Mi Panel Principal
          </Button>
        </Paper>
      </Container>
    );
  }

  return children;
};
