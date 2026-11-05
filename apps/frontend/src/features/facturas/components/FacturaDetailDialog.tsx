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
import { Download as DownloadIcon, WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { useOrdenTrabajo, useEmitirEnArca, useDescargarOrdenTrabajo, useEnviarOrdenTrabajo, comprobanteLabel, comprobanteColor } from '../api/useFacturas';
import { formatPesos } from '@/lib/format';

const ERROR_ENVIO_LABEL: Record<string, string> = {
  WHATSAPP_NO_CONFIGURADO: 'WhatsApp no está configurado — vinculá un número desde WhatsApp en el panel.',
  NUMERO_NO_REGISTRADO: 'El teléfono del cliente no está registrado en WhatsApp.',
};

interface Props {
  open: boolean;
  onClose: () => void;
  facturaId?: number;
}

// Muestra la orden de trabajo consolidada del cliente para el día de la
// factura por la que se entró — todos sus lavados juntos, sin importar en
// cuántos comprobantes hayan quedado repartidos (ver
// facturas.service.ts#getOrdenTrabajoDelDia). Por eso ya no se pide una
// sola Factura: se pide la orden del día entero y se listan sus
// comprobantes aparte, cada uno con su propio estado/CAE.
export default function FacturaDetailDialog({ open, onClose, facturaId }: Props) {
  const { data: orden, isLoading } = useOrdenTrabajo(facturaId);
  const emitirEnArca = useEmitirEnArca();
  const descargarOrdenTrabajo = useDescargarOrdenTrabajo();
  const enviarOrdenTrabajo = useEnviarOrdenTrabajo();

  const codigoErrorEnvio = (enviarOrdenTrabajo.error as AxiosError<{ code?: string }>)?.response?.data?.code;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Orden de trabajo{orden ? ` — ${orden.cliente.denominacion}` : ''}</DialogTitle>
      <DialogContent>
        {isLoading || !orden ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {new Date(`${orden.fecha.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-AR', {
                timeZone: 'UTC',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Typography>

            <Typography variant="overline" color="text.secondary">
              Comprobantes del día
            </Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {orden.facturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{f.numero}</TableCell>
                    <TableCell>
                      <Chip label={comprobanteLabel(f)} color={comprobanteColor(f)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={f.estado === 'PAGADA' ? 'Pagada' : 'Pendiente'} color={f.estado === 'PAGADA' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {formatPesos(f.total)}
                    </TableCell>
                    <TableCell align="right">
                      {f.comprobante === 'ARCA' && !f.cae && (
                        <Button size="small" onClick={() => emitirEnArca.mutate(f.id)} disabled={emitirEnArca.isPending}>
                          Emitir en ARCA
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {orden.facturas.map((f) =>
              f.cae ? (
                <Alert key={f.id} severity="success" sx={{ mb: 1 }}>
                  CAE {f.cae} ({f.numero}) — vence {f.caeFchVto?.slice(0, 10)} · comprobante {f.puntoVenta?.toString().padStart(4, '0')}-
                  {f.numeroArca?.toString().padStart(8, '0')}
                </Alert>
              ) : f.comprobante === 'ARCA' ? (
                <Alert key={f.id} severity="info" sx={{ mb: 1 }}>
                  {f.numero} todavía no se emitió contra ARCA (comprobante interno hasta que haya certificado configurado).
                </Alert>
              ) : null
            )}

            <Typography variant="overline" color="text.secondary">
              Trabajos realizados
            </Typography>
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
                {orden.turnos.map((t) => (
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
                <Typography>{formatPesos(orden.neto)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  IVA
                </Typography>
                <Typography>{formatPesos(orden.iva)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Total
                </Typography>
                <Typography fontWeight={800}>{formatPesos(orden.total)}</Typography>
              </Box>
            </Box>

            {emitirEnArca.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                No se pudo emitir en ARCA — revisá la configuración del certificado.
              </Alert>
            )}

            {enviarOrdenTrabajo.isSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Orden de trabajo enviada por WhatsApp a {orden.cliente.denominacion}.
              </Alert>
            )}
            {enviarOrdenTrabajo.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {ERROR_ENVIO_LABEL[codigoErrorEnvio ?? ''] ?? 'No se pudo enviar la orden de trabajo. Probá de nuevo.'}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
        {orden && (
          <>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => descargarOrdenTrabajo.mutate({ facturaId: orden.facturas[0].id, fecha: orden.fecha })}
              disabled={descargarOrdenTrabajo.isPending}
            >
              Descargar PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<WhatsAppIcon />}
              onClick={() => enviarOrdenTrabajo.mutate(orden.facturas[0].id)}
              disabled={enviarOrdenTrabajo.isPending}
            >
              Enviar orden de trabajo
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
