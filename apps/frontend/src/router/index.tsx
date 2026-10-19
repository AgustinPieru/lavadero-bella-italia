import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { ROUTES } from './routes';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const AgendaPage = lazy(() => import('@/features/turnos/pages/AgendaPage'));
const ClientesListPage = lazy(() => import('@/features/clientes/pages/ClientesListPage'));
const ServiciosListPage = lazy(() => import('@/features/servicios/pages/ServiciosListPage'));
const HorariosPage = lazy(() => import('@/features/horarios/pages/HorariosPage'));
const EmpresasListPage = lazy(() => import('@/features/empresas/pages/EmpresasListPage'));
const FacturasListPage = lazy(() => import('@/features/facturas/pages/FacturasListPage'));
const GastosPage = lazy(() => import('@/features/gastos/pages/GastosPage'));
const ResenasListPage = lazy(() => import('@/features/resenas/pages/ResenasListPage'));
const EncuestaPage = lazy(() => import('@/features/resenas/pages/EncuestaPage'));
const ReportesPage = lazy(() => import('@/features/reportes/pages/ReportesPage'));
const TurneroPage = lazy(() => import('@/features/turnero/pages/TurneroPage'));

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Públicas, sin login ni layout de admin */}
        <Route path={ROUTES.TURNERO} element={<TurneroPage />} />
        <Route path={ROUTES.ENCUESTA} element={<EncuestaPage />} />

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<AgendaPage />} />
          <Route path={ROUTES.CLIENTES} element={<ClientesListPage />} />
          <Route path={ROUTES.SERVICIOS} element={<ServiciosListPage />} />
          <Route path={ROUTES.HORARIOS} element={<HorariosPage />} />
          <Route path={ROUTES.EMPRESAS} element={<EmpresasListPage />} />
          <Route path={ROUTES.FACTURACION} element={<FacturasListPage />} />
          <Route path={ROUTES.GASTOS} element={<GastosPage />} />
          <Route path={ROUTES.RESENAS} element={<ResenasListPage />} />
          <Route path={ROUTES.REPORTES} element={<ReportesPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  );
}
