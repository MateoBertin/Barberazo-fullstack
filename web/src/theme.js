import { createTheme } from '@mui/material/styles';

// Fuente única de colores de marca (Paso 0 Fase 6).
// La paleta MUI y los componentes importan desde acá: un solo lugar para cambiar.
export const BRAND_COLORS = {
  gold: '#d4af37', // Dorado elegante / Barbería premium
  brightGreen: '#22c55e', // Verde brillante (estados habilitados)
  danger: '#ef4444', // Rojo (errores y deshabilitados)
  card: '#181b20', // Fondo de tarjetas y paneles
  deepGreen: '#0f1a0f', // Fondo degradado del encabezado de Fechas
  white: '#ffffff',
  infoBlue: '#3b82f6', // Azul (empleados y datos informativos)
  successGreen: '#10b981', // Verde (precios, clientes y éxitos)
  mutedGray: '#9ca3af', // Gris (estados neutros)
  darkPanel: '#1e2229', // Fondo de tarjetas de estadísticas y tablas
  appBar: '#121419', // Fondo de barra y encabezados de tabla
  goldTint: '#2a2215', // Degradado oscuro dorado (dueño)
  blueTint: '#172433', // Degradado oscuro azul (empleados)
  greenTint: '#1c2b20', // Degradado oscuro verde (clientes)
  neutralTint: '#22262f', // Degradado oscuro neutro (servicios y reseñas)
};

// Agrega transparencia a un color hexadecimal ('#22c55e' + 0.28 => 'rgba(34,197,94,0.28)')
export const withAlpha = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: BRAND_COLORS.gold, // Dorado elegante / Barbería premium
      light: '#f3e5ab',
      dark: '#aa8c2c',
      contrastText: '#121212',
    },
    secondary: {
      main: '#e65100', // Naranja/Ámbar de acento
      light: '#ff833a',
      dark: '#ac1900',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f1115',
      paper: BRAND_COLORS.card,
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    error: {
      main: BRAND_COLORS.danger,
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    info: {
      main: '#3b82f6',
    },
    custom: {
      brightGreen: BRAND_COLORS.brightGreen,
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
  },
});

export default theme;
