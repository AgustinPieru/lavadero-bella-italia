import { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, Stack, Divider } from '@mui/material';
import { useSaldoCaja } from '../api/useCaja';
import { formatPesos } from '@/lib/format';
import SaldoInicialDialog from './SaldoInicialDialog';

export default function CajaCard() {
  const { data: saldo, isLoading } = useSaldoCaja();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} mb={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Disponible en caja
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {saldo?.configurado
                ? `Saldo acumulado desde ${saldo.fechaDesde} — no depende del período elegido arriba`
                : 'Todavía no cargaste el saldo inicial de caja'}
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => setDialogOpen(true)} disabled={isLoading}>
            {saldo?.configurado ? 'Editar saldo inicial' : 'Configurar saldo inicial'}
          </Button>
        </Stack>

        {saldo?.configurado && (
          <>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  CUENTA
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatPesos(saldo.cuenta)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  EFECTIVO
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatPesos(saldo.efectivo)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  TOTAL
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {formatPesos(saldo.total)}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        <Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            CUENTA CORRIENTE
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {formatPesos(saldo?.cuentaCorrientePendiente ?? 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Lo que te deben los clientes — no es plata en caja, es pendiente de cobro
          </Typography>
        </Box>
      </CardContent>

      <SaldoInicialDialog open={dialogOpen} onClose={() => setDialogOpen(false)} saldo={saldo} />
    </Card>
  );
}
