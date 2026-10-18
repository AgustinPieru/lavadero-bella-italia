import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Assignment as AgendaIcon,
  People as PeopleIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '@/features/auth/hooks/useAuthContext';
import { ROUTES } from '@/router/routes';

const DRAWER_WIDTH = 240;

// Mismos tonos que la demo (demo.html): --accent-soft / --accent para el
// estado activo de la navegación, en vez de los colores por defecto de MUI.
const ACCENT_SOFT = '#e2f3ea';

// Se va completando a medida que avanzamos por las etapas del roadmap
// (Servicios, Horarios, Empresas, Facturación, Gastos, Reseñas, Reportes).
const navItems = [
  { label: 'Agenda', icon: <AgendaIcon />, path: ROUTES.DASHBOARD },
  { label: 'Clientes', icon: <PeopleIcon />, path: ROUTES.CLIENTES },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1, px: 1.5 }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }} disablePadding>
          {navItems.map((item) => {
            const isActive =
              item.path === ROUTES.DASHBOARD ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: ACCENT_SOFT,
                    '&:hover': { bgcolor: ACCENT_SOFT },
                  },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'rgba(245,250,247,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'primary.dark',
          width: { md: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { md: drawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: (t) => t.transitions.create(['width', 'margin'], { easing: t.transitions.easing.sharp, duration: t.transitions.duration.leavingScreen }),
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ color: 'text.secondary' }}>
            {drawerOpen && !isMobile ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: 'background.paper',
              border: '2.5px solid',
              borderColor: 'primary.dark',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flex: 'none',
            }}
          >
            🚛
          </Box>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: 18 }}>
            Bella Italia
          </Typography>
          <Tooltip title={user?.name ?? 'Usuario'}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: ACCENT_SOFT, color: 'primary.dark', fontSize: 14, fontWeight: 700 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
              {user?.email}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.default',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={drawerOpen}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.default',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: 'background.default',
          minHeight: '100vh',
          transition: (t) => t.transitions.create('margin', { easing: t.transitions.easing.sharp, duration: t.transitions.duration.leavingScreen }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
