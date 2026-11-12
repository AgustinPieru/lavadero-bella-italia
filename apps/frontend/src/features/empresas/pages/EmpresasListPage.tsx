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
  IconButton,
  CircularProgress,
  Stack,
  Collapse,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  RemoveCircleOutline as RemoveIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Save as SaveIcon,
  Close as ClearIcon,
} from '@mui/icons-material';
import { useEmpresas, useQuitarEmpresa, useSetPrecioEmpresa, useQuitarPrecioEmpresa } from '../api/useEmpresas';
import { Cliente } from '@/features/clientes/api/useClientes';
import { useServiciosAdmin } from '@/features/servicios/api/useServicios';
import { formatPesos } from '@/lib/format';
import EmpresaFormDialog from '../components/EmpresaFormDialog';

function PreciosEmpresaRow({ empresa }: { empresa: Cliente }) {
  const { data: servicios } = useServiciosAdmin();
  const setPrecio = useSetPrecioEmpresa();
  const quitarPrecio = useQuitarPrecioEmpresa();
  const [edicion, setEdicion] = useState<Record<number, string>>({});

  const serviciosActivos = (servicios ?? []).filter((s) => s.activo);
  const overridePorServicio = new Map(empresa.preciosEmpresa.map((p) => [p.servicioId, p]));

  const valorInput = (servicioId: number, precioActual?: number) =>
    edicion[servicioId] ?? (precioActual != null ? String(precioActual) : '');

  const guardar = (servicioId: number) => {
    const valor = Number(edicion[servicioId]);
    if (!valor || valor <= 0) return;
    setPrecio.mutate(
      { clienteId: empresa.id, servicioId, precio: valor },
      { onSuccess: () => setEdicion((e) => ({ ...e, [servicioId]: undefined as unknown as string })) }
    );
  };

  const quitar = (servicioId: number) => {
    quitarPrecio.mutate({ clienteId: empresa.id, servicioId });
    setEdicion((e) => ({ ...e, [servicioId]: undefined as unknown as string }));
  };

  return (
    <Box sx={{ py: 2, px: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle2" mb={1}>
        Precios diferenciales de {empresa.denominacion}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Si no se carga un precio para un servicio, esta empresa paga el precio de lista.
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Servicio</TableCell>
            <TableCell>Precio de lista</TableCell>
            <TableCell>Precio empresa</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {serviciosActivos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                No hay servicios cargados.
              </TableCell>
            </TableRow>
          ) : (
            serviciosActivos.map((s) => {
              const override = overridePorServicio.get(s.id);
              const valor = valorInput(s.id, override?.precio);
              const dirty = valor !== (override?.precio != null ? String(override.precio) : '');
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.nombre} <Typography variant="caption" color="text.secondary">({s.vehiculo === 'CAMION' ? '🚛' : '🚗'} {s.subtipo})</Typography>
                  </TableCell>
                  <TableCell>{formatPesos(s.precio)}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder={formatPesos(s.precio)}
                      value={valor}
                      onChange={(e) => setEdicion((ed) => ({ ...ed, [s.id]: e.target.value }))}
                      sx={{ width: 140 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" disabled={!dirty} onClick={() => guardar(s.id)} title="Guardar precio">
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    {override && (
                      <IconButton size="small" color="error" onClick={() => quitar(s.id)} title="Quitar precio diferencial (vuelve al de lista)">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

export default function EmpresasListPage() {
  const { data: empresas, isLoading } = useEmpresas();
  const quitarEmpresa = useQuitarEmpresa();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Cliente | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const openNueva = () => {
    setEditingEmpresa(undefined);
    setDialogOpen(true);
  };
  const openEditar = (c: Cliente) => {
    setEditingEmpresa(c);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Precios diferenciales por servicio y condición de facturación por volumen de vehículos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNueva}>
          Marcar como empresa
        </Button>
      </Stack>

      {isLoading || !empresas ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {empresas.length === 0 ? (
              <Box py={6} textAlign="center" color="text.secondary">
                Todavía no hay ninguna empresa marcada. Usá "Marcar como empresa" para elegir un cliente existente.
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40} />
                      <TableCell>Empresa</TableCell>
                      <TableCell>CUIT</TableCell>
                      <TableCell>Vehículos</TableCell>
                      <TableCell>Precios diferenciales</TableCell>
                      <TableCell>Facturación</TableCell>
                      <TableCell>Cuenta corriente</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empresas.map((e) => {
                      const expanded = expandedId === e.id;
                      return (
                        <Fragment key={e.id}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton size="small" onClick={() => setExpandedId(expanded ? null : e.id)}>
                                {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell>{e.denominacion}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{e.cuit || '—'}</TableCell>
                            <TableCell>{e.vehiculos.filter((v) => v.activo).length}</TableCell>
                            <TableCell>
                              {e.preciosEmpresa.length > 0 ? `${e.preciosEmpresa.length} servicio(s)` : '—'}
                            </TableCell>
                            <TableCell>
                              <Chip label={e.facturacion === 'ARCA' ? 'ARCA' : 'Interna'} color={e.facturacion === 'ARCA' ? 'success' : 'default'} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={e.cuentaCorrienteHabilitada ? 'Habilitada' : 'No habilitada'}
                                color={e.cuentaCorrienteHabilitada ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => openEditar(e)} title="Editar">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => quitarEmpresa.mutate(e.id)} title="Quitar de empresas">
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={8} sx={{ p: 0, borderBottom: expanded ? undefined : 'none' }}>
                              <Collapse in={expanded} timeout="auto" unmountOnExit>
                                <PreciosEmpresaRow empresa={e} />
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

      <EmpresaFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} empresa={editingEmpresa} />
    </Box>
  );
}
