import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Divider,
  Typography,
} from '@mui/material';
import { useClientes, Cliente } from '@/features/clientes/api/useClientes';
import ClienteFormDialog from '@/features/clientes/components/ClienteFormDialog';
import { useServicios } from '@/features/servicios/api/useServicios';
import { useCreateTurno, useUpdateTurno, Turno, Linea, FormaPago } from '../api/useTurnos';
import { HORAS_AGENDA } from '@/lib/timeSlots';
import { formatPesos } from '@/lib/format';

const NUEVO_CLIENTE = '__nuevo__';

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  CONTADO: 'Contado',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CUENTA_CORRIENTE: 'Cuenta corriente',
};

interface Props {
  open: boolean;
  onClose: () => void;
  fecha: string;
  turno?: Turno; // si viene, es edición
}

export default function TurnoFormDialog({ open, onClose, fecha, turno }: Props) {
  const editing = !!turno;
  const { data: clientes } = useClientes();
  const createTurno = useCreateTurno(fecha);
  const updateTurno = useUpdateTurno(fecha);

  const [clienteId, setClienteId] = useState<number | ''>('');
  const [vehiculoId, setVehiculoId] = useState<number | ''>('');
  const [servicioId, setServicioId] = useState<number | ''>('');
  const [hora, setHora] = useState(HORAS_AGENDA[0]);
  const [linea, setLinea] = useState<Linea>('A');
  const [formaPago, setFormaPago] = useState<FormaPago>('CONTADO');
  const [pagado, setPagado] = useState(false);
  const [facturar, setFacturar] = useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [error, setError] = useState('');

  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId);
  const vehiculosDelCliente = useMemo(
    () => (clienteSeleccionado?.vehiculos ?? []).filter((v) => v.activo),
    [clienteSeleccionado]
  );
  const vehiculoSeleccionado = vehiculosDelCliente.find((v) => v.id === vehiculoId);

  const { data: servicios } = useServicios(vehiculoSeleccionado?.tipo, vehiculoSeleccionado?.subtipo);

  // Reinicia (o precarga, si es edición) el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setError('');
    if (turno) {
      setClienteId(turno.vehiculo.clienteId);
      setVehiculoId(turno.vehiculoId);
      setServicioId(turno.servicioId);
      setHora(turno.hora);
      setLinea(turno.linea);
      setFormaPago(turno.formaPago);
      setPagado(turno.pagado);
      setFacturar(turno.facturar);
    } else {
      setClienteId('');
      setVehiculoId('');
      setServicioId('');
      setHora(HORAS_AGENDA[0]);
      setLinea('A');
      setFormaPago('CONTADO');
      setPagado(false);
      setFacturar(true);
    }
  }, [open, turno]);

  const handleClienteChange = (value: string) => {
    if (value === NUEVO_CLIENTE) {
      setQuickCreateOpen(true);
      return;
    }
    setClienteId(Number(value));
    setVehiculoId('');
    setServicioId('');
  };

  const handleClienteCreado = (cliente: Cliente) => {
    setQuickCreateOpen(false);
    setClienteId(cliente.id);
    setVehiculoId(cliente.vehiculos[0]?.id ?? '');
    setServicioId('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!vehiculoId || !servicioId) {
      setError('Completá cliente, vehículo y servicio');
      return;
    }
    const data = {
      hora,
      linea,
      vehiculoId: Number(vehiculoId),
      servicioId: Number(servicioId),
      formaPago,
      pagado,
      facturar,
    };
    try {
      if (editing) {
        await updateTurno.mutateAsync({ id: turno.id, data });
      } else {
        await createTurno.mutateAsync({ ...data, fecha });
      }
      onClose();
    } catch {
      setError('No se pudo guardar el turno');
    }
  };

  const saving = createTurno.isPending || updateTurno.isPending;
  const servicioSeleccionado = servicios?.find((s) => s.id === servicioId);
  const descuentoPct = clienteSeleccionado?.esEmpresa ? clienteSeleccionado.descuentoPct ?? 0 : 0;
  const precioConDescuento = servicioSeleccionado
    ? Math.round(servicioSeleccionado.precio * (1 - descuentoPct / 100))
    : 0;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar turno' : 'Nuevo turno presencial'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField select label="Cliente" value={clienteId} onChange={(e) => handleClienteChange(e.target.value)} fullWidth>
              {(clientes ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.denominacion}
                </MenuItem>
              ))}
              <Divider component="li" />
              <MenuItem value={NUEVO_CLIENTE} sx={{ color: 'primary.main', fontWeight: 600 }}>
                + Nuevo cliente
              </MenuItem>
            </TextField>

            <TextField
              select
              label="Vehículo"
              value={vehiculoId}
              onChange={(e) => {
                setVehiculoId(Number(e.target.value));
                setServicioId('');
              }}
              fullWidth
              disabled={!vehiculosDelCliente.length}
              helperText={clienteSeleccionado && !vehiculosDelCliente.length ? 'Este cliente no tiene vehículos activos' : ' '}
            >
              {vehiculosDelCliente.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.tipo === 'CAMION' ? '🚛' : '🚗'} {v.subtipo} · {v.patente || 'sin patente'}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Servicio"
              value={servicioId}
              onChange={(e) => setServicioId(Number(e.target.value))}
              fullWidth
              disabled={!servicios?.length}
            >
              {(servicios ?? []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre} · {formatPesos(s.precio)}
                </MenuItem>
              ))}
            </TextField>
            {servicioSeleccionado && (
              <Typography variant="caption" color="text.secondary" mt={-1.5}>
                Precio neto, sin IVA.
                {descuentoPct > 0 && (
                  <>
                    {' '}
                    Con el {descuentoPct}% de descuento de empresa: <strong>{formatPesos(precioConDescuento)}</strong>.
                  </>
                )}
              </Typography>
            )}

            <TextField select label="Hora" value={hora} onChange={(e) => setHora(e.target.value)} fullWidth>
              {HORAS_AGENDA.map((h) => (
                <MenuItem key={h} value={h}>
                  {h}
                </MenuItem>
              ))}
            </TextField>

            <TextField select label="Línea" value={linea} onChange={(e) => setLinea(e.target.value as Linea)} fullWidth>
              <MenuItem value="A">Línea A</MenuItem>
              <MenuItem value="B">Línea B (contingencia)</MenuItem>
            </TextField>

            <TextField select label="Forma de pago" value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago)} fullWidth>
              {Object.entries(FORMA_PAGO_LABEL).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField select label="Estado de pago" value={pagado ? 'si' : 'no'} onChange={(e) => setPagado(e.target.value === 'si')} fullWidth>
              <MenuItem value="si">Pagado</MenuItem>
              <MenuItem value="no">Pendiente</MenuItem>
            </TextField>

            <TextField select label="Emitir factura" value={facturar ? 'si' : 'no'} onChange={(e) => setFacturar(e.target.value === 'si')} fullWidth>
              <MenuItem value="si">Sí</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </TextField>
            <Typography variant="caption" color="text.secondary" mt={-1.5}>
              "No" es para lavados que se cobran pero no entran en la facturación del cierre diario.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            Guardar turno
          </Button>
        </DialogActions>
      </Dialog>

      <ClienteFormDialog open={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} onSaved={handleClienteCreado} />
    </>
  );
}
