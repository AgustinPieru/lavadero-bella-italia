import { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Button, CircularProgress } from '@mui/material';
import { CheckCircle as CheckCircleIcon, VisibilityOff as VisibilityOffIcon, Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import { useResenas, useAprobarResena, useOcultarResena, Resena, EstadoResena } from '../api/useResenas';

const ESTADO_LABEL: Record<EstadoResena, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  OCULTA: 'Oculta',
};
const ESTADO_COLOR: Record<EstadoResena, 'warning' | 'success' | 'default'> = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  OCULTA: 'default',
};
const ORDEN: Record<EstadoResena, number> = { PENDIENTE: 0, APROBADA: 1, OCULTA: 2 };

function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <Stack direction="row" sx={{ color: '#d4a017' }}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= puntaje ? <StarIcon key={n} fontSize="small" /> : <StarBorderIcon key={n} fontSize="small" />
      )}
    </Stack>
  );
}

export default function ResenasListPage() {
  const { data: resenas, isLoading } = useResenas();
  const aprobar = useAprobarResena();
  const ocultar = useOcultarResena();

  const pendientes = useMemo(() => (resenas ?? []).filter((r) => r.estado === 'PENDIENTE'), [resenas]);
  const aprobadas = useMemo(() => (resenas ?? []).filter((r) => r.estado === 'APROBADA'), [resenas]);
  const promedio = aprobadas.length ? aprobadas.reduce((a, r) => a + r.puntaje, 0) / aprobadas.length : 0;
  const ordenadas = useMemo(
    () => [...(resenas ?? [])].sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || b.createdAt.localeCompare(a.createdAt)),
    [resenas]
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={0.5}>
        Reseñas
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Se generan cuando un turno pasa a &quot;Completado&quot; (se manda un link de encuesta por WhatsApp). Revisalas antes de que se vean en el turnero.
      </Typography>

      {isLoading || !resenas ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {[
              { label: 'Promedio', value: promedio ? promedio.toFixed(1) : '—', sub: `${aprobadas.length} aprobadas` },
              { label: 'Pendientes', value: String(pendientes.length), sub: pendientes.length ? 'Esperando revisión' : 'Al día' },
              { label: 'Total', value: String(resenas.length), sub: 'Desde que se activó la función' },
              { label: 'Visibles en el turnero', value: String(aprobadas.length), sub: 'Solo las aprobadas' },
            ].map((s) => (
              <Card key={s.label} sx={{ flex: '1 1 180px' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {s.label.toUpperCase()}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.sub}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {ordenadas.length === 0 ? (
                <Box py={6} textAlign="center" color="text.secondary">
                  Todavía no hay reseñas cargadas.
                </Box>
              ) : (
                ordenadas.map((r: Resena) => (
                  <Box
                    key={r.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.5}>
                        <Estrellas puntaje={r.puntaje} />
                        <Chip
                          label={r.turno.vehiculo.tipo === 'CAMION' ? '🚛' : '🚗'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 14 }}
                        />
                        <Typography fontWeight={700}>{r.turno.vehiculo.cliente.denominacion}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(r.createdAt).toLocaleDateString('es-AR')}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {r.comentario || 'Sin comentario, solo puntaje.'}
                      </Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={ESTADO_LABEL[r.estado]} color={ESTADO_COLOR[r.estado]} size="small" />
                      <Stack direction="row" spacing={1}>
                        {r.estado !== 'APROBADA' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => aprobar.mutate(r.id)}
                          >
                            Aprobar
                          </Button>
                        )}
                        {r.estado !== 'OCULTA' && (
                          <Button size="small" startIcon={<VisibilityOffIcon />} onClick={() => ocultar.mutate(r.id)}>
                            Ocultar
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
