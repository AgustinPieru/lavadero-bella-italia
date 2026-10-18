import { Box, Card, CardContent, Typography } from '@mui/material';
import { Turno } from '../api/useTurnos';
import { formatPesos } from '@/lib/format';

function Tile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150 }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', letterSpacing: 0.5, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} mt={0.25}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function TurnoStatTiles({ turnos }: { turnos: Turno[] }) {
  const noCancelados = turnos.filter((t) => t.estado !== 'CANCELADO');
  const completados = turnos.filter((t) => t.estado === 'COMPLETADO');
  const camiones = noCancelados.filter((t) => t.cliente.vehiculo === 'CAMION').length;
  const autos = noCancelados.filter((t) => t.cliente.vehiculo === 'AUTO').length;
  const ingresos = completados.reduce((a, t) => a + t.servicio.precio, 0);
  const lineaB = turnos.filter((t) => t.linea === 'B').length;

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <Tile label="LAVADOS" value={String(noCancelados.length)} detail={`${completados.length} completados`} />
      <Tile label="CAMIONES / AUTOS" value={`${camiones} / ${autos}`} detail="Prioridad camión activa" />
      <Tile label="INGRESOS" value={formatPesos(ingresos)} detail="De lavados completados" />
      <Tile label="LÍNEA B" value={String(lineaB)} detail="Turnos en línea de contingencia" />
    </Box>
  );
}
