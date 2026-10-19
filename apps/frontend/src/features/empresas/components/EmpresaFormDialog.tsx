import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert, Divider } from '@mui/material';
import { useClientes, Cliente, TipoFacturacion } from '@/features/clientes/api/useClientes';
import { useMarcarComoEmpresa, useActualizarEmpresa } from '../api/useEmpresas';

interface Props {
  open: boolean;
  onClose: () => void;
  empresa?: Cliente; // si viene, es edición de una empresa ya marcada
}

const emptyForm = { clienteId: '' as number | '', descuentoPct: '', facturacion: 'INTERNA' as TipoFacturacion, cuentaCorrienteHabilitada: false };

// "Marcar como empresa" = elegir un cliente ya registrado (particular o sin
// clasificar) y cargarle los datos de negocio. No se crea un cliente nuevo
// acá — si todavía no existe, primero se da de alta desde Clientes.
export default function EmpresaFormDialog({ open, onClose, empresa }: Props) {
  const editing = !!empresa;
  const [form, setForm] = useState(emptyForm);
  const { data: clientes } = useClientes({ incluirInactivos: false });
  const marcar = useMarcarComoEmpresa();
  const actualizar = useActualizarEmpresa();

  useEffect(() => {
    if (!open) return;
    if (empresa) {
      setForm({
        clienteId: empresa.id,
        descuentoPct: empresa.descuentoPct != null ? String(empresa.descuentoPct) : '',
        facturacion: empresa.facturacion ?? 'INTERNA',
        cuentaCorrienteHabilitada: empresa.cuentaCorrienteHabilitada,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, empresa]);

  const candidatos = (clientes ?? []).filter((c) => !c.esEmpresa);
  const saving = marcar.isPending || actualizar.isPending;
  const error = marcar.isError || actualizar.isError;
  const valid = !!form.clienteId && !!form.facturacion;

  const handleSubmit = async () => {
    if (!valid) return;
    const data = {
      descuentoPct: form.descuentoPct ? Number(form.descuentoPct) : undefined,
      facturacion: form.facturacion,
      cuentaCorrienteHabilitada: form.cuentaCorrienteHabilitada,
    };
    if (editing) {
      await actualizar.mutateAsync({ clienteId: empresa.id, data });
    } else {
      await marcar.mutateAsync({ clienteId: Number(form.clienteId), data });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'Editar empresa' : 'Marcar cliente como empresa'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">No se pudo guardar</Alert>}

          {editing ? (
            <TextField label="Cliente" value={empresa.denominacion} disabled fullWidth />
          ) : (
            <TextField
              select
              label="Cliente"
              value={form.clienteId}
              onChange={(e) => setForm((f) => ({ ...f, clienteId: Number(e.target.value) }))}
              fullWidth
              helperText={candidatos.length === 0 ? 'No hay clientes disponibles (ya son todos empresas, o faltan dar de alta)' : ' '}
            >
              {candidatos.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.denominacion}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Divider />

          <TextField
            label="Descuento (%)"
            type="number"
            value={form.descuentoPct}
            onChange={(e) => setForm((f) => ({ ...f, descuentoPct: e.target.value }))}
            fullWidth
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            select
            label="Facturación"
            value={form.facturacion}
            onChange={(e) => setForm((f) => ({ ...f, facturacion: e.target.value as TipoFacturacion }))}
            fullWidth
          >
            <MenuItem value="ARCA">ARCA (electrónica)</MenuItem>
            <MenuItem value="INTERNA">Interna</MenuItem>
          </TextField>
          <TextField
            select
            label="Cuenta corriente"
            value={form.cuentaCorrienteHabilitada ? 'si' : 'no'}
            onChange={(e) => setForm((f) => ({ ...f, cuentaCorrienteHabilitada: e.target.value === 'si' }))}
            fullWidth
          >
            <MenuItem value="si">Habilitada</MenuItem>
            <MenuItem value="no">No habilitada</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !valid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
