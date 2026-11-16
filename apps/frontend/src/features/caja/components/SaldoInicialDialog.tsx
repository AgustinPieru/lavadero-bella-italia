import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Typography } from '@mui/material';
import { useSetSaldoInicial, SaldoCaja } from '../api/useCaja';
import { isoDate } from '@/lib/format';

export default function SaldoInicialDialog({
  open,
  onClose,
  saldo,
}: {
  open: boolean;
  onClose: () => void;
  saldo?: SaldoCaja;
}) {
  const [fecha, setFecha] = useState(isoDate(new Date()));
  const [cuenta, setCuenta] = useState('');
  const [efectivo, setEfectivo] = useState('');
  const setSaldoInicial = useSetSaldoInicial();

  useEffect(() => {
    if (!open) return;
    setFecha(saldo?.fechaDesde ?? isoDate(new Date()));
    setCuenta(saldo?.configurado ? String(saldo.cuenta) : '');
    setEfectivo(saldo?.configurado ? String(saldo.efectivo) : '');
  }, [open, saldo]);

  const cuentaNum = parseFloat(cuenta);
  const efectivoNum = parseFloat(efectivo);
  const esValido = fecha && !Number.isNaN(cuentaNum) && cuentaNum >= 0 && !Number.isNaN(efectivoNum) && efectivoNum >= 0;

  const handleGuardar = () => {
    if (!esValido) return;
    setSaldoInicial.mutate({ fecha, cuenta: cuentaNum, efectivo: efectivoNum }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{saldo?.configurado ? 'Editar saldo inicial' : 'Configurar saldo inicial'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Lo que ya tenías en cuenta y en efectivo antes de empezar a trackear la caja acá. A partir de esta fecha se
          suma lo que cobres y se resta lo que gastes.
        </Typography>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Vigente desde"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Saldo en cuenta"
            type="number"
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            size="small"
            inputProps={{ step: '0.01', min: 0 }}
          />
          <TextField
            label="Saldo en efectivo"
            type="number"
            value={efectivo}
            onChange={(e) => setEfectivo(e.target.value)}
            size="small"
            inputProps={{ step: '0.01', min: 0 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar} disabled={!esValido || setSaldoInicial.isPending}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
