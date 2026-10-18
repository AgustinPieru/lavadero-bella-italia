import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert, Divider, Typography } from '@mui/material';
import { useCreateCliente, useUpdateCliente, Cliente, VehiculoTipo } from '../api/useClientes';
import { useSubtipos } from '@/features/servicios/api/useServicios';

interface Props {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente; // si viene, es edición (solo datos de contacto — los vehículos se manejan aparte)
  onSaved?: (cliente: Cliente) => void; // usado por el alta rápida desde el turno
}

const emptyContacto = { denominacion: '', telefono: '', cuit: '', email: '', direccion: '' };
const emptyVehiculo = { tipo: 'CAMION' as VehiculoTipo, subtipo: '', marca: '', modelo: '', patente: '' };

// Formulario único de Cliente: en alta pide los datos de contacto + su
// primer vehículo (un cliente sin vehículos no tiene mucho sentido); en
// edición solo toca los datos de contacto — los vehículos (altas
// posteriores, edición, baja) se manejan desde la fila expandible en la
// lista de Clientes, porque puede haber más de uno.
export default function ClienteFormDialog({ open, onClose, cliente, onSaved }: Props) {
  const editing = !!cliente;
  const [contacto, setContacto] = useState(emptyContacto);
  const [vehiculo, setVehiculo] = useState(emptyVehiculo);
  const { data: subtipos } = useSubtipos(vehiculo.tipo);
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  useEffect(() => {
    if (!open) return;
    if (cliente) {
      setContacto({
        denominacion: cliente.denominacion,
        telefono: cliente.telefono,
        cuit: cliente.cuit ?? '',
        email: cliente.email ?? '',
        direccion: cliente.direccion ?? '',
      });
    } else {
      setContacto(emptyContacto);
      setVehiculo(emptyVehiculo);
    }
  }, [open, cliente]);

  const setC = (field: keyof typeof emptyContacto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContacto((f) => ({ ...f, [field]: e.target.value }));
  const setV = (field: keyof typeof emptyVehiculo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVehiculo((f) => ({ ...f, [field]: e.target.value }));

  const saving = createCliente.isPending || updateCliente.isPending;
  const error = createCliente.isError || updateCliente.isError;
  const valid = contacto.denominacion.trim() && contacto.telefono.trim() && (editing || vehiculo.subtipo);

  const handleSubmit = async () => {
    if (!valid) return;
    const contactoData = {
      ...contacto,
      cuit: contacto.cuit || undefined,
      email: contacto.email || undefined,
      direccion: contacto.direccion || undefined,
    };
    const saved = editing
      ? await updateCliente.mutateAsync({ id: cliente.id, data: contactoData })
      : await createCliente.mutateAsync({
          ...contactoData,
          vehiculo: {
            ...vehiculo,
            marca: vehiculo.marca || undefined,
            modelo: vehiculo.modelo || undefined,
            patente: vehiculo.patente || undefined,
          },
        });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">No se pudo guardar el cliente</Alert>}
          <TextField label="Denominación" value={contacto.denominacion} onChange={setC('denominacion')} required fullWidth autoFocus />
          <TextField label="Teléfono" value={contacto.telefono} onChange={setC('telefono')} required fullWidth />
          <TextField label="CUIT / CUIL (opcional)" value={contacto.cuit} onChange={setC('cuit')} fullWidth />
          <TextField label="Email" type="email" value={contacto.email} onChange={setC('email')} fullWidth />
          <TextField label="Dirección" value={contacto.direccion} onChange={setC('direccion')} fullWidth />

          {!editing && (
            <>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Primer vehículo — se le pueden sumar más después desde la lista de clientes.
              </Typography>
              <TextField
                select
                label="Tipo de vehículo"
                value={vehiculo.tipo}
                onChange={(e) => setVehiculo((f) => ({ ...f, tipo: e.target.value as VehiculoTipo, subtipo: '' }))}
                fullWidth
              >
                <MenuItem value="CAMION">Camión</MenuItem>
                <MenuItem value="AUTO">Auto</MenuItem>
              </TextField>
              <TextField select label="Subtipo" value={vehiculo.subtipo} onChange={setV('subtipo')} required fullWidth disabled={!subtipos?.length}>
                {(subtipos ?? []).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Marca" value={vehiculo.marca} onChange={setV('marca')} fullWidth />
              <TextField label="Modelo" value={vehiculo.modelo} onChange={setV('modelo')} fullWidth />
              <TextField label="Patente" value={vehiculo.patente} onChange={setV('patente')} fullWidth />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !valid}>
          Guardar cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
}
