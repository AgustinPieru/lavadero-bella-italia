import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert } from '@mui/material';
import { useCreateCliente, Cliente, VehiculoTipo } from '../api/useClientes';
import { useSubtipos } from '@/features/servicios/api/useServicios';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: Cliente) => void;
}

const initialState = {
  denominacion: '',
  telefono: '',
  cuit: '',
  vehiculo: 'CAMION' as VehiculoTipo,
  subtipo: '',
  marca: '',
  modelo: '',
  patente: '',
};

// Alta rápida desde el modal de turno — para un cliente que llega sin estar
// registrado. El ABM completo de Clientes (búsqueda, edición, baja) llega en
// la Etapa 3b.
export default function ClienteQuickCreateDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(initialState);
  const { data: subtipos } = useSubtipos(form.vehiculo);
  const createCliente = useCreateCliente();

  const set = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleClose = () => {
    setForm(initialState);
    createCliente.reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.denominacion.trim() || !form.telefono.trim() || !form.subtipo) return;
    const cliente = await createCliente.mutateAsync({
      ...form,
      cuit: form.cuit || undefined,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      patente: form.patente || undefined,
    });
    setForm(initialState);
    onCreated(cliente);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nuevo cliente</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {createCliente.isError && <Alert severity="error">No se pudo crear el cliente</Alert>}
          <TextField label="Denominación" value={form.denominacion} onChange={set('denominacion')} required fullWidth autoFocus />
          <TextField label="Teléfono" value={form.telefono} onChange={set('telefono')} required fullWidth />
          <TextField label="CUIT / CUIL (opcional)" value={form.cuit} onChange={set('cuit')} fullWidth />
          <TextField
            select
            label="Tipo de vehículo"
            value={form.vehiculo}
            onChange={(e) => setForm((f) => ({ ...f, vehiculo: e.target.value as VehiculoTipo, subtipo: '' }))}
            fullWidth
          >
            <MenuItem value="CAMION">Camión</MenuItem>
            <MenuItem value="AUTO">Auto</MenuItem>
          </TextField>
          <TextField select label="Subtipo" value={form.subtipo} onChange={set('subtipo')} required fullWidth disabled={!subtipos?.length}>
            {(subtipos ?? []).map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Marca" value={form.marca} onChange={set('marca')} fullWidth />
          <TextField label="Modelo" value={form.modelo} onChange={set('modelo')} fullWidth />
          <TextField label="Patente" value={form.patente} onChange={set('patente')} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createCliente.isPending || !form.denominacion.trim() || !form.telefono.trim() || !form.subtipo}
        >
          Guardar cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
}
