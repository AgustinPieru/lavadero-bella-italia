import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert } from '@mui/material';
import { useAddVehiculo, useUpdateVehiculo } from '../api/useVehiculos';
import { Vehiculo, VehiculoTipo } from '../api/useClientes';
import { useSubtipos } from '@/features/servicios/api/useServicios';

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: number;
  vehiculo?: Vehiculo; // si viene, es edición
}

const emptyForm = { tipo: 'CAMION' as VehiculoTipo, subtipo: '', marca: '', modelo: '', patente: '' };

export default function VehiculoFormDialog({ open, onClose, clienteId, vehiculo }: Props) {
  const editing = !!vehiculo;
  const [form, setForm] = useState(emptyForm);
  const { data: subtipos } = useSubtipos(form.tipo);
  const addVehiculo = useAddVehiculo(clienteId);
  const updateVehiculo = useUpdateVehiculo(clienteId);

  useEffect(() => {
    if (!open) return;
    if (vehiculo) {
      setForm({
        tipo: vehiculo.tipo,
        subtipo: vehiculo.subtipo,
        marca: vehiculo.marca ?? '',
        modelo: vehiculo.modelo ?? '',
        patente: vehiculo.patente ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, vehiculo]);

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const saving = addVehiculo.isPending || updateVehiculo.isPending;
  const error = addVehiculo.isError || updateVehiculo.isError;
  const valid = !!form.subtipo;

  const handleSubmit = async () => {
    if (!valid) return;
    const data = {
      ...form,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      patente: form.patente || undefined,
    };
    if (editing) {
      await updateVehiculo.mutateAsync({ id: vehiculo.id, data });
    } else {
      await addVehiculo.mutateAsync(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'Editar vehículo' : 'Nuevo vehículo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">No se pudo guardar el vehículo</Alert>}
          <TextField
            select
            label="Tipo de vehículo"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as VehiculoTipo, subtipo: '' }))}
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !valid}>
          Guardar vehículo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
