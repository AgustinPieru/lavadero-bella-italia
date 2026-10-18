import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TextField,
  IconButton,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Block as BlockIcon, RestartAlt as RestartAltIcon } from '@mui/icons-material';
import { useServiciosAdmin, useUpdatePrecio, useDesactivarServicio, useReactivarServicio, Servicio } from '../api/useServicios';
import ServicioFormDialog from '../components/ServicioFormDialog';
import type { VehiculoTipo } from '@/features/clientes/api/useClientes';

const GRUPOS: { tipo: VehiculoTipo; label: string }[] = [
  { tipo: 'CAMION', label: '🚛 Camión' },
  { tipo: 'AUTO', label: '🚗 Auto' },
];

function PrecioInput({ servicio }: { servicio: Servicio }) {
  const [value, setValue] = useState(String(servicio.precio));
  const updatePrecio = useUpdatePrecio();

  // El valor local solo se inicializa una vez (useState): si el precio
  // cambia por fuera de este input (ej. se editó desde el modal "Editar
  // servicio"), hay que resincronizarlo o queda mostrando el valor viejo.
  useEffect(() => {
    setValue(String(servicio.precio));
  }, [servicio.precio]);

  const handleBlur = () => {
    const n = Number(value);
    if (!n || n <= 0 || n === servicio.precio) {
      setValue(String(servicio.precio));
      return;
    }
    updatePrecio.mutate({ id: servicio.id, precio: n });
  };

  return (
    <TextField
      size="small"
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      sx={{ width: 120 }}
      InputProps={{ sx: { fontFamily: 'monospace' } }}
    />
  );
}

export default function ServiciosListPage() {
  const { data: servicios, isLoading } = useServiciosAdmin();
  const desactivar = useDesactivarServicio();
  const reactivar = useReactivarServicio();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | undefined>(undefined);

  const openNuevo = () => {
    setEditingServicio(undefined);
    setDialogOpen(true);
  };
  const openEditar = (s: Servicio) => {
    setEditingServicio(s);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Servicios y precios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Precios netos (sin IVA). El subtipo se escribe a mano al crear el servicio, no hay una lista fija.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNuevo}>
          Nuevo servicio
        </Button>
      </Stack>

      {isLoading || !servicios ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {GRUPOS.map((grupo) => {
            const items = servicios.filter((s) => s.vehiculo === grupo.tipo);
            return (
              <Card key={grupo.tipo}>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box sx={{ p: 2, pb: 1 }}>
                    <Typography variant="h6">{grupo.label}</Typography>
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Servicio</TableCell>
                          <TableCell>Subtipo</TableCell>
                          <TableCell>Precio</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                              Sin servicios cargados para este tipo.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((s) => (
                            <TableRow key={s.id} hover>
                              <TableCell>
                                {s.nombre}
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {s.descripcion}
                                </Typography>
                              </TableCell>
                              <TableCell>{s.subtipo}</TableCell>
                              <TableCell>
                                <PrecioInput servicio={s} />
                              </TableCell>
                              <TableCell>
                                <Chip label={s.activo ? 'Activo' : 'Inactivo'} color={s.activo ? 'success' : 'default'} size="small" />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton size="small" onClick={() => openEditar(s)} title="Editar">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                {s.activo ? (
                                  <IconButton size="small" color="error" onClick={() => desactivar.mutate(s.id)} title="Desactivar">
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                ) : (
                                  <IconButton size="small" color="success" onClick={() => reactivar.mutate(s.id)} title="Reactivar">
                                    <RestartAltIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <ServicioFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} servicio={editingServicio} />
    </Box>
  );
}
