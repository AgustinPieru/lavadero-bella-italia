import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGastosDelDia, useCreateGasto, useDeleteGasto, CategoriaGasto } from '../api/useGastos';
import { isoDate, formatFechaAgenda, formatPesos } from '@/lib/format';

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  SUELDOS: 'Sueldos',
  IMPUESTOS: 'Impuestos',
  SERVICIOS: 'Servicios',
  INSUMOS: 'Insumos',
  OTRO: 'Otro',
};

export default function GastosPage() {
  const [offset, setOffset] = useState(0);
  const [categoria, setCategoria] = useState<CategoriaGasto>('SUELDOS');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const fechaDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const fecha = isoDate(fechaDate);

  const { data: gastos, isLoading } = useGastosDelDia(fecha);
  const createGasto = useCreateGasto(fecha);
  const deleteGasto = useDeleteGasto(fecha);

  const total = (gastos ?? []).reduce((a, g) => a + g.monto, 0);

  const handleAgregar = () => {
    const montoNum = parseInt(monto, 10);
    if (!montoNum || montoNum <= 0) return;
    createGasto.mutate(
      { fecha, categoria, monto: montoNum, descripcion: descripcion.trim() || undefined },
      {
        onSuccess: () => {
          setMonto('');
          setDescripcion('');
        },
      }
    );
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Gastos
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
            <IconButton size="small" onClick={() => setOffset((o) => o - 1)} aria-label="Día anterior">
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography fontWeight={600}>{formatFechaAgenda(fechaDate)}</Typography>
            <IconButton size="small" onClick={() => setOffset((o) => o + 1)} aria-label="Día siguiente">
              <ChevronRight fontSize="small" />
            </IconButton>
            {offset !== 0 && (
              <Button size="small" onClick={() => setOffset(0)}>
                Volver a hoy
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
            <TextField
              select
              label="Categoría"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
              size="small"
              sx={{ minWidth: 160 }}
            >
              {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              size="small"
              sx={{ maxWidth: 140 }}
            />
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              size="small"
              fullWidth
              placeholder="Detalle breve (opcional)"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAgregar}
              disabled={!monto || parseInt(monto, 10) <= 0 || createGasto.isPending}
              sx={{ flexShrink: 0 }}
            >
              Agregar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {isLoading || !gastos ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {gastos.length === 0 ? (
              <Box py={6} textAlign="center" color="text.secondary">
                No hay gastos cargados para este día.
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gastos.map((g) => (
                      <TableRow key={g.id} hover>
                        <TableCell>
                          <Chip label={CATEGORIA_LABEL[g.categoria]} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{g.descripcion ?? '—'}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                          {formatPesos(g.monto)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => deleteGasto.mutate(g.id)} title="Eliminar">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: gastos.length ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Typography fontWeight={800}>Total del día: {formatPesos(total)}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
