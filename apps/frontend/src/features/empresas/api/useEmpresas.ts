import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Cliente, TipoFacturacion } from '@/features/clientes/api/useClientes';

export interface EmpresaDataInput {
  facturacion: TipoFacturacion;
  cuentaCorrienteHabilitada: boolean;
}

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => (await api.get<Cliente[]>('/clientes/empresas')).data,
  });
}

function useInvalidateEmpresas() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['empresas'] });
    qc.invalidateQueries({ queryKey: ['clientes'] });
  };
}

export function useMarcarComoEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, data }: { clienteId: number; data: EmpresaDataInput }) =>
      (await api.patch<Cliente>(`/clientes/${clienteId}/empresa`, data)).data,
    onSuccess: invalidate,
  });
}

export function useActualizarEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, data }: { clienteId: number; data: EmpresaDataInput }) =>
      (await api.put<Cliente>(`/clientes/${clienteId}/empresa`, data)).data,
    onSuccess: invalidate,
  });
}

export function useQuitarEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async (clienteId: number) => (await api.patch<Cliente>(`/clientes/${clienteId}/empresa/quitar`)).data,
    onSuccess: invalidate,
  });
}

export function useSetPrecioEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, servicioId, precio }: { clienteId: number; servicioId: number; precio: number }) =>
      (await api.put<Cliente>(`/clientes/${clienteId}/empresa/precios/${servicioId}`, { precio })).data,
    onSuccess: invalidate,
  });
}

export function useQuitarPrecioEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, servicioId }: { clienteId: number; servicioId: number }) =>
      (await api.delete<Cliente>(`/clientes/${clienteId}/empresa/precios/${servicioId}`)).data,
    onSuccess: invalidate,
  });
}
