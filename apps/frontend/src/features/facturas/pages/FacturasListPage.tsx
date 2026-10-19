import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useFacturas, useMarcarPagada, useSaldoPendiente } from '../api/useFacturas';
import { useClientes } from '@/features/clientes/api/useClientes';
import FacturaDetailDialog from '../components/FacturaDetailDialog';
import { formatPesos } from '@/lib/format';

export default function FacturasListPage() {
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [detailId, setDetailId] = useState<number | undefined>(undefined);

  const { data: clientes } = useClientes({ incluirInactivos: true });
  const { data: facturas, isLoading } = useFacturas(clienteId ? { clienteId } : {});
  const { data: saldo } = useSaldoPendiente(clienteId || undefined);
  const marcarPagada = useMarcarPagada();

  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId);

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Facturación
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Las facturas se generan automáticamente al cerrar el control diario de cada fecha, desde la Agenda.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} mb={2}>
        <TextField
          select
          label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : '')}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">Todos los clientes</MenuItem>
          {(clientes ?? []).map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.denominacion}
            </MenuItem>
          ))}
        </TextField>

        {clienteSeleccionado?.cuentaCorrienteHabilitada && (
          <Chip
            label={`Saldo pendiente: ${formatPesos(saldo ?? 0)}`}
            color={(saldo ?? 0) > 0 ? 'warning' : 'success'}
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {isLoading || !facturas ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {facturas.length === 0 ? (
              <Box py={6} textAlign="center" color="text.secondary">
                Sin facturas emitidas todavía (se generan al cerrar el control diario, en Agenda).
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>N°</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Comprobante</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facturas.map((f) => (
                      <TableRow key={f.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{f.numero}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{f.fecha.slice(0, 10)}</TableCell>
                        <TableCell>
                          {f.cliente.denominacion}
                          {f.turnos.length > 1 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {f.turnos.length} vehículos, consolidado
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={f.comprobante === 'ARCA' ? 'ARCA' : 'Interna'} color={f.comprobante === 'ARCA' ? 'success' : 'default'} size="small" />
                          {f.cae && <Chip label="CAE" size="small" variant="outlined" sx={{ ml: 0.5 }} />}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatPesos(f.total)}
                        </TableCell>
                        <TableCell>
                          <Chip label={f.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'} color={f.estado === 'PAGADA' ? 'success' : 'warning'} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => setDetailId(f.id)} title="Ver">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {f.estado === 'PENDIENTE' && (
                            <Button size="small" startIcon={<CheckCircleIcon fontSize="small" />} onClick={() => marcarPagada.mutate(f.id)}>
                              Cobrar
                            </Button>
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
      )}

      <FacturaDetailDialog open={!!detailId} onClose={() => setDetailId(undefined)} facturaId={detailId} />
    </Box>
  );
}
