import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFactura, useEmitirEnArca } from '../api/useFacturas';
import { formatPesos } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  facturaId?: number;
}

export default function FacturaDetailDialog({ open, onClose, facturaId }: Props) {
  const { data: factura, isLoading } = useFactura(facturaId);
  const emitirEnArca = useEmitirEnArca();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Factura {factura?.numero}</DialogTitle>
      <DialogContent>
        {isLoading || !factura ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography fontWeight={700}>{factura.cliente.denominacion}</Typography>
              </Box>
              <Chip label={factura.comprobante === 'ARCA' ? 'ARCA' : 'Interna'} color={factura.comprobante === 'ARCA' ? 'success' : 'default'} />
              <Chip label={factura.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'} color={factura.estado === 'PAGADA' ? 'success' : 'warning'} />
            </Box>

            {factura.cae ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                CAE {factura.cae} — vence {factura.caeFchVto?.slice(0, 10)} · comprobante {factura.puntoVenta?.toString().padStart(4, '0')}-
                {factura.numeroArca?.toString().padStart(8, '0')}
              </Alert>
            ) : factura.comprobante === 'ARCA' ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Todavía no se emitió contra ARCA (comprobante interno hasta que haya certificado configurado).
              </Alert>
            ) : null}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hora</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell align="right">Neto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {factura.turnos.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{t.hora}</TableCell>
                    <TableCell>
                      {t.vehiculo.tipo === 'CAMION' ? '🚛' : '🚗'} {t.vehiculo.subtipo} · {t.vehiculo.patente}
                    </TableCell>
                    <TableCell>{t.servicio.nombre}</TableCell>
                    <TableCell align="right">{formatPesos(t.precioNeto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box display="flex" justifyContent="flex-end" gap={4} mt={2}>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Neto
                </Typography>
                <Typography>{formatPesos(factura.neto)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  IVA (21%)
                </Typography>
                <Typography>{formatPesos(factura.iva)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Total
                </Typography>
                <Typography fontWeight={800}>{formatPesos(factura.total)}</Typography>
              </Box>
            </Box>

            {emitirEnArca.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                No se pudo emitir en ARCA — revisá la configuración del certificado.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {factura?.comprobante === 'ARCA' && !factura.cae && (
          <Button variant="contained" onClick={() => emitirEnArca.mutate(factura.id)} disabled={emitirEnArca.isPending}>
            Emitir en ARCA
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
