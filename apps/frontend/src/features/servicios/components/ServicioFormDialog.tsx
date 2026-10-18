import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert, Typography } from '@mui/material';
import { useCreateServicio, useUpdateServicio, Servicio } from '../api/useServicios';
import type { VehiculoTipo } from '@/features/clientes/api/useClientes';

interface Props {
  open: boolean;
  onClose: () => void;
  servicio?: Servicio; // si viene, es edición
}

const emptyForm = { nombre: '', descripcion: '', vehiculo: 'CAMION' as VehiculoTipo, subtipo: '', precio: '' };

// El subtipo es texto libre a propósito: no hay una lista fija de subtipos
// de vehículo (ver demo.html) — lo que el admin escribe acá es lo que
// después aparece como pestaña en el turnero y como opción en Clientes/Turnos.
export default function ServicioFormDialog({ open, onClose, servicio }: Props) {
  const editing = !!servicio;
  const [form, setForm] = useState(emptyForm);
  const createServicio = useCreateServicio();
  const updateServicio = useUpdateServicio();

  useEffect(() => {
    if (!open) return;
    if (servicio) {
      setForm({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion ?? '',
        vehiculo: servicio.vehiculo,
        subtipo: servicio.subtipo,
        precio: String(servicio.precio),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, servicio]);

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const saving = createServicio.isPending || updateServicio.isPending;
  const error = createServicio.isError || updateServicio.isError;
  const precioNum = Number(form.precio);
  const valid = form.nombre.trim() && form.subtipo.trim() && precioNum > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    const data = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      vehiculo: form.vehiculo,
      subtipo: form.subtipo.trim(),
      precio: precioNum,
    };
    if (editing) {
      await updateServicio.mutateAsync({ id: servicio.id, data });
    } else {
      await createServicio.mutateAsync(data);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">No se pudo guardar el servicio</Alert>}
          <TextField label="Nombre" value={form.nombre} onChange={set('nombre')} required fullWidth autoFocus placeholder="Ej: Lavado premium" />
          <TextField label="Descripción" value={form.descripcion} onChange={set('descripcion')} fullWidth placeholder="Ej: Exterior + interior + cera" />
          <TextField
            select
            label="Tipo de vehículo"
            value={form.vehiculo}
            onChange={(e) => setForm((f) => ({ ...f, vehiculo: e.target.value as VehiculoTipo }))}
            fullWidth
          >
            <MenuItem value="CAMION">Camión</MenuItem>
            <MenuItem value="AUTO">Auto</MenuItem>
          </TextField>
          <TextField
            label="Subtipo de vehículo"
            value={form.subtipo}
            onChange={set('subtipo')}
            required
            fullWidth
            placeholder="Ej: Semirremolque, Balancín, Chasis, SUV…"
          />
          <TextField label="Precio (neto, sin IVA)" type="number" value={form.precio} onChange={set('precio')} required fullWidth />
          <Typography variant="caption" color="text.secondary" mt={-1}>
            El subtipo se escribe a mano: no hay una lista predefinida, lo que cargues acá es lo que va a aparecer como pestaña en el
            turnero.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !valid}>
          Guardar servicio
        </Button>
      </DialogActions>
    </Dialog>
  );
}
