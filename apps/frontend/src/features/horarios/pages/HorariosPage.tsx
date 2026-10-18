import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useHorarios, useUpdateHorarioDia, HorarioDia, HorarioDiaInput, ModoSlot } from '../api/useHorarios';
import { generateSlots, TIME_OPTIONS } from '@/lib/timeSlots';

const DOW_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DOW_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DOW_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const ORDEN_TABS = [1, 2, 3, 4, 5, 6, 0];

const MODO_ORDER: ModoSlot[] = ['LIBRE', 'CAMION', 'AUTO', 'CERRADO'];
const MODO_LABEL: Record<ModoSlot, string> = { CAMION: 'Camión', AUTO: 'Auto', LIBRE: 'Libre', CERRADO: 'Cerrado' };
const MODO_COLOR: Record<ModoSlot, { bg: string; fg: string }> = {
  LIBRE: { bg: '#eceff1', fg: '#546e7a' },
  CAMION: { bg: '#e2f3ea', fg: '#1f7a54' },
  AUTO: { bg: '#fbeada', fg: '#d97b3c' },
  CERRADO: { bg: '#f7e0d8', fg: '#b3401f' },
};

function cycleModo(modo: ModoSlot): ModoSlot {
  return MODO_ORDER[(MODO_ORDER.indexOf(modo) + 1) % MODO_ORDER.length];
}

function toInput(h: HorarioDia): HorarioDiaInput {
  return {
    abierto: h.abierto,
    desde: h.desde,
    hasta: h.hasta,
    modos: h.modos,
    lineaBHabilitada: h.lineaBHabilitada,
    lineaBDesde: h.lineaBDesde,
    lineaBHasta: h.lineaBHasta,
    modosLineaB: h.modosLineaB,
  };
}

