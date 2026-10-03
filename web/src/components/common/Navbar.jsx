import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Container,
  Divider,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ContentCut as ScissorsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  DesignServices as ServicesIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  EventAvailable as DateIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    setIsDrawerOpen(false);
    logout();
    navigate('/');
  };

  // Navegación desde el menú mobile (cierra el drawer al ir a la página)
  const handleDrawerNavigate = (path) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  const getRoleLabel = (rol) => {
    switch (rol) {
      case 'dueno':
        return 'Dueño (Admin)';
      case 'empleado':
        return 'Empleado';
      case 'cliente':
        return 'Cliente';
      default:
        return rol;
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'dueno':
        return 'secondary';
      case 'empleado':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <>
    <AppBar position="sticky" sx={{ background: '#121419', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: 70 }}>
          {/* Botón hamburguesa (solo mobile) */}
          {user && (
            <IconButton
              onClick={() => setIsDrawerOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: '#d4af37', mr: 1 }}
              aria-label="Abrir menú de navegación"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo & Branding */}
          <Box
            onClick={() => navigate(user ? (user.rol === 'dueno' ? '/dueno/home' : user.rol === 'empleado' ? '/empleado/home' : '/cliente/home') : '/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
              }}
            >
              <ScissorsIcon sx={{ color: '#121212', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                letterSpacing: 1,
                background: 'linear-gradient(90deg, #ffffff 0%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BARBERAZO
            </Typography>
          </Box>

          {/* Menú de Navegación según Rol */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {!user && (
              <>
                <Button color="inherit" onClick={() => navigate('/')}>Inicio</Button>
                <Button color="inherit" onClick={() => navigate('/login')}>Iniciar Sesión</Button>
                <Button variant="contained" color="primary" onClick={() => navigate('/registro')}>Registrarse</Button>
              </>
            )}

            {user?.rol === 'cliente' && (
              <>
                <Button
                  startIcon={<CalendarIcon />}
                  color={location.pathname.includes('/cliente/home') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/cliente/home')}
                >
                  Reservar Turno
                </Button>
                <Button
                  startIcon={
                    user.strikes > 0 ? (
                      <Badge badgeContent={user.strikes} color="error">
                        <WarningIcon fontSize="small" />
                      </Badge>
                    ) : (
                      <WarningIcon />
                    )
                  }
                  color={location.pathname.includes('/cliente/multas') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/cliente/multas')}
                >
                  Mis Multas {user.estado === 'Multado' && '(Pendiente)'}
                </Button>
                <Button
                  startIcon={<AccountCircle />}
                  color={location.pathname.includes('/cliente/perfil') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/cliente/perfil')}
                >
                  Mi Perfil
                </Button>
              </>
            )}

            {user?.rol === 'empleado' && (
              <>
                <Button
                  startIcon={<CalendarIcon />}
                  color={location.pathname.includes('/empleado/home') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/empleado/home')}
                >
                  Turnos
                </Button>
                <Button
                  startIcon={<PeopleIcon />}
                  color={location.pathname.includes('/empleado/clientes') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/empleado/clientes')}
                >
                  Clientes (Lectura)
                </Button>
                <Button
                  startIcon={<ServicesIcon />}
                  color={location.pathname.includes('/empleado/servicios') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/empleado/servicios')}
                >
                  Servicios (Lectura)
                </Button>
                <Button
                  startIcon={<StarIcon />}
                  color={location.pathname.includes('/empleado/resenas') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/empleado/resenas')}
                >
                  Reseñas
                </Button>
              </>
            )}

            {user?.rol === 'dueno' && (
              <>
                <Button
                  startIcon={<CalendarIcon />}
                  color={location.pathname.includes('/dueno/home') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/home')}
                >
                  Turnos
                </Button>
                <Button
                  startIcon={<PeopleIcon />}
                  color={location.pathname.includes('/dueno/clientes') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/clientes')}
                >
                  Clientes
                </Button>
                <Button
                  startIcon={<ServicesIcon />}
                  color={location.pathname.includes('/dueno/servicios') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/servicios')}
                >
                  Servicios
                </Button>
                <Button
                  startIcon={<BadgeIcon />}
                  color={location.pathname.includes('/dueno/empleados') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/empleados')}
                >
                  Empleados
                </Button>
                <Button
                  startIcon={<DateIcon />}
                  color={location.pathname.includes('/dueno/fechas') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/fechas')}
                >
                  Fechas y Horarios
                </Button>
                <Button
                  startIcon={<StarIcon />}
                  color={location.pathname.includes('/dueno/resenas') ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dueno/resenas')}
                >
                  Reseñas
                </Button>
              </>
            )}
          </Box>

          {/* User Profile & Actions */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={getRoleLabel(user.rol)}
                color={getRoleColor(user.rol)}
                size="small"
                sx={{ fontWeight: 700 }}
              />

              {user.rol === 'cliente' && (
                <Chip
                  label={user.estado === 'Multado' ? 'MULTADO' : `${user.strikes}/3 Strikes`}
                  color={user.estado === 'Multado' ? 'error' : user.strikes > 0 ? 'warning' : 'default'}
                  size="small"
                  variant="outlined"
                />
              )}

              <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: '#d4af37', color: '#121212', fontWeight: 'bold' }}>
                  {user.nombre.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { mt: 1.5, background: '#181b20', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200 },
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {user.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>

    {/* ─── Drawer mobile: mismos links por rol + logout ─── */}
    <Drawer
      anchor="left"
      open={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      PaperProps={{
        sx: { width: 270, background: '#121419', borderRight: '1px solid rgba(255,255,255,0.08)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2 }}>
        <ScissorsIcon sx={{ color: '#d4af37', fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
          BARBERAZO
        </Typography>
      </Box>
      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {user?.rol === 'cliente' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/cliente/home')}
                onClick={() => handleDrawerNavigate('/cliente/home')}
              >
                <ListItemIcon><CalendarIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Reservar Turno" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/cliente/multas')}
                onClick={() => handleDrawerNavigate('/cliente/multas')}
              >
                <ListItemIcon><WarningIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary={`Mis Multas${user.estado === 'Multado' ? ' (Pendiente)' : ''}`} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/cliente/perfil')}
                onClick={() => handleDrawerNavigate('/cliente/perfil')}
              >
                <ListItemIcon><AccountCircle sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Mi Perfil" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {user?.rol === 'empleado' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/empleado/home')}
                onClick={() => handleDrawerNavigate('/empleado/home')}
              >
                <ListItemIcon><CalendarIcon sx={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText primary="Turnos" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/empleado/clientes')}
                onClick={() => handleDrawerNavigate('/empleado/clientes')}
              >
                <ListItemIcon><PeopleIcon sx={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText primary="Clientes (Lectura)" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/empleado/servicios')}
                onClick={() => handleDrawerNavigate('/empleado/servicios')}
              >
                <ListItemIcon><ServicesIcon sx={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText primary="Servicios (Lectura)" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/empleado/resenas')}
                onClick={() => handleDrawerNavigate('/empleado/resenas')}
              >
                <ListItemIcon><StarIcon sx={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText primary="Reseñas" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {user?.rol === 'dueno' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/home')}
                onClick={() => handleDrawerNavigate('/dueno/home')}
              >
                <ListItemIcon><CalendarIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Turnos" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/clientes')}
                onClick={() => handleDrawerNavigate('/dueno/clientes')}
              >
                <ListItemIcon><PeopleIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Clientes" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/servicios')}
                onClick={() => handleDrawerNavigate('/dueno/servicios')}
              >
                <ListItemIcon><ServicesIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Servicios" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/empleados')}
                onClick={() => handleDrawerNavigate('/dueno/empleados')}
              >
                <ListItemIcon><BadgeIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Empleados" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/fechas')}
                onClick={() => handleDrawerNavigate('/dueno/fechas')}
              >
                <ListItemIcon><DateIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Fechas y Horarios" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname.includes('/dueno/resenas')}
                onClick={() => handleDrawerNavigate('/dueno/resenas')}
              >
                <ListItemIcon><StarIcon sx={{ color: '#d4af37' }} /></ListItemIcon>
                <ListItemText primary="Reseñas" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
    </>
  );
};
