import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type VehiculoTipo = 'CAMION' | 'AUTO';

export interface Vehiculo {
  id: number;
  clienteId: number;
  tipo: VehiculoTipo;
  subtipo: string;
  marca: string | null;
  modelo: string | null;
  patente: string | null;
  activo: boolean;
}

export type TipoFacturacion = 'ARCA' | 'INTERNA';

export interface Cliente {
  id: number;
  denominacion: string;
  telefono: string;
  cuit: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  vehiculos: Vehiculo[];
  // Etapa 3e: una empresa es un cliente con estos campos cargados.
  esEmpresa: boolean;
  descuentoPct: number | null;
  facturacion: TipoFacturacion | null;
  cuentaCorrienteHabilitada: boolean;
}

export interface ClienteContactoInput {
  denominacion: string;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
}

export interface VehiculoInput {
  tipo: VehiculoTipo;
  subtipo: string;
  marca?: string;
  modelo?: string;
  patente?: string;
}

export function useClientes(params: { search?: string; incluirInactivos?: boolean } = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: async () => (await api.get<Cliente[]>('/clientes', { params })).data,
  });
}

export function useCliente(id?: number) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => (await api.get<Cliente>(`/clientes/${id}`)).data,
    enabled: !!id,
  });
}

function useInvalidateClientes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['clientes'] });
}

export function useCreateCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (data: ClienteContactoInput & { vehiculo: VehiculoInput }) =>
      (await api.post<Cliente>('/clientes', data)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClienteContactoInput }) =>
      (await api.put<Cliente>(`/clientes/${id}`, data)).data,
    onSuccess: invalidate,
  });
}

export function useDesactivarCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Cliente>(`/clientes/${id}/desactivar`)).data,
    onSuccess: invalidate,
  });
}

export function useReactivarCliente() {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Cliente>(`/clientes/${id}/reactivar`)).data,
    onSuccess: invalidate,
  });
}