function SlotGrid({ modos, onCycle }: { modos: Record<string, ModoSlot>; onCycle: (hora: string) => void }) {
  const horas = Object.keys(modos).sort();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 1 }}>
      {horas.map((hora) => {
        const modo = modos[hora] ?? 'LIBRE';
        const color = MODO_COLOR[modo];
        return (
          <Box
            key={hora}
            onClick={() => onCycle(hora)}
            sx={{
              borderRadius: 2,
              py: 1,
              textAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              fontFamily: 'monospace',
              bgcolor: color.bg,
              color: color.fg,
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              {hora}
            </Typography>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {MODO_LABEL[modo]}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function Legend() {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
      {MODO_ORDER.map((m) => (
        <Stack key={m} direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: MODO_COLOR[m].fg }} />
          <span>{MODO_LABEL[m]}</span>
        </Stack>
      ))}
    </Stack>
  );
}

export default function HorariosPage() {
  const { data: horarios, isLoading } = useHorarios();
  const updateHorario = useUpdateHorarioDia();
  const [diaSel, setDiaSel] = useState(new Date().getDay());

  const horario = horarios?.find((h) => h.diaSemana === diaSel);

  const guardar = (patch: Partial<HorarioDiaInput>) => {
    if (!horario) return;
    updateHorario.mutate({ dia: diaSel, data: { ...toInput(horario), ...patch } });
  };

  const handleToggleAbierto = (checked: boolean) => {
    if (!horario) return;
    const modos = checked && Object.keys(horario.modos).length === 0 ? buildDefaultModos(horario.desde, horario.hasta) : horario.modos;
    guardar({ abierto: checked, modos });
  };

  const handleRango = (desde: string, hasta: string) => {
    if (!horario || timeToMinutes(hasta) <= timeToMinutes(desde)) return;
    const nuevasHoras = generateSlots(desde, hasta);
    const modos: Record<string, ModoSlot> = {};
    nuevasHoras.forEach((h) => {
      modos[h] = horario.modos[h] ?? 'LIBRE';
    });
    guardar({ desde, hasta, modos });
  };

  const handleCycleSlot = (hora: string) => {
    if (!horario) return;
    const modos = { ...horario.modos, [hora]: cycleModo(horario.modos[hora] ?? 'LIBRE') };
    guardar({ modos });
  };

  const handleToggleLineaB = (checked: boolean) => {
    if (!horario) return;
    const lineaBDesde = horario.lineaBDesde ?? horario.desde;
    const lineaBHasta = horario.lineaBHasta ?? horario.hasta;
    const modosLineaB = horario.modosLineaB && Object.keys(horario.modosLineaB).length > 0
      ? horario.modosLineaB
      : buildDefaultModos(lineaBDesde, lineaBHasta, 3);
    guardar({ lineaBHabilitada: checked, lineaBDesde, lineaBHasta, modosLineaB });
  };

  const handleRangoLineaB = (desde: string, hasta: string) => {
    if (!horario || timeToMinutes(hasta) <= timeToMinutes(desde)) return;
    const nuevasHoras = generateSlots(desde, hasta);
    const modosLineaB: Record<string, ModoSlot> = {};
    nuevasHoras.forEach((h) => {
      modosLineaB[h] = horario.modosLineaB?.[h] ?? 'LIBRE';
    });
    guardar({ lineaBDesde: desde, lineaBHasta: hasta, modosLineaB });
  };

  const handleCycleSlotLineaB = (hora: string) => {
    if (!horario) return;
    const modosLineaB = { ...(horario.modosLineaB ?? {}), [hora]: cycleModo(horario.modosLineaB?.[hora] ?? 'LIBRE') };
    guardar({ modosLineaB });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Horarios y cupos
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Elegí un día para definir si atiende, en qué franja horaria y qué cupo tiene cada turno.
      </Typography>

      <Card>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 2, pb: 0 }}>
          {ORDEN_TABS.map((d) => {
            const h = horarios?.find((x) => x.diaSemana === d);
            return (
              <Button
                key={d}
                variant={diaSel === d ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setDiaSel(d)}
                startIcon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: h?.abierto ? 'success.main' : 'text.disabled' }} />}
              >
                {DOW_SHORT[d]}
              </Button>
            );
          })}
        </Box>

        <CardContent>
          {isLoading || !horario ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {DOW_LONG[diaSel]}
                </Typography>
                <FormControlLabel
                  control={<Switch checked={horario.abierto} onChange={(e) => handleToggleAbierto(e.target.checked)} />}
                  label="Atiende este día"
                />
              </Stack>

              {!horario.abierto ? (
                <Box py={4} textAlign="center" color="text.secondary">
                  🚫 El lavadero no atiende los {DOW_PLURAL[diaSel]}.
                  <br />
                  Activá el día de arriba para configurar su horario.
                </Box>
              ) : (
                <>
                  <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
                    <TextField select label="Desde" value={horario.desde} onChange={(e) => handleRango(e.target.value, horario.hasta)} sx={{ minWidth: 140 }}>
                      {TIME_OPTIONS.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField select label="Hasta" value={horario.hasta} onChange={(e) => handleRango(horario.desde, e.target.value)} sx={{ minWidth: 140 }}>
                      {TIME_OPTIONS.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <Typography variant="overline" color="text.secondary">
                    Línea A — cupos cada 1:15 hs, tocá para alternar
                  </Typography>
                  <Box mt={1} mb={1}>
                    <SlotGrid modos={horario.modos} onCycle={handleCycleSlot} />
                  </Box>
                  <Legend />

                  <Box mt={3} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography fontWeight={700}>Línea B de contingencia</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Si se completan los turnos de la línea A, ¿se abre una segunda línea de lavado?
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={<Switch checked={horario.lineaBHabilitada} onChange={(e) => handleToggleLineaB(e.target.checked)} />}
                        label="Habilitada"
                      />
                    </Stack>

                    {horario.lineaBHabilitada && horario.lineaBDesde && horario.lineaBHasta && (
                      <Box mt={2}>
                        <Stack direction="row" spacing={2} flexWrap="wrap" mb={2}>
                          <TextField
                            select
                            label="Desde (línea B)"
                            value={horario.lineaBDesde}
                            onChange={(e) => handleRangoLineaB(e.target.value, horario.lineaBHasta!)}
                            sx={{ minWidth: 140 }}
                          >
                            {TIME_OPTIONS.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label="Hasta (línea B)"
                            value={horario.lineaBHasta}
                            onChange={(e) => handleRangoLineaB(horario.lineaBDesde!, e.target.value)}
                            sx={{ minWidth: 140 }}
                          >
                            {TIME_OPTIONS.map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Stack>
                        <SlotGrid modos={horario.modosLineaB ?? {}} onCycle={handleCycleSlotLineaB} />
                        <Legend />
                        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                          El cliente nunca ve esta distinción: para él, un horario ofrecido por la línea B se muestra igual que uno de
                          la línea A.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {updateHorario.isPending && (
        <Chip label="Guardando..." size="small" sx={{ mt: 2 }} />
      )}
    </Box>
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function buildDefaultModos(desde: string, hasta: string, offset = 0): Record<string, ModoSlot> {
  const pattern: ModoSlot[] = ['CAMION', 'CAMION', 'LIBRE', 'CAMION', 'AUTO', 'LIBRE'];
  const modos: Record<string, ModoSlot> = {};
  generateSlots(desde, hasta).forEach((h, i) => {
    modos[h] = pattern[(i + offset) % pattern.length];
  });
  return modos;
}

