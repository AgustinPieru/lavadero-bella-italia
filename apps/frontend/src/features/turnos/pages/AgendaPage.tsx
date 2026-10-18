import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Replay as ReplayIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  useTurnosDelDia,
  useCompletarTurno,
  useReabrirTurno,
  useCancelarTurno,
  useTogglePago,
  useToggleFacturar,
  Turno,
  EstadoTurno,
} from '../api/useTurnos';
import TurnoFormDialog from '../components/TurnoFormDialog';
import TurnoStatTiles from '../components/TurnoStatTiles';
import { isoDate, formatFechaAgenda, formatPesos } from '@/lib/format';

const ESTADO_LABEL: Record<EstadoTurno, string> = {
  RESERVADO: 'Reservado',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};
const ESTADO_COLOR: Record<EstadoTurno, 'warning' | 'success' | 'error'> = {
  RESERVADO: 'warning',
  COMPLETADO: 'success',
  CANCELADO: 'error',
};

export default function AgendaPage() {
  const [offset, setOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | undefined>(undefined);

  const fechaDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const fecha = isoDate(fechaDate);

  const { data: turnos, isLoading } = useTurnosDelDia(fecha);
  const completar = useCompletarTurno(fecha);
  const reabrir = useReabrirTurno(fecha);
  const cancelar = useCancelarTurno(fecha);
  const togglePago = useTogglePago(fecha);
  const toggleFacturar = useToggleFacturar(fecha);

  const openNuevo = () => {
    setEditingTurno(undefined);
    setDialogOpen(true);
  };
  const openEditar = (t: Turno) => {
    setEditingTurno(t);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Agenda
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
            <IconButton size="small" onClick={() => setOffset((o) => o - 1)} aria-label="Día anterior">
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography fontWeight={600}>{formatFechaAgenda(fechaDate)}</Typography>
            <IconButton size="small" onClick={() => setOffset((o) => o + 1)} aria-label="Día siguiente">
              <ChevronRight fontSize="small" />
            </IconButton>
            {offset !== 0 && (
              <Button size="small" onClick={() => setOffset(0)}>
                Volver a hoy
              </Button>
            )}
          </Stack>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNuevo}>
          Nuevo turno
        </Button>
      </Stack>

      {isLoading || !turnos ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TurnoStatTiles turnos={turnos} />

          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {turnos.length === 0 ? (
                <Box py={6} textAlign="center" color="text.secondary">
                  No hay turnos cargados para este día.
                  <br />
                  Podés agregar uno con &quot;Nuevo turno&quot;.
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Hora</TableCell>
                        <TableCell>Línea</TableCell>
                        <TableCell>Vehículo</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Pago</TableCell>
                        <TableCell>Factura</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {turnos.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{t.hora}</TableCell>
                          <TableCell>
                            <Chip label={t.linea} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {t.vehiculo.tipo === 'CAMION' ? '🚛' : '🚗'} {t.vehiculo.subtipo}
                          </TableCell>
                          <TableCell>
                            {t.vehiculo.cliente.denominacion}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {t.vehiculo.patente}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {t.servicio.nombre}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatPesos(t.servicio.precio)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={ESTADO_LABEL[t.estado]} color={ESTADO_COLOR[t.estado]} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.pagado ? 'Pagado' : 'Pendiente'}
                              color={t.pagado ? 'success' : 'warning'}
                              size="small"
                              onClick={() => togglePago.mutate(t.id)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.facturar ? 'Sí' : 'No'}
                              color={t.facturar ? 'success' : 'default'}
                              size="small"
                              onClick={() => toggleFacturar.mutate(t.id)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEditar(t)} title="Editar">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {t.estado === 'RESERVADO' && (
                              <IconButton size="small" color="primary" onClick={() => completar.mutate(t.id)} title="Completar">
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            )}
                            {t.estado === 'COMPLETADO' && (
                              <IconButton size="small" onClick={() => reabrir.mutate(t.id)} title="Reabrir">
                                <ReplayIcon fontSize="small" />
                              </IconButton>
                            )}
                            {t.estado !== 'CANCELADO' && (
                              <IconButton size="small" color="error" onClick={() => cancelar.mutate(t.id)} title="Cancelar">
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <TurnoFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} fecha={fecha} turno={editingTurno} />
    </Box>
  );
}
