import { useState, Fragment } from 'react';
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
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
  CircularProgress,
  Stack,
  Collapse,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  RestartAlt as RestartAltIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { useClientes, useDesactivarCliente, useReactivarCliente, Cliente, Vehiculo } from '../api/useClientes';
import { useDesactivarVehiculo, useReactivarVehiculo } from '../api/useVehiculos';
import ClienteFormDialog from '../components/ClienteFormDialog';
import VehiculoFormDialog from '../components/VehiculoFormDialog';

function VehiculosRow({ cliente }: { cliente: Cliente }) {
  const [vehiculoDialogOpen, setVehiculoDialogOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | undefined>(undefined);
  const desactivarVehiculo = useDesactivarVehiculo(cliente.id);
  const reactivarVehiculo = useReactivarVehiculo(cliente.id);

  const openNuevo = () => {
    setEditingVehiculo(undefined);
    setVehiculoDialogOpen(true);
  };
  const openEditar = (v: Vehiculo) => {
    setEditingVehiculo(v);
    setVehiculoDialogOpen(true);
  };

  return (
    <Box sx={{ py: 2, px: 2, bgcolor: 'background.default' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2">Vehículos de {cliente.denominacion}</Typography>
        <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={openNuevo}>
          Vehículo
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Marca / Modelo</TableCell>
            <TableCell>Patente</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cliente.vehiculos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ color: 'text.secondary' }}>
                Sin vehículos cargados.
              </TableCell>
            </TableRow>
          ) : (
            cliente.vehiculos.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  {v.tipo === 'CAMION' ? '🚛' : '🚗'} {v.subtipo}
                </TableCell>
                <TableCell>
                  {v.marca} {v.modelo}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{v.patente || '—'}</TableCell>
                <TableCell>
                  <Chip label={v.activo ? 'Activo' : 'Inactivo'} color={v.activo ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEditar(v)} title="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {v.activo ? (
                    <IconButton size="small" color="error" onClick={() => desactivarVehiculo.mutate(v.id)} title="Desactivar">
                      <BlockIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton size="small" color="success" onClick={() => reactivarVehiculo.mutate(v.id)} title="Reactivar">
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <VehiculoFormDialog open={vehiculoDialogOpen} onClose={() => setVehiculoDialogOpen(false)} clienteId={cliente.id} vehiculo={editingVehiculo} />
    </Box>
  );
}

export default function ClientesListPage() {
  const [search, setSearch] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: clientes, isLoading } = useClientes({ search: search || undefined, incluirInactivos });
  const desactivar = useDesactivarCliente();
  const reactivar = useReactivarCliente();

  const openNuevo = () => {
    setEditingCliente(undefined);
    setDialogOpen(true);
  };
  const openEditar = (c: Cliente) => {
    setEditingCliente(c);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registro de clientes particulares y de empresa — cada uno puede tener más de un vehículo
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNuevo}>
          Nuevo cliente
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} mb={2}>
        <TextField
          placeholder="Buscar por denominación, teléfono o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: 420 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControlLabel
          control={<Switch checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />}
          label="Mostrar inactivos"
        />
      </Stack>

      {isLoading || !clientes ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {clientes.length === 0 ? (
              <Box py={6} textAlign="center" color="text.secondary">
                No se encontraron clientes.
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40} />
                      <TableCell>Denominación</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>CUIT/CUIL</TableCell>
                      <TableCell>Vehículos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientes.map((c) => {
                      const expanded = expandedId === c.id;
                      return (
                        <Fragment key={c.id}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton size="small" onClick={() => setExpandedId(expanded ? null : c.id)}>
                                {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              {c.denominacion}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {c.direccion || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {c.telefono}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {c.email || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{c.cuit || '—'}</TableCell>
                            <TableCell>
                              {c.vehiculos.length} {c.vehiculos.length === 1 ? 'vehículo' : 'vehículos'}
                            </TableCell>
                            <TableCell>
                              <Chip label={c.activo ? 'Activo' : 'Inactivo'} color={c.activo ? 'success' : 'default'} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => openEditar(c)} title="Editar">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {c.activo ? (
                                <IconButton size="small" color="error" onClick={() => desactivar.mutate(c.id)} title="Desactivar">
                                  <BlockIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton size="small" color="success" onClick={() => reactivar.mutate(c.id)} title="Reactivar">
                                  <RestartAltIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                              <Collapse in={expanded} timeout="auto" unmountOnExit>
                                <VehiculosRow cliente={c} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <ClienteFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} cliente={editingCliente} />
    </Box>
  );
}
