import { createTheme } from '@mui/material/styles';

// Paleta tomada directamente de la demo (demo.html): el isologo tiene aro
// verde oscuro, interior blanco, camión en verde medio y una ola celeste-agua.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f7a54',
      light: '#3d9c73',
      dark: '#163d30',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d97b3c',
      light: '#e59a66',
      dark: '#b05f27',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5faf7',
      paper: '#ffffff',
    },
    text: {
      primary: '#14261f',
      secondary: '#4b6459',
    },
    success: { main: '#0e7490' },
    warning: { main: '#a5680f' },
    error: { main: '#b3401f' },
  },
  typography: {
    fontFamily: '"Mulish", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(20,38,31,0.12)' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid rgba(20,38,31,0.12)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiTextField: {
      defaultProps: {
        InputLabelProps: { shrink: true },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
    },
    MuiOutlinedInput: {
      defaultProps: { notched: true },
    },
  },
});

export default theme;
