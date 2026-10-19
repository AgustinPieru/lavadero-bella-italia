import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import { Visibility as VisibilityIcon, ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';
import { useCerrarDiario, useFacturas } from '../api/useFacturas';
import { Turno, useToggleFacturar } from '@/features/turnos/api/useTurnos';
import { formatPesos, formatFechaAgenda } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  fecha: string;
  fechaDate: Date;
  turnos: Turno[];
  onVerFactura: (id: number) => void;
}

// Reemplaza al "Cerrar control diario" de la demo. Dos pasos:
// 1. Revisión: los lavados completados que todavía no se facturaron, con el
//    mismo toggle Sí/No de la Agenda — última oportunidad de marcar "no
//    factura" antes de confirmar (por defecto todos quedan en Sí).
// 2. Confirmar: recién ahí se genera la facturación (agrupando por cliente,
//    consolidando empresas con más de un vehículo), y se ve el resultado
//    junto con lo que ya estuviera facturado ese día.
export default function ControlDiarioDialog({ open, onClose, fecha, fechaDate, turnos, onVerFactura }: Props) {
  const cerrarDiario = useCerrarDiario();
  const toggleFacturar = useToggleFacturar(fecha);
  const { data: facturas, isLoading: loadingFacturas } = useFacturas({ fecha });
  const [confirmado, setConfirmado] = useState(false);

  const completados = turnos.filter((t) => t.estado === 'COMPLETADO');
  const cancelados = turnos.filter((t) => t.estado === 'CANCELADO');
  const ingresos = completados.reduce((a, t) => a + t.precioNeto, 0);
  const pendientesDeFacturar = completados.filter((t) => t.facturaId === null);

  const handleClose = () => {
    setConfirmado(false);
    cerrarDiario.reset();
    onClose();
  };

  const handleConfirmar = () => {
    setConfirmado(true);
    cerrarDiario.mutate(fecha);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Control diario — {formatFechaAgenda(fechaDate)}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          {[
            { label: 'Turnos', value: String(turnos.length) },
            { label: 'Completados', value: String(completados.length) },
            { label: 'Cancelados', value: String(cancelados.length) },
            { label: 'Ingresos', value: formatPesos(ingresos) },
          ].map((s) => (
            <Box key={s.label} sx={{ flex: '1 1 110px', p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {s.label}
              </Typography>
              <Typography fontWeight={800}>{s.value}</Typography>
            </Box>
          ))}
        </Box>

        {pendientesDeFacturar.length > 0 && (
          <>
            <Typography variant="overline" color="text.secondary">
              Lavados a facturar — revisá antes de confirmar
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Neto</TableCell>
                  <TableCell>Factura</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendientesDeFacturar.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.hora}</TableCell>
                    <TableCell>{t.vehiculo.cliente.denominacion}</TableCell>
                    <TableCell align="right">{formatPesos(t.precioNeto)}</TableCell>
                    <TableCell>
                      <Chip
                        label={t.facturar ? 'Sí' : 'No'}
                        color={t.facturar ? 'success' : 'default'}
                        size="small"
                        onClick={() => toggleFacturar.mutate(t.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              "No" es para lavados que se cobran pero no entran en la factura (se puede tocar para cambiar).
            </Typography>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        <Typography variant="overline" color="text.secondary">
          Facturación del día
        </Typography>

        {!confirmado ? (
          <Box py={3} textAlign="center" color="text.secondary">
            {pendientesDeFacturar.length === 0 && !facturas?.length
              ? 'Sin lavados completados para facturar este día.'
              : 'Revisá arriba y confirmá para generar la facturación.'}
          </Box>
        ) : cerrarDiario.isPending || loadingFacturas ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </Box>
        ) : cerrarDiario.isError ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            No se pudo cerrar el control diario. Probá de nuevo.
          </Alert>
        ) : (
          <>
            {cerrarDiario.isSuccess && (
              <Alert severity={cerrarDiario.data.length ? 'success' : 'info'} sx={{ mt: 1, mb: 1 }}>
                {cerrarDiario.data.length
                  ? `Se generaron ${cerrarDiario.data.length} factura${cerrarDiario.data.length === 1 ? '' : 's'} nueva${cerrarDiario.data.length === 1 ? '' : 's'}.`
                  : 'No había lavados marcados para facturar — las facturas de abajo ya estaban generadas.'}
              </Alert>
            )}

            {!facturas?.length ? (
              <Box py={3} textAlign="center" color="text.secondary">
                Sin facturas para este día.
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N°</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Comprobante</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {facturas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{f.numero}</TableCell>
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
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        {formatPesos(f.total)}
                      </TableCell>
                      <TableCell>
                        <Chip label={f.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'} color={f.estado === 'PAGADA' ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => onVerFactura(f.id)} title="Ver">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cerrar</Button>
        {!confirmado && (pendientesDeFacturar.length > 0 || !facturas?.length) && (
          <Button variant="contained" startIcon={<ReceiptLongIcon />} onClick={handleConfirmar}>
            Confirmar cierre diario
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
