import { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, RemoveCircleOutline as RemoveIcon } from '@mui/icons-material';
import { useEmpresas, useQuitarEmpresa } from '../api/useEmpresas';
import { Cliente } from '@/features/clientes/api/useClientes';
import EmpresaFormDialog from '../components/EmpresaFormDialog';

export default function EmpresasListPage() {
  const { data: empresas, isLoading } = useEmpresas();
  const quitarEmpresa = useQuitarEmpresa();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Cliente | undefined>(undefined);

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
            Tarifas diferenciales y condición de facturación por volumen de vehículos
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
                      <TableCell>Empresa</TableCell>
                      <TableCell>CUIT</TableCell>
                      <TableCell>Vehículos</TableCell>
                      <TableCell>Descuento</TableCell>
                      <TableCell>Facturación</TableCell>
                      <TableCell>Cuenta corriente</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empresas.map((e) => (
                      <TableRow key={e.id} hover>
                        <TableCell>{e.denominacion}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{e.cuit || '—'}</TableCell>
                        <TableCell>{e.vehiculos.filter((v) => v.activo).length}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{e.descuentoPct != null ? `${e.descuentoPct}%` : '—'}</TableCell>
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
                    ))}
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
