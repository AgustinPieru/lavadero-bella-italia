import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useReporte, useDescargarReportePdf } from '../api/useReportes';
import { isoDate, formatPesos } from '@/lib/format';

type Preset = 'hoy' | '7d' | '30d' | 'mes' | 'custom';

const PRESET_LABEL: Record<Preset, string> = {
  hoy: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  mes: 'Este mes',
  custom: 'Personalizado',
};

const FORMA_PAGO_LABEL: Record<string, string> = {
  CONTADO: 'Contado',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CUENTA_CORRIENTE: 'Cuenta corriente',
};

const CATEGORIA_LABEL: Record<string, string> = {
  SUELDOS: 'Sueldos',
  IMPUESTOS: 'Impuestos',
  SERVICIOS: 'Servicios',
  INSUMOS: 'Insumos',
  OTRO: 'Otro',
};

function rangoPorPreset(preset: Preset): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = isoDate(hoy);
  if (preset === 'hoy') return { desde: hasta, hasta };
  if (preset === '7d') {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 6);
    return { desde: isoDate(d), hasta };
  }
  if (preset === '30d') {
    const d = new Date(hoy);
    d.setDate(d.getDate() - 29);
    return { desde: isoDate(d), hasta };
  }
  return { desde: isoDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
}

function Tile({ label, value, detail, warn }: { label: string; value: string; detail: string; warn?: boolean }) {
  return (
    <Card sx={{ flex: '1 1 160px' }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', letterSpacing: 0.5, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} mt={0.25}>
          {value}
        </Typography>
        <Typography variant="caption" color={warn ? 'warning.main' : 'text.secondary'}>
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ReportesPage() {
  const [preset, setPreset] = useState<Preset>('7d');
  const [custom, setCustom] = useState(rangoPorPreset('7d'));

  const rango = preset === 'custom' ? custom : rangoPorPreset(preset);
  const { data: r, isLoading } = useReporte(rango.desde, rango.hasta);
  const descargarPdf = useDescargarReportePdf();

  const ticketProm = r && r.completadosCount ? Math.round(r.ingresos / r.completadosCount) : 0;
  const totalVeh = r ? r.camiones + r.autos : 0;
  const pctCamion = totalVeh ? Math.round(((r?.camiones ?? 0) / totalVeh) * 100) : 0;
  const pctAuto = totalVeh ? 100 - pctCamion : 0;
  const tasaCancelacion = r && r.totalCount ? Math.round((r.canceladosCount / r.totalCount) * 100) : 0;
  const maxLavados = useMemo(() => Math.max(1, ...(r?.lavadosPorDia.map((d) => d.cantidad) ?? [1])), [r]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Reportes
          </Typography>
          <Typography color="text.secondary">
            {rango.desde === rango.hasta ? `Datos del ${rango.desde}` : `Del ${rango.desde} al ${rango.hasta}`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => descargarPdf.mutate(rango)}
          disabled={!r || descargarPdf.isPending}
        >
          Exportar PDF
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Período"
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              size="small"
              sx={{ minWidth: 180 }}
            >
              {Object.entries(PRESET_LABEL).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            {preset === 'custom' && (
              <>
                <TextField
                  label="Desde"
                  type="date"
                  value={custom.desde}
                  onChange={(e) => setCustom((c) => ({ ...c, desde: e.target.value }))}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: isoDate(new Date()) }}
                />
                <TextField
                  label="Hasta"
                  type="date"
                  value={custom.hasta}
                  onChange={(e) => setCustom((c) => ({ ...c, hasta: e.target.value }))}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: isoDate(new Date()) }}
                />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {isLoading || !r ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Tile label="GANANCIA NETA" value={formatPesos(r.ingresos - r.gastosTotal)} detail="Período elegido" />
            <Tile label="INGRESOS" value={formatPesos(r.ingresos)} detail={`${r.completadosCount} lavados completados`} />
            <Tile label="GASTOS" value={formatPesos(r.gastosTotal)} detail="Sueldos, insumos, servicios" warn />
            <Tile label="TICKET PROMEDIO" value={formatPesos(ticketProm)} detail="Por lavado completado" />
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={0.25}>
                Lavados por día
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Cantidad de lavados completados, día por día
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 160, overflowX: 'auto', pb: 1 }}>
                {r.lavadosPorDia.map((d) => (
                  <Box key={d.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                    <Typography variant="caption" fontWeight={700}>
                      {d.cantidad}
                    </Typography>
                    <Box
                      sx={{
                        width: 20,
                        height: Math.max(4, (d.cantidad / maxLavados) * 110),
                        bgcolor: 'primary.main',
                        borderRadius: 1,
                        mt: 0.5,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" mt={0.5}>
                      {d.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Typography variant="h4" fontWeight={800}>
                  {pctCamion}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Camiones sobre el total lavado ({r.camiones})
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Typography variant="h4" fontWeight={800}>
                  {pctAuto}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Autos sobre el total lavado ({r.autos})
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Forma de pago
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Forma de pago</TableCell>
                      <TableCell align="right">Turnos</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(r.porFormaPago).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>
                          Sin lavados completados en este período
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(r.porFormaPago)
                        .sort((a, b) => b[1].monto - a[1].monto)
                        .map(([fp, v]) => (
                          <TableRow key={fp}>
                            <TableCell>{FORMA_PAGO_LABEL[fp] ?? fp}</TableCell>
                            <TableCell align="right">{v.cantidad}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                              {formatPesos(v.monto)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Gastos por categoría
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(r.gastosPorCategoria).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                          Sin gastos cargados en este período
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(r.gastosPorCategoria)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, monto]) => (
                          <TableRow key={cat}>
                            <TableCell>{CATEGORIA_LABEL[cat] ?? cat}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                              {formatPesos(monto)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>
                Top empresas
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Empresa</TableCell>
                      <TableCell align="right">Lavados</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {r.topEmpresas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>
                          Sin lavados de empresas en este período
                        </TableCell>
                      </TableRow>
                    ) : (
                      r.topEmpresas.map((e) => (
                        <TableRow key={e.nombre}>
                          <TableCell>{e.nombre}</TableCell>
                          <TableCell align="right">{e.lavados}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                            {formatPesos(e.monto)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Resumen de turnos
              </Typography>
              <Stack direction="row" spacing={4} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    TOTAL
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {r.totalCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    COMPLETADOS
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {r.completadosCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    CANCELADOS
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {r.canceladosCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    TASA DE CANCELACIÓN
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {tasaCancelacion}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
